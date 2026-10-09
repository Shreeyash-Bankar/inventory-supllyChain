import { app, BrowserWindow, ipcMain, session, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SerialPort } from "serialport";
import { ParamService } from "./modules/paramServices.js";
import { getParamMeta, loadParamMeta } from "./modules/paramMeta.js";
import { CommandService } from "./modules/commandServices.js";
import { FlightActionService } from "./modules/flightActionService.js";
import { FlightState } from "./modules/flightState.js";
import { TelemetryEngine } from "./modules/telemetryEngine.js";
import { HardwareCheck } from "./modules/hardwareCheck.js";
import { UdpTransport } from "./modules/udpTransporter.js";
import { CalibrationService } from "./modules/calibrationService.js";
import { CompassCalibrationService } from "./modules/compassCalibrationService.js";
import { CompassMotCalibrationService } from "./modules/compassMotCalibration.js";
import { JoystickService } from "./modules/joystickService.js";
import { Underline } from "lucide-react";
import { FirmwareService } from "./modules/firmware/firmwareService.js";
import {
  scanUSBDevices,
  detectFirmwareTargets,
} from "./modules/firmware/firmwareDetecter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let port;
let startupPacketBuffer = [];
let activeConnection = null; // renamed from port to represent serial or udp
let heartbeatIntervalId = null;
let paramService;
let commandService;
let actionService;
let telemetryEngine = null;
let calibrationService;
let compassCalibrationService;
let compassMotCalibrationService;
let joystickService;
let firmwareService = null;

let connectionState = "DISCONNECTED";

function sendConnectionState(state) {
  connectionState = state;

  if (win) {
    win.webContents.send("connection-state", state);
  }

  console.log(" Connection State:", state);
}

