import EventEmitter from "events";

const DEFAULT_CONFIG = {
  heartbeatTimeoutMs: 2000,
  gpsTimeoutMs: 2000,
  imuTimeoutMs: 1000,
  minGpsSats: 6,
  minBatteryPercent: 20, // percent fallback if battery_remaining present (0-100)
  minBatteryVoltageMv: 10000, // optional fallback millivolts if your SYS_STATUS uses voltage_battery
  evalDebounceMs: 250,
  warnGpsSats: 4,
};

function now() {
  return Date.now();
}

function iso(ts) {
  return new Date(ts).toISOString();
}

export class HealthAggregatorService extends EventEmitter {
  constructor({ telemetryService, win = null, config = {} } = {}) {
    super();

    if (!telemetryService) throw new Error("telemetryService required");

    this.telemetry = telemetryService;
    this.win = win;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // latest messages keyed by message type name (e.g., Heartbeat, SysStatus, GpsRawInt)
    this.latest = Object.create(null);

    // cached status result
    this.currentStatus = {
      hardwareReady: false,
      items: [],
      lastUpdated: null,
    };

    // debounce/eval timer
    this.evalTimer = null;

    // bind methods
    this.handleMessage = this.handleMessage.bind(this);
    this.evaluate = this.evaluate.bind(this);
    this._pushStatus = this._pushStatus.bind(this);

    // start listening immediately
    this.telemetry.on("message", this.handleMessage);
  }

  start() {
    // no-op: constructor already subscribes. kept for symmetry.
    return;
  }

  stop() {
    this.telemetry.off("message", this.handleMessage);
    if (this.evalTimer) {
      clearTimeout(this.evalTimer);
      this.evalTimer = null;
    }
  }

  handleMessage(payload = {}) {
    const { type, data, ts = Date.now() } = payload;
    if (!type || !data) return;

    // store latest
    this.latest[type] = { msg: data, ts };

    // schedule evaluation (debounced)
    if (this.evalTimer) clearTimeout(this.evalTimer);
    this.evalTimer = setTimeout(() => {
      this.evaluate();
      this.evalTimer = null;
    }, this.config.evalDebounceMs);
  }

  getMessage(type) {
    return this.latest[type] || null;
  }

  isRecent(entry, timeoutMs) {
    if (!entry) return false;
    return now() - entry.ts <= timeoutMs;
  }

  // Helper to read battery percentage from messages
  readBatteryPercent(sysStatus) {
    if (!sysStatus) return null;
    // some firmwares use battery_remaining (0-100)
    if (
      typeof sysStatus.battery_remaining === "number" &&
      sysStatus.battery_remaining >= 0
    ) {
      return sysStatus.battery_remaining;
    }
    // fallback compute from voltage_battery (millivolts)
    if (
      typeof sysStatus.voltage_battery === "number" &&
      sysStatus.voltage_battery > 0
    ) {
      // naive mapping: use minVoltage 10V (10000 mV) -> 0%, 12.6V (12600mV) -> 100%
      const v = sysStatus.voltage_battery;
      const min = 10000;
      const max = 12600;
      const pct = Math.round(((v - min) / (max - min)) * 100);
      return Math.max(0, Math.min(100, pct));
    }
    return null;
  }

