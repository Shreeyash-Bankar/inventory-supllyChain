// // import { contextBridge, ipcRenderer } from "electron";
// const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld("electron", {
//   getPorts: () => ipcRenderer.invoke("get-ports"),

//   connectPort: (data) => ipcRenderer.send("connect-port", data),

//   requestParams: () => ipcRenderer.send("request-params"),

//   sendJoystick: (data) => ipcRenderer.send("joystick-update", data),

//   enableJoystick: () => ipcRenderer.send("joystick-enable"),

//   disableJoystick: () => ipcRenderer.send("joystick-disable"),

//   updateJoystickConfig: (config) =>
//     ipcRenderer.send("joystick-update-config", config),

//   startAccelCalibration: () => ipcRenderer.send("start-accel-calibration"),

//   startAccelLevelCalibration: () => ipcRenderer.send("start-level-calibration"),

//   confirmAccelPosition: () => ipcRenderer.send("confirm-accel-position"),

//   startCompassMotCalibration: () =>
//     ipcRenderer.send("start-compassmot-calibration"),

//   stopCompassMot: () => ipcRenderer.send("stop-compassmot-calibration"),

//   setThrottle: (throttlePercentage) =>
//     ipcRenderer.send("set-throttle", throttlePercentage),

//   restartFc: () => ipcRenderer.send("restart-FC"),

//   onCompassMotStatus: (cb) => {
//     const handler = (_, data) => cb(data);

//     ipcRenderer.on("compassmot-status", handler);

//     return () => ipcRenderer.removeListener("compassmot-status", handler);
//   },

//   onAccelCalibrationStatus: (cb) => {
//     const handler = (_, data) => cb(data);

//     ipcRenderer.on("accel-calibration-status", handler);

//     return () =>
//       ipcRenderer.removeListener("accel-calibration-status", handler);
//   },

//   startCompassCalibration: () => ipcRenderer.send("start-compass-calibration"),

//   cancelCompassCalibration: () =>
//     ipcRenderer.send("cancel-compass-calibration"),

//   onCompassCalibrationStatus: (cb) => {
//     const handler = (_, data) => cb(data);

//     ipcRenderer.on("compass-calibration-status", handler);

//     return () =>
//       ipcRenderer.removeListener("compass-calibration-status", handler);
//   },

//   onParam: (cb) => {
//     const handler = (_, data) => cb(data);
//     ipcRenderer.on("param", handler);

//     return () => {
//       ipcRenderer.removeListener("param", handler);
//     };
//   },

//   onParamComplete: (cb) => {
//     const handler = (_, data) => cb(data);
//     ipcRenderer.on("param-complete", handler);

//     return () => {
//       ipcRenderer.removeListener("param-complete", handler);
//     };
//   },

//   setParam: (data) => ipcRenderer.send("set-param", data),

//   getParamMeta: () => ipcRenderer.invoke("get-param-meta"),

//   onConnectionState: (cb) => {
//     const handler = (_, state) => cb(state);

//     ipcRenderer.on("connection-state", handler);

//     return () => {
//       ipcRenderer.removeListener("connection-state", handler);
//     };
//   },

//   onTelemetry: (cb) => {
//     const handler = (_, data) => cb(data);
//     ipcRenderer.on("telemetry", handler);

//     // cleanup function (important for React)
//     return () => {
//       ipcRenderer.removeListener("telemetry", handler);
//     };
//   },

//   onHardwareStatus: (cb) => {
//     const handler = (_, data) => cb(data);

//     ipcRenderer.on("hardware-status", handler);

//     //cleanup function
//     return () => {
//       ipcRenderer.removeListener("hardware-status", handler);
//     };
//   },

//   onParamSetResult: (cb) => {
//     const handler = (_, data) => cb(data);
//     ipcRenderer.on("param-set-result", handler);

//     return () => ipcRenderer.removeListener("param-set-result", handler);
//   },

//   disconnectPort: () => ipcRenderer.send("disconnect-port"),

//   flightCommand: (cmd, payload) =>
//     ipcRenderer.send("flight-command", { cmd, payload }),

//   onCommandAck: (cb) => {
//     const handler = (_, data) => cb(data);
//     ipcRenderer.on("command-ack", handler);
//     return () => ipcRenderer.removeListener("command-ack", handler);
//   },

//   flight: {
//     arm: () => ipcRenderer.send("flight-command", { cmd: "ARM" }),
//     disarm: () => ipcRenderer.send("flight-command", { cmd: "DISARM" }),

//     rtl: () => ipcRenderer.send("flight-command", { cmd: "RTL" }),
//     land: () => ipcRenderer.send("flight-command", { cmd: "LAND" }),
//     loiter: () => ipcRenderer.send("flight-command", { cmd: "LOITER" }),
//     guided: () => ipcRenderer.send("flight-command", { cmd: "GUIDED" }),
//     stabilize: () => ipcRenderer.send("flight-command", { cmd: "STABILIZE" }),
//     takeoff: (alt) =>
//       ipcRenderer.send("flight-command", {
//         cmd: "TAKEOFF",
//         payload: { alt },
//       }),
//     flyTo: (lat, lon, alt) =>
//       ipcRenderer.send("flight-command", {
//         cmd: "GUIDED",
//         payload: { lat, lon, alt },
//       }),
//   },
// });