async function releaseActiveConnectionForFirmware() {
  if (!activeConnection) {
    return;
  }

  const connection = activeConnection;
  activeConnection = null;

  if (telemetryEngine) {
    telemetryEngine.stop();
    telemetryEngine = null;
  }

  if (joystickService) {
    await joystickService.stop();
    joystickService = null;
  }

  connection.removeAllListeners();

  if (connection instanceof UdpTransport) {
    connection.close?.();
  } else if (connection.isOpen) {
    await new Promise((resolve, reject) => {
      connection.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  paramService = null;
  commandService = null;
  actionService = null;
}

async function reconnectAfterFirmwareFlash(originalPort, baudRate) {
  console.log("\n===============================================");
  console.log("[FIRMWARE] Reconnecting to flight controller...");
  console.log("===============================================");

  const deadline = Date.now() + 30000;

  while (Date.now() < deadline) {
    let ports = [];

    try {
      ports = await SerialPort.list();
    } catch (error) {
      console.error("[FIRMWARE] Port enumeration failed:", error);

      await new Promise((resolve) => setTimeout(resolve, 500));

      continue;
    }

    const candidates = [
      originalPort,
      ...ports.map((p) => p.path).filter((p) => p && p !== originalPort),
    ];

    /*
     * Remove duplicates.
     */
    const uniqueCandidates = [...new Set(candidates)];

    console.log("[FIRMWARE] Available reconnect candidates:", uniqueCandidates);

    for (const candidate of uniqueCandidates) {
      console.log(`[FIRMWARE] Trying ${candidate}...`);

      const connected = await new Promise((resolve) => {
        let settled = false;

        const finish = (result) => {
          if (settled) return;

          settled = true;

          clearTimeout(timeout);

          resolve(result);
        };

        /*
         * Give attachConnectionEvents enough time to
         * receive MAVLink after the FC boots.
         */
        const timeout = setTimeout(() => {
          console.log(`[FIRMWARE] ${candidate} did not produce MAVLink.`);

          try {
            if (activeConnection) {
              const connection = activeConnection;

              activeConnection = null;

              connection.removeAllListeners();

              if (connection.isOpen) {
                connection.close(() => {
                  finish(false);
                });
              } else {
                finish(false);
              }
            } else {
              finish(false);
            }
          } catch {
            finish(false);
          }
        }, 5000);

        try {
          const connection = new SerialPort({
            path: candidate,
            baudRate: Number(baudRate) || 115200,
            autoOpen: false,
          });

          connection.once("error", (error) => {
            console.log(`[FIRMWARE] ${candidate} open error:`, error.message);

            finish(false);
          });

          activeConnection = connection;

          attachConnectionEvents(connection, {
            onConnected: () => {
              console.log(`[FIRMWARE] MAVLink detected on ${candidate}.`);

              finish(true);
            },
          });

          connection.open((error) => {
            if (error) {
              console.log(
                `[FIRMWARE] Could not open ${candidate}:`,
                error.message,
              );

              finish(false);
            }
          });
        } catch (error) {
          console.log(
            `[FIRMWARE] Failed to create connection for ${candidate}:`,
            error.message,
          );

          finish(false);
        }
      });

      if (connected) {
        console.log(
          `[FIRMWARE] Flight controller successfully reconnected on ${candidate}.`,
        );

        return true;
      }
    }

    /*
     * The FC may still be rebooting or Windows may still be
     * enumerating the USB device.
     */
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.error(
    "[FIRMWARE] Could not reconnect to flight controller after firmware flash.",
  );

  sendConnectionState("ERROR");

  return false;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // preload: path.join(__dirname, "preload.js"),

      preload: path.join(app.getAppPath(), "electron/main/preload.js"),
    },
  });
  win.maximize();
  win.setMenuBarVisibility(false);
  if (app.isPackaged) {
    win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
    // win.webContents.openDevTools();
  }

  // win.loadURL("http://localhost:5173");
  // win.webContents.openDevTools();
}

function attachConnectionEvents(connection, options = {}) {
  const { onConnected } = options;
  const isUdp = connection instanceof UdpTransport;
  const label = isUdp ? "[MAIN-UDP]" : "[MAIN-SERIAL]";

  connection.on("open", () => {
    console.log(
      `${label}  Link physically established. Starting MAVLink validation sniffer...`,
    );

    const heartbeatTimeout = setTimeout(() => {
      if (connectionState === "CONNECTING") {
        console.error(
          `${label}  VERIFICATION TIMEOUT: No MAVLink packets matched within deadline.`,
        );
        if (isUdp) {
          console.error(
            `${label}  TIP: Make sure your Simulator/Drone is actively streaming packets to local port ${connection.localPort}.`,
          );
        }
        sendConnectionState("ERROR");
        if (connection.isOpen) connection.close();
      }
    }, 15000); // 15 seconds ideal for safe network handshakes

    const sniffer = (data) => {
      // Save every chunk that arrives before TelemetryEngine starts
      startupPacketBuffer.push(Buffer.from(data));

      console.log(
        `${label}  Sniffer processing incoming buffer chunk of size: ${data.length} bytes`,
      );

      const hasMavlink = data.some((byte) => byte === 0xfe || byte === 0xfd);

      if (hasMavlink) {
        console.log(
          `${label}  MAVLINK VALIDATED! Magic preamble match found. Orchestrating services...`,
        );
        clearTimeout(heartbeatTimeout);
        connection.removeListener("data", sniffer);

        sendConnectionState("CONNECTED");

        if (typeof onConnected === "function") {
          onConnected(connection);
        }

        paramService = new ParamService(connection, win);

        commandService = new CommandService(connection, win);
        console.log("Command Service Started");
        joystickService = new JoystickService(commandService);
        console.log("Joystick Service Started");

        // joystickService.start();
        compassCalibrationService = new CompassCalibrationService(
          commandService,
          win,
        );
        compassMotCalibrationService = new CompassMotCalibrationService(
          commandService,
          win,
        );
        const flightState = new FlightState(win);
        const hardwareCheck = new HardwareCheck(win);
        calibrationService = new CalibrationService(commandService, win);

        actionService = new FlightActionService(
          commandService,
          paramService,
          flightState,
        );

        telemetryEngine = new TelemetryEngine({
          port: connection,
          win,
          flightState,
          paramService,
          commandService,
          hardwareCheck,
          calibrationService,
          compassCalibrationService,
          compassMotCalibrationService,
        });

        console.log(`${label}  Starting Telemetry Engine updates...`);
        telemetryEngine.start();

        // Replay all packets received during startup
        for (const chunk of startupPacketBuffer) {
          telemetryEngine.onData(chunk);
        }

        startupPacketBuffer = [];

        if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);

        heartbeatIntervalId = setInterval(() => {
          if (connection.isOpen) {
            // Option A: Call a method inside your commandService if it exists
            if (typeof commandService?.sendHeartbeat === "function") {
              commandService.sendHeartbeat();
            } else {
              // Option B: Manual fallback if your commandService doesn't have it yet.
              // This is a minimal MAVLink v1 Heartbeat byte buffer structure (System ID: 255, Component ID: 190)
              const gcsHeartbeatBuffer = Buffer.from([
                0xfe, // MAVLink 1 Magic Byte
                0x09, // Payload Length (9 bytes)
                0x00, // Packet Sequence
                0xff, // System ID (255 = Ground Control Station)
                0xbe, // Component ID (190 = Custom GCS Component)
                0x00, // Message ID (0 = HEARTBEAT)
                0x00,
                0x00,
                0x00,
                0x00, // Custom Mode (4 bytes)
                0x06, // Type (6 = MAV_TYPE_GCS)
                0x03, // Autopilot (3 = MAV_AUTOPILOT_ARDUPILOTMEGA)
                0x00, // Base Mode
                0x00, // System Status
                0x03, // MAVLink Version (3)
                0x1c,
                0x5c, // MAVLink CRC Checksum
              ]);

              connection.write(gcsHeartbeatBuffer);
            }
          }
        }, 1000); // Sends every 1 second

        setTimeout(() => {
          console.log(
            `${label}  Requesting MAVLink streams from drone target...`,
          );
          commandService?.requestStreams();
          // commandService?.requestStatusText();
        }, 200);
      } else {
        console.log(
          `${label}  Raw bytes received but missing MAVLink magic headers (0xFE/0xFD). Skipping chunk.`,
        );
      }
    };

    connection.on("data", sniffer);
  });

  connection.on("close", () => {
    console.log(`${label}  Connection event 'close' emitted.`);
    sendConnectionState("DISCONNECTED");
  });

  connection.on("error", (err) => {
    console.error(`${label}  Transport error fired:`, err);
    sendConnectionState("ERROR");
  });
}

