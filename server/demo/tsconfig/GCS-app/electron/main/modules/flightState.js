export class FlightState {
  constructor(win) {
    this.win = win;

    this.state = {
      // CORE
      armed: false,
      mode: "UNKNOWN",
      modeRaw: 0,
      systemStatus: "UNKNOWN",
      inAir: false,

      // NAV
      altitude: 0,
      verticalSpeed: 0,

      // GPS
      gpsFix: false,

      // HEALTH
      batteryVoltage: null,
      batteryRemaining: null,
      ekfHealthy: true,

      // LINK
      lastHeartbeat: null,
      linkLost: false,

      // COMMANDS
      lastAck: null,
      commandStatus: null,
    };

    this._altitudeHistory = [];
    this._heartbeatTimeoutMs = 3000;
  }

  /* ---------------- HEARTBEAT ---------------- */
  updateHeartbeat(msg) {
    const baseMode = msg.baseMode ?? 0;
    const customMode = msg.customMode ?? 0;

    // ARM STATE (ArduPilot standard)
    this.state.armed = (baseMode & 128) !== 0;

    this.state.modeRaw = customMode;

    // IMPORTANT: decode ArduPilot mode
    this.state.mode = decodeArduPilotMode(customMode);

    this.state.systemStatus = decodeSystemStatus(msg.systemStatus);

    this.state.lastHeartbeat = Date.now();

    this._updateLinkState();
    this._updateDerivedState();

    // this.log("HEARTBEAT");
    this.emit();
  }
  //-----------update acknowledge --------//
  updateAck(command, status) {
    if (command === 400 && status === "ACCEPTED") {
      this.state.armed = true;
    }

    if (command === 400 && status !== "ACCEPTED") {
      this.state.armed = false;
    }

    this.state.lastAck = { command, status };
    this.emit();
  }

  /* ---------------- POSITION ---------------- */
  updatePosition(msg) {
    const alt = (msg.relativeAlt ?? 0) / 1000;

    this._altitudeHistory.push({ t: Date.now(), alt });
    if (this._altitudeHistory.length > 10) {
      this._altitudeHistory.shift();
    }

    const len = this._altitudeHistory.length;

    if (len > 2) {
      const dAlt =
        this._altitudeHistory[len - 1].alt - this._altitudeHistory[len - 2].alt;

      this.state.verticalSpeed = dAlt;
    }

    this.state.altitude = alt;

    this._updateDerivedState();
    this.emit();
  }

  /* ---------------- GPS ---------------- */
  updateGPS(msg) {
    this.state.gpsFix = (msg.fixType ?? 0) >= 3;

    this.emit();
  }

  //------------VFR HUD----------//
  updateVfrHud(msg) {
    this.state.altitude = msg.alt ?? this.state.altitude;
    this.state.verticalSpeed = msg.climb ?? this.state.verticalSpeed;
    this.emit();
  }

  //-----------EKF status------------//
  updateEkfStatus(msg) {
    this.state.ekfHealthy = (msg.flags ?? 0) === 0;
    this.emit();
  }

  /* ---------------- SYS STATUS ---------------- */
  updateSysStatus(msg) {
    if (msg.voltageBattery != null) {
      this.state.batteryVoltage = msg.voltageBattery / 1000;
    }

    if (msg.batteryRemaining != null) {
      this.state.batteryRemaining = msg.batteryRemaining;
    }

    this.emit();
  }

  /* ---------------- ACK ---------------- */
  updateAck(command, result) {
    this.state.lastAck = { command, result };
    this.state.commandStatus = { command, result };

    this.emit();
  }

  /* ---------------- LINK ---------------- */
  _updateLinkState() {
    const now = Date.now();

    this.state.linkLost =
      !this.state.lastHeartbeat ||
      now - this.state.lastHeartbeat > this._heartbeatTimeoutMs;
  }

  /* ---------------- DERIVED ---------------- */
  _updateDerivedState() {
    const armed = this.state.armed;
    const alt = this.state.altitude;

    const airborneByAlt = alt > 1.5;
    const moving = Math.abs(this.state.verticalSpeed ?? 0) > 0.2;

    this.state.inAir = armed && (airborneByAlt || moving);

    if (this.state.linkLost) {
      this.state.inAir = false;
    }
  }

  /* ---------------- EMIT ---------------- */
  emit() {
    this.win.webContents.send("flight-state", this.state);
    // this.log();
  }

  get() {
    return { ...this.state };
  }

  /* ---------------- LOG ---------------- */
  // log(label = "STATE") {
  //   console.log(`[${label}]`, {
  //     armed: this.state.armed,
  //     mode: this.state.mode,
  //     altitude: this.state.altitude.toFixed(2),
  //     inAir: this.state.inAir,
  //     gpsFix: this.state.gpsFix,
  //     linkLost: this.state.linkLost,
  //   });
  // }

  // log(label = "FLIGHT_STATE") {
  //   console.log(`\n[${label}] =========================`);

  //   console.table({
  //     armed: this.state.armed,
  //     mode: this.state.mode,
  //     modeRaw: this.state.modeRaw,
  //     systemStatus: this.state.systemStatus,
  //     inAir: this.state.inAir,

  //     altitude: this.state.altitude,
  //     verticalSpeed: this.state.verticalSpeed,

  //     gpsFix: this.state.gpsFix,

  //     batteryVoltage: this.state.batteryVoltage,
  //     batteryRemaining: this.state.batteryRemaining,

  //     ekfHealthy: this.state.ekfHealthy,

  //     linkLost: this.state.linkLost,

  //     lastHeartbeat: this.state.lastHeartbeat,
  //     lastAck: this.state.lastAck?.command ?? null,
  //     commandStatus: this.state.commandStatus?.status ?? null,
  //   });

  //   console.log(`=====================================\n`);
  // }
}

