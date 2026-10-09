const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // ============================================================
  // SERIAL / CONNECTION
  // ============================================================

  getPorts: () => ipcRenderer.invoke("get-ports"),

  connectPort: (data) => ipcRenderer.send("connect-port", data),

  // disconnectPort: () => ipcRenderer.send("disconnect-port"),
  disconnectPort: () => ipcRenderer.invoke("disconnect-port"),

  requestParams: () => ipcRenderer.send("request-params"),

  // ============================================================
  // JOYSTICK
  // ============================================================

  sendJoystick: (data) => ipcRenderer.send("joystick-update", data),

  enableJoystick: () => ipcRenderer.send("joystick-enable"),

  disableJoystick: () => ipcRenderer.send("joystick-disable"),

  onJoystickState: (cb) => {
    const handler = (_, data) => cb(data);

    ipcRenderer.on("joystick-state", handler);

    return () => ipcRenderer.removeListener("joystick-state", handler);
  },

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
    const handler = (_, data) => {
      console.log("[PRELOAD] Received command result:", data);

      cb(data);
    };

    ipcRenderer.on("command-result", handler);

    return () => ipcRenderer.removeListener("command-result", handler);
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
  // FIRMWARE FLASHING
  // ============================================================

  firmware: {
    reconnect: (port, baudRate) =>
      ipcRenderer.invoke("firmware-reconnect", {
        port,
        baudRate,
      }),

    // ----------------------------------------------------------
    // SELECT FIRMWARE FILE
    // ----------------------------------------------------------

    selectFile: () => ipcRenderer.invoke("firmware-select-file"),

    // ----------------------------------------------------------
    // LIST SERIAL PORTS
    // ----------------------------------------------------------

    listPorts: () => ipcRenderer.invoke("get-ports"),

    // ----------------------------------------------------------
    // IDENTIFY AUTOPILOT
    // ----------------------------------------------------------

    identify: (path, baudRate = 115200) =>
      ipcRenderer.invoke("firmware-identify", {
        path,
        baudRate,
      }),

    // ----------------------------------------------------------
    // FLASH
    // ----------------------------------------------------------

    flash: ({
      path,
      firmwarePath,
      baudRate = 115200,
      flashBaudRate = null,
      force = false,
      fullErase = false,
    }) =>
      ipcRenderer.invoke("firmware-flash", {
        path,
        firmwarePath,
        baudRate,
        flashBaudRate,
        force,
        fullErase,
      }),

    // ----------------------------------------------------------
    // CANCEL
    // ----------------------------------------------------------

    cancel: () => ipcRenderer.invoke("firmware-cancel"),

    // ----------------------------------------------------------
    // EVENTS
    // ----------------------------------------------------------

    onEvent: (callback) => {
      const handler = (_, data) => {
        callback(data);
      };

      ipcRenderer.on("firmware-event", handler);

      return () => {
        ipcRenderer.removeListener("firmware-event", handler);
      };
    },
  },

  // ============================================================
  // FC RESTART
  // ============================================================

  restartFc: () => ipcRenderer.send("restart-FC"),
});