app.whenReady().then(async () => {
  createWindow();

  firmwareService = new FirmwareService({
    win,
  });

  await loadParamMeta();

  await new Promise((r) => setTimeout(r, 500));

  // Optional initial USB scan
  try {
    await scanUSBDevices();
  } catch (err) {
    console.error("[FIRMWARE] Initial USB scan failed:", err);
  }
});

ipcMain.handle("get-ports", async () => {
  const ports = await SerialPort.list();

  return ports.map((p) => ({
    path: p.path,
    name: p.friendlyName || p.manufacturer || "Unknown",
  }));
});

// Add this near your app.whenReady()
SerialPort.list().then(() => {
  // Listen for physical hardware changes
  process.on("uncaughtException", (err) => {
    if (err.message.includes("removed")) {
      console.log(" Hardware change detected");
      // You can trigger a port refresh here if you want
      if (win && !win.isDestroyed()) {
        win.webContents.send("usb-hardware-change");
      }
    }
  });
});

ipcMain.on("connect-port", async (event, payload) => {
  try {
    const { type, path, baudRate, localPort } = payload || {};
    sendConnectionState("CONNECTING");

    if (type === "UDP") {
      console.log(` Initializing UDP Transport on port ${localPort}`);
      activeConnection = new UdpTransport({ localPort });
      attachConnectionEvents(activeConnection);
      activeConnection.open();
    } else {
      // Fallback to default Serial behavior
      if (!path || typeof path !== "string") {
        throw new Error("Invalid serial port path");
      }
      activeConnection = new SerialPort({
        path,
        baudRate: baudRate || 115200,
      });
      attachConnectionEvents(activeConnection);
    }
  } catch (err) {
    console.error("Connection setup error:", err);
    sendConnectionState("ERROR");
  }
});

ipcMain.on("request-params", () => {
  console.log(" request-params received");
  if (paramService) {
    paramService.requestAll();
  } else {
    console.log(" paramService not ready");
  }
});

ipcMain.on("set-param", (_, payload) => {
  if (!paramService) return;
  paramService.setParam(payload);
});

ipcMain.handle("get-param-meta", () => {
  return getParamMeta();
});