/* ===================================================== */
/*              ARDUPILOT MODE DECODER                  */
/* ===================================================== */

function decodeArduPilotMode(customMode) {
  const modes = {
    0: "STABILIZE",
    1: "ACRO",
    2: "ALT_HOLD",
    3: "AUTO",
    4: "GUIDED",
    5: "LOITER",
    6: "RTL",
    7: "CIRCLE",
    9: "LAND",
    10: "DRIFT",
    11: "SPORT",
    13: "POSHOLD",
    14: "BRAKE",
    15: "THROW",
  };

  return modes[customMode] ?? "UNKNOWN";
}

function decodeSystemStatus(v) {
  const map = {
    0: "UNINIT",
    1: "BOOT",
    2: "CALIBRATING",
    3: "STANDBY",
    4: "ACTIVE",
    5: "CRITICAL",
    6: "EMERGENCY",
    7: "POWEROFF",
  };

  return map[v] ?? "UNKNOWN";
}

// export class FlightState {
//   constructor(win) {
//     this.win = win;

//     this.state = {
//       armed: false,
//       mode: "UNKNOWN",
//       modeRaw: 0,

//       inAir: false,

//       gpsFix: false,
//       systemStatus: "UNKNOWN",

//       altitude: 0,
//       verticalSpeed: 0,

//       lastHeartbeat: null,
//       lastGps: null,
//       lastPosition: null,

//       lastAck: null,
//       commandStatus: null,
//     };

//     // internal smoothing
//     this._altitudeHistory = [];
//   }

//   /* ---------------- HEARTBEAT ---------------- */
//   updateHeartbeat(msg) {
//     const baseMode = msg.baseMode ?? 0;
//     const customMode = msg.customMode ?? 0;

//     // MAV_MODE_FLAG_SAFETY_ARMED = 128 (0x80)
//     this.state.armed = (baseMode & 128) !== 0;

//     this.state.modeRaw = customMode;

//     this.state.systemStatus = msg.systemStatus ?? "UNKNOWN";

//     this.state.lastHeartbeat = Date.now();

//     this._updateDerivedState();

//     this.emit();
//     this.log("HEARTBEAT");
//   }

//   /* ---------------- POSITION (GLOBAL_POSITION_INT) ---------------- */
//   updatePosition(msg) {
//     // cm → meters
//     const alt = (msg.relativeAlt ?? 0) / 1000;

//     // store altitude history for smoothing
//     this._altitudeHistory.push({ t: Date.now(), alt });

//     if (this._altitudeHistory.length > 10) {
//       this._altitudeHistory.shift();
//     }

