import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SerialPort } from "serialport";
// import { startTelemetry, stopTelemetry } from "./modules/telemetry.js";
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

function attachConnectionEvents(connection) {
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

        paramService = new ParamService(connection, win);

        commandService = new CommandService(connection, win);
        console.log("Command Service Started");
        joystickService = new JoystickService(commandService);
        console.log("Joystick Service Started");
        // joystickService.start(1133, 49693);
        joystickService.start();
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

// app.whenReady().then(async () => {
//   createWindow();
//   await loadParamMeta();
//   await new Promise((r) => setTimeout(r, 500));
// });

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

// app.whenReady().then(async () => {
//   // Increase Chromium's HTTP cache size (optional)
//   try {
//     await session.defaultSession.setCacheSize(1024 * 1024 * 1024); // 1 GB
//   } catch (err) {
//     console.log("Could not set cache size:", err);
//   }

//   createWindow();

//   await loadParamMeta();
//   await new Promise((r) => setTimeout(r, 500));
// });

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

ipcMain.on("disconnect-port", async () => {
  try {
    sendConnectionState("DISCONNECTING");

    if (telemetryEngine) {
      telemetryEngine.stop();
      telemetryEngine = null;
    }
    if (joystickService?.stop()) {
      await joystickService?.stop();
      joystickService = null;
    }

    if (activeConnection) {
      // Only drain if it is a serial port instance
      if (
        typeof activeConnection.drain === "function" &&
        activeConnection.isOpen &&
        !(activeConnection instanceof UdpTransport)
      ) {
        activeConnection.drain();
      }

      activeConnection.removeAllListeners();

      if (activeConnection.isOpen) {
        activeConnection.close(() => {
          activeConnection = null;
          paramService = null;
          commandService = null;
          actionService = null;
          // joystickService = null;
          sendConnectionState("DISCONNECTED");
        });
      } else {
        activeConnection = null;
        sendConnectionState("DISCONNECTED");
      }
    } else {
      sendConnectionState("DISCONNECTED");
    }
  } catch (err) {
    console.error("Disconnection error:", err);
    sendConnectionState("ERROR");
  }
});

// ipcMain.on("flight-command", async (_, data) => {
//   console.log("[IPC MAIN] flight command received", data)
//   if (!actionService || !commandService) return;

//   const { cmd, payload } = data;

//   switch (cmd) {
//     case "ARM":
//       return actionService.arm();

//     case "DISARM":
//       return actionService.disarm();

//     case "RTL":
//       return actionService.rtl();

//     case "LAND":
//       return actionService.land();

//     case "TAKEOFF":
//       return actionService.takeoff(payload?.alt);

//     case "GUIDED":
//       return actionService.flyTo(payload.lat, payload.lon, payload.alt);

//     case "AUTO":
//       return actionService.setMode("AUTO");

//     case "STABILIZE":
//       return actionService.setMode("STABILIZE");
//     default:
//       console.log("Unknown command:", cmd);
//   }
// });

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

ipcMain.handle("firmware-list-usb", async () => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  return await firmwareService.listDevices();
});

ipcMain.handle("firmware-detect-targets", async () => {
  return await detectFirmwareTargets();
});

ipcMain.handle("firmware-identify", async (_, payload) => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  if (!payload?.path) {
    throw new Error("Missing serial port path");
  }

  return await firmwareService.identify(payload.path);
});

ipcMain.handle("firmware-flash", async (_, payload) => {
  if (!firmwareService) {
    throw new Error("FirmwareService not initialized");
  }

  console.log("\n================================================");

  console.log("             FIRMWARE FLASH REQUEST");

  console.log("================================================");

  console.log("Payload:", payload);

  const result = await firmwareService.flash({
    path: payload.path,

    firmwarePath: payload.firmwarePath,

    force: payload.force === true,

    fullErase: payload.fullErase === true,
  });

  console.log("Firmware flash result:", result);

  return result;
});