ipcMain.handle("disconnect-port", async () => {
  try {
    sendConnectionState("DISCONNECTING");

    if (telemetryEngine) {
      telemetryEngine.stop();
      telemetryEngine = null;
    }

    if (joystickService) {
      await joystickService.stop();
      joystickService = null;
    }

    if (!activeConnection) {
      sendConnectionState("DISCONNECTED");
      return true;
    }

    const connection = activeConnection;

    // Remove reference immediately so nothing else
    // tries to use this connection.
    activeConnection = null;

    connection.removeAllListeners();

    // UDP does not need serial close()
    if (connection instanceof UdpTransport) {
      try {
        connection.close?.();
      } catch (err) {
        console.warn("[MAIN-SERIAL] UDP close error:", err);
      }

      paramService = null;
      commandService = null;
      actionService = null;

      sendConnectionState("DISCONNECTED");

      return true;
    }

    // ----------------------------------------------------------
    // SERIAL PORT
    // ----------------------------------------------------------

    if (typeof connection.close !== "function") {
      paramService = null;
      commandService = null;
      actionService = null;

      sendConnectionState("DISCONNECTED");

      return true;
    }

    if (!connection.isOpen) {
      paramService = null;
      commandService = null;
      actionService = null;

      sendConnectionState("DISCONNECTED");

      return true;
    }

    // IMPORTANT:
    // Wait until the COM port is ACTUALLY closed.
    await new Promise((resolve, reject) => {
      connection.close((error) => {
        if (error) {
          console.error("[MAIN-SERIAL] Error closing serial port:", error);

          reject(error);
          return;
        }

        console.log("[MAIN-SERIAL] Serial port closed.");

        resolve();
      });
    });

    paramService = null;
    commandService = null;
    actionService = null;

    sendConnectionState("DISCONNECTED");

    return true;
  } catch (err) {
    console.error("[MAIN-SERIAL] Disconnection error:", err);

    sendConnectionState("ERROR");

    throw err;
  }
});

ipcMain.on("start-accel-calibration", async () => {
  await calibrationService.start();
  // console.log("calibration hitted the main");
});

ipcMain.on("start-level-calibration", async () => {
  await calibrationService.startLevelCalib();
  console.log("hitted the main.js for only level calibration");
});

ipcMain.on("confirm-accel-position", async () => {
  await calibrationService.confirmPosition();
});

ipcMain.on("start-compass-calibration", async () => {
  await compassCalibrationService?.start();
});

ipcMain.on("cancel-compass-calibration", async () => {
  await compassCalibrationService?.cancel();
});

ipcMain.on("start-compassmot-calibration", async () => {
  console.log(" IPC START COMPASSMOT");

  await compassMotCalibrationService?.startCompassMot();
});

ipcMain.on("set-throttle", async (_, throttlePercentage) => {
  await compassMotCalibrationService?.handleUserThrottleInput(
    throttlePercentage,
  );
});

ipcMain.on("stop-compassmot-calibration", async () => {
  await compassMotCalibrationService?.stopCompassMot();
});

ipcMain.on("restart-FC", async () => {
  await commandService?.rebootFC();
});

ipcMain.on("reboot-to-bootloader", async () => {
  console.log("[IPC-MAIN] Reboot to bootloader requested.");

  if (!commandService) {
    console.error(
      "[IPC-MAIN] Cannot reboot to bootloader: CommandService is not ready.",
    );
    return;
  }

  try {
    await commandService.rebootToBootloader();

    console.log("[IPC-MAIN] Reboot-to-bootloader command sent successfully.");
  } catch (error) {
    console.error("[IPC-MAIN] Reboot-to-bootloader failed:", error);
  }
});

ipcMain.on("joystick-enable", () => {
  joystickService?.start();
});

ipcMain.on("joystick-disable", () => {
  joystickService?.stop();
});

ipcMain.on("joystick-update", (_, joystick) => {
  console.log("[IPC] JOYSTICK UPDATE:", joystick);
  joystickService?.updateAxes(joystick);
});

ipcMain.on("joystick-update-config", (_, config) => {
  if (joystickService) {
    // Inject the customizable lookup configuration dynamically into the running service
    joystickService.setConfiguration(config);
  }
});

// ============================================================
// FIRMWARE / HARDWARE DISCOVERY
// ============================================================