//////////////////////////
/////////////////////////
///////////////////////////
///////////////////////////

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // ============================================================
  // SERIAL / CONNECTION
  // ============================================================

  getPorts: () => ipcRenderer.invoke("get-ports"),

  connectPort: (data) => ipcRenderer.send("connect-port", data),

  disconnectPort: () => ipcRenderer.send("disconnect-port"),

  requestParams: () => ipcRenderer.send("request-params"),

  // ============================================================
  // JOYSTICK
  // ============================================================

  sendJoystick: (data) => ipcRenderer.send("joystick-update", data),

  enableJoystick: () => ipcRenderer.send("joystick-enable"),

  disableJoystick: () => ipcRenderer.send("joystick-disable"),

  updateJoystickConfig: (config) =>
    ipcRenderer.send("joystick-update-config", config),

  setThrottle: (throttlePercentage) =>
    ipcRenderer.send("set-throttle", throttlePercentage),

  // ============================================================
  // ACCELEROMETER CALIBRATION
  // ============================================================

  startAccelCalibration: () => ipcRenderer.send("start-accel-calibration"),

  startAccelLevelCalibration: () => ipcRenderer.send("start-level-calibration"),

  confirmAccelPosition: () => ipcRenderer.send("confirm-accel-position"),

  onAccelCalibrationStatus: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("accel-calibration-status", handler);

    return () =>
      ipcRenderer.removeListener("accel-calibration-status", handler);
  },

  // ============================================================
  // COMPASS MOT
  // ============================================================

  startCompassMotCalibration: () =>
    ipcRenderer.send("start-compassmot-calibration"),

  stopCompassMot: () => ipcRenderer.send("stop-compassmot-calibration"),

  onCompassMotStatus: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("compassmot-status", handler);

    return () => ipcRenderer.removeListener("compassmot-status", handler);
  },

  // ============================================================
  // COMPASS CALIBRATION
  // ============================================================

  startCompassCalibration: () => ipcRenderer.send("start-compass-calibration"),

  cancelCompassCalibration: () =>
    ipcRenderer.send("cancel-compass-calibration"),

  onCompassCalibrationStatus: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("compass-calibration-status", handler);

    return () =>
      ipcRenderer.removeListener("compass-calibration-status", handler);
  },

  // ============================================================
  // PARAMETERS
  // ============================================================

  onParam: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("param", handler);

    return () => ipcRenderer.removeListener("param", handler);
  },

  onParamComplete: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("param-complete", handler);

    return () => ipcRenderer.removeListener("param-complete", handler);
  },

  setParam: (data) => ipcRenderer.send("set-param", data),

  getParamMeta: () => ipcRenderer.invoke("get-param-meta"),

  onParamSetResult: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("param-set-result", handler);

    return () => ipcRenderer.removeListener("param-set-result", handler);
  },

  // ============================================================
  // CONNECTION / TELEMETRY / HARDWARE EVENTS
  // ============================================================

  onConnectionState: (cb) => {
    const handler = (_, state) => cb(state);

    ipcRenderer.on("connection-state", handler);

    return () => ipcRenderer.removeListener("connection-state", handler);
  },

  onTelemetry: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("telemetry", handler);

    return () => ipcRenderer.removeListener("telemetry", handler);
  },

  onHardwareStatus: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("hardware-status", handler);

    return () => ipcRenderer.removeListener("hardware-status", handler);
  },

  // ============================================================
  // FLIGHT COMMANDS
  // ============================================================

  flightCommand: (cmd, payload) =>
    ipcRenderer.send("flight-command", {
      cmd,
      payload,
    }),

  onCommandAck: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("command-ack", handler);

    return () => ipcRenderer.removeListener("command-ack", handler);
  },

  flight: {
    arm: () =>
      ipcRenderer.send("flight-command", {
        cmd: "ARM",
      }),

    disarm: () =>
      ipcRenderer.send("flight-command", {
        cmd: "DISARM",
      }),

    rtl: () =>
      ipcRenderer.send("flight-command", {
        cmd: "RTL",
      }),

    land: () =>
      ipcRenderer.send("flight-command", {
        cmd: "LAND",
      }),

    loiter: () =>
      ipcRenderer.send("flight-command", {
        cmd: "LOITER",
      }),

    guided: () =>
      ipcRenderer.send("flight-command", {
        cmd: "GUIDED",
      }),

    stabilize: () =>
      ipcRenderer.send("flight-command", {
        cmd: "STABILIZE",
      }),

    takeoff: (alt) =>
      ipcRenderer.send("flight-command", {
        cmd: "TAKEOFF",
        payload: {
          alt,
        },
      }),

    flyTo: (lat, lon, alt) =>
      ipcRenderer.send("flight-command", {
        cmd: "GUIDED",
        payload: {
          lat,
          lon,
          alt,
        },
      }),
  },

  // ============================================================
  // FIRMWARE
  // ============================================================

  firmware: {
    enterBootloader: () => ipcRenderer.invoke("firmware-enter-bootloader"),

    listUSB: () => ipcRenderer.invoke("firmware-list-usb"),

    detectTargets: () => ipcRenderer.invoke("firmware-detect-targets"),

    identify: (path) =>
      ipcRenderer.invoke("firmware-identify", {
        path,
      }),

    flash: ({ path, firmwarePath, force = false, fullErase = false }) =>
      ipcRenderer.invoke("firmware-flash", {
        path,
        firmwarePath,
        force,
        fullErase,
      }),

    cancel: () => ipcRenderer.invoke("firmware-cancel"),

    onEvent: (callback) => {
      const listener = (_event, data) => {
        callback(data);
      };

      ipcRenderer.on("firmware-event", listener);

      return () => {
        ipcRenderer.removeListener("firmware-event", listener);
      };
    },
  },

  // ============================================================
  // FC RESTART
  // ============================================================

  restartFc: () => ipcRenderer.send("restart-FC"),
});