//     // compute vertical speed (simple derivative)
//     const len = this._altitudeHistory.length;
//     if (len > 2) {
//       const dAlt =
//         this._altitudeHistory[len - 1].alt - this._altitudeHistory[len - 2].alt;

//       this.state.verticalSpeed = dAlt; // m per sample (approx)
//     }

//     this.state.altitude = alt;
//     this.state.lastPosition = Date.now();

//     this._updateDerivedState();

//     this.emit();
//   }

//   /* ---------------- GPS ---------------- */
//   updateGPS(msg) {
//     // MAVLink: 0=no fix, 1=dead reckoning, 2=2D, 3=3D fix
//     this.state.gpsFix = (msg.fixType ?? 0) >= 3;

//     this.state.lastGps = Date.now();

//     this._updateDerivedState();

//     this.emit();
//   }

//   /* ---------------- COMMAND ACK ---------------- */
//   updateAck(command, result) {
//     this.state.lastAck = { command, result };
//     this.state.commandStatus = { command, result };

//     this.emit();
//   }

//   /* ---------------- DERIVED STATE (IMPORTANT) ---------------- */
//   _updateDerivedState() {
//     const armed = this.state.armed;
//     const alt = this.state.altitude;
//     const gps = this.state.gpsFix;

//     // IMPORTANT: NO SINGLE SOURCE OF TRUTH EXISTS IN MAVLINK

//     // safer flight detection logic (used in many GCS systems)
//     const airborneByAltitude = alt > 1.5;

//     const moving = Math.abs(this.state.verticalSpeed ?? 0) > 0.2;

//     // FINAL inAir heuristic
//     this.state.inAir = armed && (airborneByAltitude || moving);

//     // DO NOT tie GPS to inAir strictly (GPS fails indoors)
//   }

//   /* ---------------- EMIT ---------------- */
//   emit() {
//     this.win.webContents.send("flight-state", this.state);
//   }

//   get() {
//     return { ...this.state };
//   }

//   log(label = "STATE") {
//     console.log(`[${label}]`, {
//       armed: this.state.armed,
//       modeRaw: this.state.modeRaw,
//       altitude: this.state.altitude.toFixed(2),
//       inAir: this.state.inAir,
//       gpsFix: this.state.gpsFix,
//     });
//   }
// }

//---------------------------------architecture change 8/5/26 ------------------------//

// export class FlightState {
//   constructor(win) {
//     this.win = win;

//     this.state = {
//       armed: false,
//       mode: "UNKNOWN",
//       inAir: false,
//       gpsFix: false,
//       lastHeartbeat: null,
//       lastAck: null,
//     };

//     this.state.commandStatus = null;
//   }

//   updateHeartbeat(msg) {
//     const baseMode = msg.base_mode ?? msg.baseMode ?? 0;
//     const customMode = msg.custom_mode ?? msg.customMode ?? 0;

//     this.state.armed = (baseMode & 0x80) !== 0;
//     this.state.mode = customMode;
//     this.state.lastHeartbeat = Date.now();

//     this.emit();

//     this.log();
//   }

//   // updatePosition(msg) {
//   //   const altMeters = (msg.relativeAlt ?? 0) / 1000;

//   //   this.state.inAir = this.state.armed && altMeters > 0.5;

//   //   this.emit();
//   // }

//   updatePosition(msg) {
//     const altMeters = (msg.relativeAlt ?? 0) / 1000;

//     const gpsOk = this.state.gpsFix;
//     const armed = this.state.armed;

//     const climbing = (msg.vz ?? 0) < -0.5; // descending/up velocity if available

//     // safer heuristic
//     this.state.inAir = armed && gpsOk && altMeters > 1.0;

//     this.emit();
//   }

//   updateGPS(msg) {
//     this.state.gpsFix = (msg.fixType ?? 0) >= 3;
//     this.emit();
//   }

//   updateAck(command, status) {
//     this.state.lastAck = { command, status };
//     this.state.commandStatus = { command, status };
//     this.emit();
//   }

//   emit() {
//     this.win.webContents.send("flight-state", this.state);
//   }

//   get() {
//     return { ...this.state };
//   }

//   log(label = "STATE") {
//     console.log(`[${label}]`, this.get());
//   }
// }