  evaluate() {
    const nowTs = now();
    const items = [];

    const hb = this.getMessage("Heartbeat")?.msg;
    const hbEntry = this.getMessage("Heartbeat");

    // Connection / heartbeat
    const hbOk =
      hbEntry && this.isRecent(hbEntry, this.config.heartbeatTimeoutMs);
    items.push({
      name: "Connection / Heartbeat",
      status: hbOk ? "OK" : "FAIL",
      value: hb ? `type=${hb.type} comp=${hb.autopilot}` : null,
      details: hbOk
        ? `age ${nowTs - (hbEntry?.ts || 0)} ms`
        : "no recent heartbeat",
      ageMs: hbEntry ? nowTs - hbEntry.ts : null,
    });

    // Armed check (preflight expectation: disarmed)
    let armedStatus = "OK";
    if (hb) {
      // HEARTBEAT's base_mode includes arm flag in some stacks; some libs expose 'base_mode' and 'system_status'
      // We'll check 'base_mode' & 'armed' if present (node-mavlink may not provide a boolean 'armed')
      const armed = hb.base_mode
        ? !!(hb.base_mode & 0x80)
        : (hb.armed ?? undefined);
      if (armed === true) {
        armedStatus = "WARN";
      }
    }
    items.push({
      name: "Armed State (preflight)",
      status: armedStatus,
      value: hb
        ? `likely armed=${hb.base_mode ? !!(hb.base_mode & 0x80) : (hb.armed ?? "unknown")}`
        : null,
      details: hb ? "check before takeoff" : "heartbeat missing",
      ageMs: hbEntry ? nowTs - hbEntry.ts : null,
    });

    // SysStatus / Battery
    const sysEntry = this.getMessage("SysStatus");
    const sys = sysEntry?.msg;
    let batteryStatus = "WARN";
    const batteryPct = this.readBatteryPercent(sys);
    if (batteryPct !== null) {
      batteryStatus =
        batteryPct >= this.config.minBatteryPercent ? "OK" : "FAIL";
    } else if (sys && typeof sys.voltage_battery === "number") {
      // if only voltage available, map roughly
      const v = sys.voltage_battery;
      batteryStatus = v >= this.config.minBatteryVoltageMv ? "OK" : "FAIL";
    } else {
      batteryStatus = sys ? "WARN" : "FAIL";
    }
    items.push({
      name: "Battery",
      status: batteryStatus,
      value:
        batteryPct !== null
          ? `${batteryPct}%`
          : sys && sys.voltage_battery
            ? `${sys.voltage_battery} mV`
            : null,
      details: sys ? `age ${nowTs - sysEntry.ts} ms` : "no sys_status",
      ageMs: sysEntry ? nowTs - sysEntry.ts : null,
    });

    // GPS raw
    const gpsEntry =
      this.getMessage("GpsRawInt") ||
      this.getMessage("GpsRaw") ||
      this.getMessage("GPS_RAW_INT");
    const gps = gpsEntry?.msg;
    const gpsAgeOk =
      gpsEntry && this.isRecent(gpsEntry, this.config.gpsTimeoutMs);

    let gpsStatus = "FAIL";
    if (gps) {
      // For GpsRawInt/GpsRaw fields vary by stack; common fields: fix_type, satellites_visible
      const fix = gps.fix_type ?? gps.fix ?? gps.gps_fix ?? null;
      const sats =
        gps.satellites_visible ??
        gps.satellites_visible ??
        gps.sats_visible ??
        null;

      if (fix !== null && sats !== null) {
        if (fix >= 3 && sats >= this.config.minGpsSats && gpsAgeOk)
          gpsStatus = "OK";
        else if (fix >= 2 && sats >= this.config.warnGpsSats && gpsAgeOk)
          gpsStatus = "WARN";
        else gpsStatus = "FAIL";
      } else {
        gpsStatus = gpsAgeOk ? "WARN" : "FAIL";
      }

      items.push({
        name: "GPS (raw)",
        status: gpsStatus,
        value: `fix=${fix ?? "?"} sats=${sats ?? "?"}`,
        details: gpsAgeOk ? `age ${nowTs - gpsEntry.ts} ms` : "gps stale",
        ageMs: gpsEntry ? nowTs - gpsEntry.ts : null,
      });
    } else {
      items.push({
        name: "GPS (raw)",
        status: "FAIL",
        value: null,
        details: "no GPS_RAW_INT",
        ageMs: null,
      });
    }

    // Global position
    const gposEntry =
      this.getMessage("GlobalPositionInt") ||
      this.getMessage("GLOBAL_POSITION_INT");
    const gpos = gposEntry?.msg;
    const gposAgeOk =
      gposEntry && this.isRecent(gposEntry, this.config.gpsTimeoutMs);
    if (gpos) {
      const lat = gpos.lat ?? gpos.latitude ?? 0;
      const lon = gpos.lon ?? gpos.longitude ?? 0;
      const valid = lat !== 0 || lon !== 0;
      items.push({
        name: "Global Position",
        status:
          gposAgeOk && valid ? "OK" : gposAgeOk && !valid ? "WARN" : "FAIL",
        value: valid ? `lat=${lat} lon=${lon}` : null,
        details: gposAgeOk
          ? `age ${nowTs - gposEntry.ts} ms`
          : "position stale",
        ageMs: gposEntry ? nowTs - gposEntry.ts : null,
      });
    } else {
      items.push({
        name: "Global Position",
        status: "FAIL",
        value: null,
        details: "no GLOBAL_POSITION_INT",
        ageMs: null,
      });
    }

    // Attitude / IMU
    const attEntry =
      this.getMessage("Attitude") || this.getMessage("HIGHRES_IMU");
    const att = attEntry?.msg;
    const attAgeOk =
      attEntry && this.isRecent(attEntry, this.config.imuTimeoutMs);
    items.push({
      name: "IMU / Attitude",
      status: att ? (attAgeOk ? "OK" : "WARN") : "FAIL",
      value: att ? "streaming" : null,
      details: att ? `age ${nowTs - attEntry.ts} ms` : "no attitude/imu data",
      ageMs: attEntry ? nowTs - attEntry.ts : null,
    });

    // SysStatus / sensor presence bits (best-effort)
    if (sys) {
      // node-mavlink exposes bitmasks; presence/enabled fields vary
      const sensorsPresent =
        sys.onboard_control_sensors_present ??
        sys.onboard_sensors_present ??
        sys.sensors_present;
      const sensorsEnabled =
        sys.onboard_control_sensors_enabled ??
        sys.onboard_sensors_enabled ??
        sys.sensors_enabled;
      let sensorsOk = "OK";
      if (typeof sensorsPresent === "number") {
        // We expect at least IMU, GYRO, MAG, BARO, GPS bits set in many autopilots - we do a light check: non-zero
        sensorsOk = sensorsPresent !== 0 ? "OK" : "WARN";
      } else {
        sensorsOk = "WARN";
      }

      items.push({
        name: "Sensors Present",
        status: sensorsOk,
        value: sensorsPresent ?? sensorsEnabled ?? null,
        details:
          sensorsOk === "OK" ? "sensors reported" : "sensor bits missing",
        ageMs: sysEntry ? nowTs - sysEntry.ts : null,
      });
    } else {
      items.push({
        name: "Sensors Present",
        status: "FAIL",
        value: null,
        details: "no SYS_STATUS",
        ageMs: null,
      });
    }

    // STATUSTEXT checks - look for CRITICAL or ERROR severity
    const statEntry =
      this.getMessage("Statustext") || this.getMessage("STATUSTEXT");
    if (statEntry && statEntry.msg) {
      // fields: severity (0=EMERGENCY .. 7=DEBUG), text
      const severity = statEntry.msg.severity ?? statEntry.msg.sev ?? null;
      const text = statEntry.msg.text ?? null;
      const isCritical = typeof severity === "number" && severity <= 2; // EMERGENCY(0), ALERT(1), CRITICAL(2)
      items.push({
        name: "System Messages",
        status: isCritical ? "FAIL" : "OK",
        value: text ?? null,
        details: isCritical
          ? `critical message (sev=${severity})`
          : "no critical messages",
        ageMs: statEntry ? nowTs - statEntry.ts : null,
      });
    } else {
      items.push({
        name: "System Messages",
        status: "OK",
        value: null,
        details: "no recent statustext",
        ageMs: null,
      });
    }

    // Command ACK failures (if any)
    const ackEntry =
      this.getMessage("CommandAck") || this.getMessage("COMMAND_ACK");
    if (ackEntry && ackEntry.msg) {
      const result = ackEntry.msg.result ?? ackEntry.msg.result;
      const command = ackEntry.msg.command ?? ackEntry.msg.command;
      if (typeof result === "number" && result !== 0) {
        items.push({
          name: "Command ACK",
          status: "WARN",
          value: `cmd=${command} result=${result}`,
          details: "recent non-accepted ACK",
          ageMs: nowTs - ackEntry.ts,
        });
      } else {
        items.push({
          name: "Command ACK",
          status: "OK",
          value: `last cmd=${command ?? "?"}`,
          details: "last command accepted or none",
          ageMs: ackEntry ? nowTs - ackEntry.ts : null,
        });
      }
    } else {
      items.push({
        name: "Command ACK",
        status: "OK",
        value: null,
        details: "no recent command acks",
        ageMs: null,
      });
    }

    // Decide hardwareReady: require no FAIL items; WARN allowed but blocks if you choose to
    const hasFail = items.some((it) => it.status === "FAIL");
    const hardwareReady = !hasFail;

    const status = {
      hardwareReady,
      items,
      lastUpdated: iso(nowTs),
    };

    // cache & push only if changed (simple shallow compare)
    const changed =
      JSON.stringify(status) !== JSON.stringify(this.currentStatus);
    this.currentStatus = status;

    if (changed) {
      this._pushStatus(status);
      this.emit("status", status);
    }

    return status;
  }

  _pushStatus(status) {
    // send to renderer if window available
    try {
      if (this.win && this.win.webContents && !this.win.isDestroyed()) {
        this.win.webContents.send("hardware-status", status);
      }
    } catch (e) {
      // ignore send errors
    }
  }

  getStatus() {
    return this.currentStatus;
  }

  setConfig(opts = {}) {
    this.config = { ...this.config, ...opts };
  }
}