ipcMain.handle("firmware-select-file", async () => {
  if (!win) {
    throw new Error("Main window is not available.");
  }

  const result = await dialog.showOpenDialog(win, {
    title: "Select Firmware File",

    properties: ["openFile"],

    filters: [
      {
        name: "PX4 / ArduPilot Firmware",
        extensions: ["apj"],
      },

      {
        name: "All Files",
        extensions: ["*"],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("firmware-list-usb", async () => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  return await firmwareService.listDevices();
});

ipcMain.handle("firmware-detect-targets", async () => {
  return await detectFirmwareTargets();
});

// ipcMain.handle("firmware-identify", async (_, payload) => {
//   if (!firmwareService) {
//     throw new Error("FirmwareService not initialized");
//   }

//   if (!payload?.path) {
//     throw new Error("Missing serial port path");
//   }

//   const baudRate = Number(payload.baudRate) || 115200;

//   return await firmwareService.identify(payload.path, baudRate);
// });

ipcMain.handle("firmware-identify", async (_, payload) => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  if (!payload?.path) {
    throw new Error("Missing serial port path");
  }

  const baudRate = Number(payload.baudRate) || 115200;

  await releaseActiveConnectionForFirmware();

  return await firmwareService.identify(payload.path, baudRate);
});

ipcMain.handle("firmware-flash", async (_, payload) => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  if (!payload?.path) {
    throw new Error("Serial port is required.");
  }

  if (!payload?.firmwarePath) {
    throw new Error("Firmware file is required.");
  }

  console.log("\n================================================");

  console.log("             FIRMWARE FLASH REQUEST");

  console.log("================================================");

  console.log("Port:", payload.path);

  console.log("Firmware:", payload.firmwarePath);

  console.log("Baudrate:", payload.baudRate);

  // ========================================================
  // IMPORTANT
  // Make absolutely sure the normal Electron serial
  // connection is closed BEFORE Python starts.
  // ========================================================

  if (activeConnection) {
    console.log("[FIRMWARE] Closing active connection before flashing...");

    await new Promise(async (resolve, reject) => {
      try {
        const connection = activeConnection;

        activeConnection = null;

        // Stop telemetry
        if (telemetryEngine) {
          telemetryEngine.stop();
          telemetryEngine = null;
        }

        // Stop joystick
        if (joystickService) {
          await joystickService.stop();
          joystickService = null;
        }

        // Remove listeners
        connection.removeAllListeners();

        // UDP
        if (connection instanceof UdpTransport) {
          try {
            connection.close?.();
          } catch (err) {
            console.warn("[FIRMWARE] UDP close error:", err);
          }

          resolve();
          return;
        }

        // Serial already closed
        if (!connection.isOpen) {
          resolve();
          return;
        }

        console.log("[FIRMWARE] Closing serial port:", payload.path);

        connection.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          console.log("[FIRMWARE] Serial port successfully closed.");

          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });

    paramService = null;
    commandService = null;
    actionService = null;

    console.log("[FIRMWARE] Serial connection released.");
  }

  // ========================================================
  // NOW START PYTHON
  // ========================================================

  console.log("[FIRMWARE] Starting uploader...");

  const result = await firmwareService.flash({
    path: payload.path,

    firmwarePath: payload.firmwarePath,

    baudRate: Number(payload.baudRate) || 115200,

    flashBaudRate: payload.flashBaudRate ? Number(payload.flashBaudRate) : null,

    force: payload.force === true,

    fullErase: payload.fullErase === true,
  });

  console.log("[FIRMWARE] Flash result:", result);

  // if (result?.success) {
  //   console.log(
  //     "[FIRMWARE] Firmware flash succeeded. Waiting for FC to reconnect...",
  //   );

  //   const reconnected = await reconnectAfterFirmwareFlash(
  //     payload.path,
  //     Number(payload.baudRate) || 115200,
  //   );

  //   if (!reconnected) {
  //     console.error(
  //       "[FIRMWARE] Firmware was flashed, but the FC could not be reconnected.",
  //     );

  //     return {
  //       ...result,
  //       reconnected: false,
  //     };
  //   }

  //   console.log(
  //     "[FIRMWARE] Firmware flash + telemetry reconnection completed.",
  //   );

  //   return {
  //     ...result,
  //     reconnected: true,
  //   };
  // }

  return result;
});

ipcMain.handle("firmware-cancel", async () => {
  if (!firmwareService) {
    return false;
  }

  await firmwareService.cancel();

  return true;
});

ipcMain.handle("firmware-reconnect", async (_, payload) => {
  if (!payload?.port) {
    throw new Error("Serial port is required.");
  }

  const baudRate = Number(payload.baudRate) || 115200;

  console.log("\n===============================================");
  console.log("[FIRMWARE] MANUAL RECONNECT REQUEST");
  console.log("===============================================");
  console.log("[FIRMWARE] Port:", payload.port);
  console.log("[FIRMWARE] Baudrate:", baudRate);

  // Make sure there is no old connection hanging around.
  if (activeConnection) {
    console.log("[FIRMWARE] Existing connection found. Releasing it first...");

    await releaseActiveConnectionForFirmware();
  }

  sendConnectionState("CONNECTING");

  const reconnected = await reconnectAfterFirmwareFlash(payload.port, baudRate);

  if (!reconnected) {
    console.error("[FIRMWARE] Manual reconnect failed.");

    return {
      success: false,
      reconnected: false,
    };
  }

  console.log("[FIRMWARE] Manual reconnect successful.");

  return {
    success: true,
    reconnected: true,
  };
});

ipcMain.on("flight-command", async (_, data) => {
  console.log(" [IPC-MAIN] flight-command payload received:", data);
  if (!commandService || !actionService) {
    console.error(" [IPC-MAIN] CommandService is not active or ready.");
    return;
  }

  const { cmd, payload } = data;
  console.log("Payload from main.js", payload);

  try {
    switch (cmd) {
      case "ARM":
        console.log(" [MAV-EXECUTE] Dispatching hardware arm command...");
        return await commandService.arm(false);

      case "FORCE_ARM":
        console.log(" Executing Force Arm");
        return await commandService.arm(true);

      case "DISARM":
        console.log(" [MAV-EXECUTE] Dispatching hardware disarm command...");
        return await commandService.disarm();

      case "FORCE_DISARM":
        console.log("Executing Force Disarm");
        return await commandService.disarm(true);

      case "SET_MODE":
        if (payload !== undefined && payload !== null) {
          console.log(
            ` [MAV-EXECUTE] Routing flight mode modification to integer ID: ${payload}`,
          );
          return await commandService.setMode(Number(payload));
        }
        console.error(
          " [IPC-MAIN] Error: Received SET_MODE command missing numeric payload.",
        );
        break;

      case "RTL":
        // return await commandService.rtl();
        return await commandService.setMode(6);

      case "LAND":
        // return await commandService.land();
        return await commandService.setMode(9);

      case "TAKEOFF":
        // return await commandService.takeoff(payload?.alt);
        const targetAlt = Number(payload?.alt);
        // return await commandService.takeoff(payload?.alt);
        return await commandService.takeoff(targetAlt);

      case "GUIDED":
        console.log(
          "[GUIDED PROCESS] Shifting Autopilot to Guided Mode (4)...",
        );
        await commandService.setMode(4);

        if (payload && payload.lat !== undefined && payload.lon !== undefined) {
          const altitudeTarget = Number(payload.alt || 10);

          // Check if you passed a special flag indicating the vehicle is already flying
          if (payload.isAirborne) {
            console.log(
              `[GUIDED ROUTE] Mid-air adjustment. Flying to map target point: Lat=${payload.lat}, Lon=${payload.lon}, Alt=${altitudeTarget}`,
            );
            await commandService.setGuidedPosition(
              payload.lat,
              payload.lon,
              altitudeTarget,
            );
          } else {
            console.log(
              `[GUIDED ROUTE] Ground state takeoff initiated. Hovering vertically to target altitude: ${altitudeTarget}m`,
            );

            // Perform initial launch sequence safely in place without tracking horizontal drift
            await commandService.takeoff(altitudeTarget);
          }
        }
        break;

      default:
        console.warn(" [IPC-MAIN] Unhandled command profile key string:", cmd);
    }
  } catch (err) {
    console.error(
      ` [MAVLink-ERROR] Execution failure under command scope [${cmd}]:`,
      err,
    );
  }
});

ipcMain.on("joystick-enable", () => {
  if (!joystickService) {
    console.warn("[JOYSTICK] Service is not initialized");
    return;
  }

  console.log("[JOYSTICK] ENABLED");

  joystickService.start();

  win?.webContents.send("joystick-state", {
    enabled: true,
  });
});

ipcMain.on("joystick-disable", async () => {
  if (!joystickService) {
    console.warn("[JOYSTICK] Service is not initialized");
    return;
  }

  console.log("[JOYSTICK] DISABLED");

  await joystickService.stop();

  win?.webContents.send("joystick-state", {
    enabled: false,
  });
});