ipcMain.handle("firmware-cancel", async () => {
  if (!firmwareService) {
    return false;
  }

  await firmwareService.cancel();

  return true;
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
        return await commandService.arm();

      case "DISARM":
        console.log(" [MAV-EXECUTE] Dispatching hardware disarm command...");
        return await commandService.disarm();

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

          // console.log(
          //   `[GUIDED ROUTE] Transmitting destination coordinates targets: Lat=${payload.lat}, Lon=${payload.lon}, Alt=${altitudeTarget}`,
          // )

          // await commandService.takeoff(
          //   // payload.lat,
          //   // payload.lon,
          //   altitudeTarget
          // )

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

//////////////////////////////////////////////////////

// ipcMain.on("disconnect-port", async () => {
//   try {
//     sendConnectionState("DISCONNECTING");

//     if (telemetryEngine) {
//       telemetryEngine.stop();
//       telemetryEngine = null;
//     }

//     // 🎯 SAFETY FIX: Force the 50Hz transmission loop to turn off immediately!
//     if (joystickService) {
//       await joystickService.stop(); // Clears setInterval and sends a final safe neutral PWM packet
//       joystickService.setCommandService(null); // Safely detach the old command pointer
//     }

//     if (activeConnection) {
//       if (
//         typeof activeConnection.drain === "function" &&
//         activeConnection.isOpen &&
//         !(activeConnection instanceof UdpTransport)
//       ) {
//         activeConnection.drain();
//       }

//       activeConnection.removeAllListeners();

//       if (activeConnection.isOpen) {
//         activeConnection.close(() => {
//           activeConnection = null;
//           paramService = null;
//           commandService = null;
//           actionService = null;

//           // ⚠️ DO NOT set joystickService = null here anymore.
//           // It is completely asleep and idle now, consuming 0% CPU.

//           sendConnectionState("DISCONNECTED");
//         });
//       } else {
//         activeConnection = null;
//         sendConnectionState("DISCONNECTED");
//       }
//     } else {
//       sendConnectionState("DISCONNECTED");
//     }
//   } catch (err) {
//     console.error("Disconnection error:", err);
//     sendConnectionState("ERROR");
//   }
// });
//////////////////////////////////////
////////////////////////////////
////////////////////////////////////
//////////////////////////////////////

// import { app, BrowserWindow, ipcMain } from "electron";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import { SerialPort } from "serialport";
// import { ParamService } from "./modules/paramServices.js";
// import { getParamMeta, loadParamMeta } from "./modules/paramMeta.js";
// import { CommandService } from "./modules/commandServices.js";
// import { FlightActionService } from "./modules/flightActionService.js";
// import { FlightState } from "./modules/flightState.js";
// import { TelemetryEngine } from "./modules/telemetryEngine.js";
// import { HardwareCheck } from "./modules/hardwareCheck.js";
// import { UdpTransport } from "./modules/udpTransporter.js";
// import { CalibrationService } from "./modules/calibrationService.js";
// import { CompassCalibrationService } from "./modules/compassCalibrationService.js";
// import { CompassMotCalibrationService } from "./modules/compassMotCalibration.js";
// import { JoystickService } from "./modules/joystickService.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// let win;
// let activeConnection = null;
// let heartbeatIntervalId = null;
// let paramService;
// let commandService;
// let actionService;
// let telemetryEngine = null;
// let calibrationService;
// let compassCalibrationService;
// let compassMotCalibrationService;
// let joystickService;

// let connectionState = "DISCONNECTED";

// function sendConnectionState(state) {
//   connectionState = state;
//   if (win && !win.isDestroyed()) {
//     win.webContents.send("connection-state", state);
//   }
//   console.log(" Connection State:", state);
// }

// function createWindow() {
//   win = new BrowserWindow({
//     width: 1000,
//     height: 800,
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       preload: path.join(app.getAppPath(), "electron/main/preload.js"),
//     },
//   });

//   if (app.isPackaged) {
//     win.loadFile(path.join(app.getAppPath(), "dist/index.html"));
//   } else {
//     win.loadURL("http://localhost:5173");
//     win.webContents.openDevTools();
//   }
// }

// function attachConnectionEvents(connection) {
//   const isUdp = connection instanceof UdpTransport;
//   const label = isUdp ? "[MAIN-UDP]" : "[MAIN-SERIAL]";
//   let isServicePipelineReady = false;

//   connection.on("open", () => {
//     console.log(
//       `${label} Link physically established. Immediate telemetry routing active.`,
//     );

//     // 🚀 FIXED: Initialize flight state tracking structures instantly on hardware connection open
//     const flightState = new FlightState(win);
//     const hardwareCheck = new HardwareCheck(win);

//     telemetryEngine = new TelemetryEngine({
//       port: connection,
//       win,
//       flightState,
//       hardwareCheck,
//       paramService: null,
//       commandService: null,
//       calibrationService: null,
//       compassCalibrationService: null,
//       compassMotCalibrationService: null,
//     });

//     telemetryEngine.start();
//     isServicePipelineReady = true;

//     const heartbeatTimeout = setTimeout(() => {
//       if (connectionState === "CONNECTING") {
//         console.error(
//           `${label} VERIFICATION TIMEOUT: No MAVLink packets matched within deadline.`,
//         );
//         sendConnectionState("ERROR");
//         if (connection.isOpen) connection.close();
//       }
//     }, 15000);

//     // FIXED: Central baseline data router loops raw buffers directly down into our active parsers
//     const dataRouter = (data) => {
//       if (isServicePipelineReady && telemetryEngine) {
//         telemetryEngine.handleRawData(data);
//       }

//       if (connectionState === "CONNECTING") {
//         const hasMavlink = data.some((byte) => byte === 0xfe || byte === 0xfd);

//         if (hasMavlink) {
//           console.log(
//             `${label} MAVLINK VALIDATED! Orchestrating transaction modules...`,
//           );
//           clearTimeout(heartbeatTimeout);
//           sendConnectionState("CONNECTED");

//           // Initialize downstream control modules
//           paramService = new ParamService(connection, win);
//           commandService = new CommandService(connection, win);
//           joystickService = new JoystickService(commandService);
//           joystickService.start();

//           calibrationService = new CalibrationService(commandService, win);
//           compassCalibrationService = new CompassCalibrationService(
//             commandService,
//             win,
//           );
//           compassMotCalibrationService = new CompassMotCalibrationService(
//             commandService,
//             win,
//           );
//           actionService = new FlightActionService(
//             commandService,
//             paramService,
//             flightState,
//           );

//           // Update active live object references into the running telemetry worker dynamically
//           telemetryEngine.paramService = paramService;
//           telemetryEngine.commandService = commandService;
//           telemetryEngine.calibrationService = calibrationService;
//           telemetryEngine.compassCalibrationService = compassCalibrationService;
//           telemetryEngine.compassMotCalibrationService =
//             compassMotCalibrationService;

//           // Orchestrate Ground Control Station Heartbeats
//           if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
//           heartbeatIntervalId = setInterval(() => {
//             if (connection.isOpen) {
//               if (typeof commandService?.sendHeartbeat === "function") {
//                 commandService.sendHeartbeat();
//               } else {
//                 const gcsHeartbeatBuffer = Buffer.from([
//                   0xfe, 0x09, 0x00, 0xff, 0xbe, 0x00, 0x00, 0x00, 0x00, 0x00,
//                   0x06, 0x03, 0x00, 0x00, 0x03, 0x1c, 0x5c,
//                 ]);
//                 connection.write(gcsHeartbeatBuffer);
//               }
//             }
//           }, 1000);

//           // Synchronize data stream transmission tables on hardware boot
//           setTimeout(() => {
//             console.log(
//               `${label} Requesting MAVLink payload transmission channels...`,
//             );
//             commandService?.requestStreams();
//           }, 100);
//         }
//       }
//     };

//     connection.on("data", dataRouter);
//   });

//   connection.on("close", () => {
//     console.log(`${label} Connection handler layer detached.`);
//     isServicePipelineReady = false;
//     if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
//     sendConnectionState("DISCONNECTED");
//   });

//   connection.on("error", (err) => {
//     console.error(`${label} Hardware link interface error fired:`, err);
//     sendConnectionState("ERROR");
//   });
// }
// // function attachConnectionEvents(connection) {
// //   const isUdp = connection instanceof UdpTransport;
// //   const label = isUdp ? "[MAIN-UDP]" : "[MAIN-SERIAL]";
// //   let isServicePipelineReady = false;

// //   connection.on("open", () => {
// //     console.log(
// //       `${label} Link physically established. Immediate telemetry routing active.`,
// //     );

// //     const flightState = new FlightState(win);
// //     const hardwareCheck = new HardwareCheck(win);

// //     telemetryEngine = new TelemetryEngine({
// //       port: connection,
// //       win,
// //       flightState,
// //       hardwareCheck,
// //       paramService: null,
// //       commandService: null,
// //       calibrationService: null,
// //       compassCalibrationService: null,
// //       compassMotCalibrationService: null,
// //     });

// //     telemetryEngine.start();
// //     isServicePipelineReady = true;

// //     const heartbeatTimeout = setTimeout(() => {
// //       if (connectionState === "CONNECTING") {
// //         console.error(
// //           `${label} VERIFICATION TIMEOUT: No MAVLink packets matched within deadline.`,
// //         );
// //         sendConnectionState("ERROR");
// //         if (connection.isOpen) connection.close();
// //       }
// //     }, 15000);

// //     const dataRouter = (data) => {
// //       if (isServicePipelineReady && telemetryEngine) {
// //         telemetryEngine.handleRawData(data);
// //       }

// //       if (connectionState === "CONNECTING") {
// //         const hasMavlink = data.some((byte) => byte === 0xfe || byte === 0xfd);

// //         if (hasMavlink) {
// //           console.log(
// //             `${label} MAVLINK VALIDATED! Orchestrating transaction modules...`,
// //           );
// //           clearTimeout(heartbeatTimeout);
// //           sendConnectionState("CONNECTED");

// //           // Initialize downstream control modules
// //           paramService = new ParamService(connection, win);
// //           commandService = new CommandService(connection, win);
// //           joystickService = new JoystickService(commandService);
// //           joystickService.start();

// //           calibrationService = new CalibrationService(commandService, win);
// //           compassCalibrationService = new CompassCalibrationService(commandService, win);
// //           compassMotCalibrationService = new CompassMotCalibrationService(commandService, win);
// //           actionService = new FlightActionService(commandService, paramService, flightState);

// //           // Update active live object references into the running telemetry worker dynamically
// //           telemetryEngine.paramService = paramService;
// //           telemetryEngine.commandService = commandService;
// //           telemetryEngine.calibrationService = calibrationService;
// //           telemetryEngine.compassCalibrationService = compassCalibrationService;
// //           telemetryEngine.compassMotCalibrationService = compassMotCalibrationService;

// //           // Orchestrate Ground Control Station Heartbeats
// //           if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
// //           heartbeatIntervalId = setInterval(() => {
// //             if (connection.isOpen) {
// //               if (typeof commandService?.sendHeartbeat === "function") {
// //                 commandService.sendHeartbeat();
// //               } else {
// //                 const gcsHeartbeatBuffer = Buffer.from([
// //                   0xfe, 0x09, 0x00, 0xff, 0xbe, 0x00, 0x00, 0x00, 0x00, 0x00,
// //                   0x06, 0x03, 0x00, 0x00, 0x03, 0x1c, 0x5c,
// //                 ]);
// //                 connection.write(gcsHeartbeatBuffer);
// //               }
// //             }
// //           }, 1000);

// //           // --- 🚀 THE FIX: DELAYED STREAM REQUESTS ---
// //           // This allows the flight controller to finish sending its startup logs completely
// //           setTimeout(() => {
// //             console.log(
// //               `${label} Safe buffer period reached. Requesting active payload streams...`,
// //             );
// //             commandService?.requestStreams();
// //           }, 1500); // 1.5 seconds is ideal for hardware state stabilization
// //         }
// //       }
// //     };

// //     connection.on("data", dataRouter);
// //   });

// //   connection.on("close", () => {
// //     console.log(`${label} Connection handler layer detached.`);
// //     isServicePipelineReady = false;
// //     if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
// //     sendConnectionState("DISCONNECTED");
// //   });

// //   connection.on("error", (err) => {
// //     console.error(`${label} Hardware link interface error fired:`, err);
// //     sendConnectionState("ERROR");
// //   });
// // }

// // --- IPC INFRASTRUCTURE BRIDGE REGISTRATIONS ---

// app.whenReady().then(async () => {
//   createWindow();
//   await loadParamMeta();
//   await new Promise((r) => setTimeout(r, 500));
// });

// ipcMain.handle("get-ports", async () => {
//   const ports = await SerialPort.list();
//   return ports.map((p) => ({
//     path: p.path,
//     name: p.friendlyName || p.manufacturer || "Unknown",
//   }));
// });

// SerialPort.list().then(() => {
//   process.on("uncaughtException", (err) => {
//     if (err.message.includes("removed")) {
//       console.log(" Hardware configuration modified via USB event connection.");
//       if (win && !win.isDestroyed()) {
//         win.webContents.send("usb-hardware-change");
//       }
//     }
//   });
// });

// ipcMain.on("connect-port", async (event, payload) => {
//   try {
//     const { type, path, baudRate, localPort } = payload || {};
//     sendConnectionState("CONNECTING");

//     if (type === "UDP") {
//       console.log(` Initializing UDP Transport on port ${localPort}`);
//       activeConnection = new UdpTransport({ localPort });
//       attachConnectionEvents(activeConnection);
//       activeConnection.open();
//     } else {
//       if (!path || typeof path !== "string") {
//         throw new Error("Invalid serial port configuration path.");
//       }
//       activeConnection = new SerialPort({
//         path,
//         baudRate: baudRate || 115200,
//       });
//       attachConnectionEvents(activeConnection);
//     }
//   } catch (err) {
//     console.error("Link interface configuration exception:", err);
//     sendConnectionState("ERROR");
//   }
// });

// ipcMain.on("request-params", () => {
//   console.log(" request-params channel target intercepted");
//   if (paramService) paramService.requestAll();
// });

// ipcMain.on("set-param", (_, payload) => {
//   if (paramService) paramService.setParam(payload);
// });

// ipcMain.handle("get-param-meta", () => {
//   return getParamMeta();
// });

// ipcMain.on("disconnect-port", async () => {
//   try {
//     sendConnectionState("DISCONNECTING");

//     if (telemetryEngine) {
//       telemetryEngine.stop();
//       telemetryEngine = null;
//     }
//     if (joystickService) {
//       await joystickService.stop();
//       joystickService = null;
//     }

//     if (activeConnection) {
//       if (
//         typeof activeConnection.drain === "function" &&
//         activeConnection.isOpen &&
//         !(activeConnection instanceof UdpTransport)
//       ) {
//         activeConnection.drain();
//       }

//       activeConnection.removeAllListeners();

//       if (activeConnection.isOpen) {
//         activeConnection.close(() => {
//           activeConnection = null;
//           paramService = null;
//           commandService = null;
//           actionService = null;
//           sendConnectionState("DISCONNECTED");
//         });
//       } else {
//         activeConnection = null;
//         sendConnectionState("DISCONNECTED");
//       }
//     } else {
//       sendConnectionState("DISCONNECTED");
//     }
//   } catch (err) {
//     console.error("Disconnection tracking pipeline breakdown:", err);
//     sendConnectionState("ERROR");
//   }
// });

// // ⚡ FIXED: Consolidated unified hardware command router matrix
// ipcMain.on("flight-command", async (_, data) => {
//   console.log(" [IPC-MAIN] Navigation packet command data received:", data);
//   if (!actionService || !commandService) {
//     console.error(
//       " [IPC-MAIN] Downstream mission execution microservices are uninitialized.",
//     );
//     return;
//   }

//   const { cmd, payload } = data;

//   try {
//     switch (cmd) {
//       case "ARM":
//         return await actionService.arm();
//       case "DISARM":
//         return await actionService.disarm();
//       case "RTL":
//         return await actionService.rtl();
//       case "LAND":
//         return await actionService.land();
//       case "TAKEOFF":
//         return await actionService.takeoff(payload?.alt);
//       case "GUIDED":
//         return await actionService.flyTo(
//           payload?.lat,
//           payload?.lon,
//           payload?.alt,
//         );

//       case "AUTO":
//         return await actionService.setMode("AUTO");

//       case "STABILIZE":
//         return await actionService.setMode("STABILIZE");

//       case "SET_MODE":
//         if (payload !== undefined && payload !== null) {
//           return await commandService.setMode(Number(payload));
//         }
//         break;

//       default:
//         console.warn(
//           " [IPC-MAIN] Unhandled command string identifier token:",
//           cmd,
//         );
//     }
//   } catch (err) {
//     console.error(
//       ` [MAVLink-EXEC-ERROR] Execution failure under command loop scope [${cmd}]:`,
//       err,
//     );
//   }
// });

// ipcMain.on("start-accel-calibration", async () => {
//   if (calibrationService) await calibrationService.start();
// });

// ipcMain.on("confirm-accel-position", async () => {
//   if (calibrationService) await calibrationService.confirmPosition();
// });

// ipcMain.on("start-compass-calibration", async () => {
//   await compassCalibrationService?.start();
// });

// ipcMain.on("cancel-compass-calibration", async () => {
//   await compassCalibrationService?.cancel();
// });

// ipcMain.on("start-compassmot-calibration", async () => {
//   await compassMotCalibrationService?.startCompassMot();
// });

// ipcMain.on("set-throttle", async (_, throttlePercentage) => {
//   await compassMotCalibrationService?.handleUserThrottleInput(
//     throttlePercentage,
//   );
// });

// ipcMain.on("stop-compassmot-calibration", async () => {
//   await compassMotCalibrationService?.stopCompassMot();
// });

// ipcMain.on("restart-FC", async () => {
//   await commandService?.rebootFC();
// });

// ipcMain.on("joystick-enable", () => {
//   joystickService?.start();
// });

// ipcMain.on("joystick-disable", () => {
//   joystickService?.stop();
// });

// ipcMain.on("joystick-update", (_, joystick) => {
//   joystickService?.updateAxes(joystick);
// });

// ipcMain.on("joystick-update-config", (_, config) => {
//   if (joystickService) joystickService.setConfiguration(config);
// });
