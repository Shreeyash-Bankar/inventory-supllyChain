export class HardwareCheck {
  // Global MAVLink Bitfields & Mappings
  static SYSTEM_STATES = {
    0: "UNINIT",
    1: "BOOT",
    2: "CALIBRATING",
    3: "STANDBY",
    4: "ACTIVE",
    5: "CRITICAL",
    6: "EMERGENCY",
    7: "POWEROFF",
    8: "FLIGHT_TERMINATION",
  };

  static BASE_MODE_FLAGS = { ARMED: 128 }; // 0x80

  static CRITICAL_SENSORS = [
    "3D Gyro",
    "3D Accelerometer",
    "3D Magnetometer",
    "Absolute Pressure",
    "Motor Outputs",
  ];

  static SENSOR_BITMASK = [
    { mask: 0x00000001, name: "3D Gyro" },
    { mask: 0x00000002, name: "3D Accelerometer" },
    { mask: 0x00000004, name: "3D Magnetometer" },
    { mask: 0x00000008, name: "Absolute Pressure" },
    { mask: 0x00000010, name: "Differential Pressure" },
    { mask: 0x00000020, name: "GPS" },
    { mask: 0x00000040, name: "Optical Flow" },
    // { mask: 0x00000080, name: "Computer Vision" },
    { mask: 0x00000100, name: "Laser" },
    { mask: 0x00000200, name: "External Ground Truth" },
    { mask: 0x00000400, name: "Angular Rate Control" },
    { mask: 0x00000800, name: "Attitude Stabilization" },
    { mask: 0x00001000, name: "Yaw Position" },
    { mask: 0x00002000, name: "Z Altitude Control" },
    { mask: 0x00004000, name: "XY Position Control" },
    { mask: 0x00008000, name: "Motor Outputs" },
    { mask: 0x00010000, name: "RC Receiver" },
    { mask: 0x00020000, name: "Gyro Calibration" },
    { mask: 0x00040000, name: "Accelerometer Calibration" },
    { mask: 0x00080000, name: "Magnetometer Calibration" },
    { mask: 0x02000000, name: "Battery" },
    { mask: 0x00100000, name: "Geofence" },
    { mask: 0x00400000, name: "Terrain subsystem health" },
    // { mask: 0x00800000, name: "Motors Reversed" },
    // { mask: 0x01000000, name: "Logging" },
  ];

  constructor(win) {
    this.win = win;
    this.lastBroadCast = 0;
    this.throttleMs = 1000;
    this.hardwareStatus = {
      isHealthy: false,
      checks: {},
      timestamp: null,
      systemStatus: "UNKNOWN",
      isArmed: false,
      mode: null,
      voltage: null,
      current: null,
      batteryRemaining: null,
      errors: null,
      dropped: null,
      gps: { ready: false, fixType: 0, satellites: 0 },
      ekf: { ready: false, flags: 0 },
    };
  }

  processIncomingTelemetry(type, data) {
    // console.log("HWCHK RECEIVED:", type, data);

    if (!data || typeof data !== "object") return;

    switch (type) {
      case "SysStatus":
        this.updateFromSysStatus(data);
        break;
      case "Heartbeat":
        this.updateFromHeartbeat(data);
        break;
      case "GpsRawInt":
        this.handleGpsStatus(data);
        break;
      case "EstimatorStatus":
      case "EkfStatusReport":
        this.handleEkfStatus(data);
        break;
      case "ServoOutputRaw":
        this.handleServoStatus(data);
        break;
    }
  }

  analyzeSysStatus(msg) {
    const checks = {};
    const health = msg.onboardControlSensorsHealth || 0;
    const enabled = msg.onboardControlSensorsEnabled || 0;
    const present = msg.onboardControlSensorsPresent || 0;

    const timestamp = new Date().toLocaleTimeString();

    for (const sensor of HardwareCheck.SENSOR_BITMASK) {
      const isPresent = !!(present & sensor.mask);
      const isEnabled = !!(enabled & sensor.mask);
      const isHealthy = !!(health & sensor.mask);

      // Determine clear, traceable status labels
      let status = "OK";
      if (!isPresent) status = "NOT_PRESENT";
      else if (!isEnabled) status = "DISABLED";
      else if (!isHealthy) status = "UNHEALTHY";

      // 🪵 SYSTEMATIC LOGGING MATRIX FOR ALL COMPONENT STATES
      // if (status === "OK") {
      //   console.info(
      //     `[${timestamp}] 🟢 [INFO] Sensor System Operational: ${sensor.name}`,
      //   );
      // } else if (status === "DISABLED") {
      //   console.warn(
      //     `[${timestamp}] 🟡 [WARN] Sensor Intentionally Inactive: ${sensor.name}`,
      //   );
      // } else {
      //   console.error(
      //     `[${timestamp}] 🔴 [ERROR] CRITICAL SENSOR CORRUPTION: ${sensor.name} (Present: ${isPresent}, Enabled: ${isEnabled}, Healthy: ${isHealthy})`,
      //   );
      // }

      checks[sensor.name] = {
        present: isPresent,
        enabled: isEnabled,
        healthy: isHealthy,
        status,
      };
    }
    return checks;
  }

  handleGpsStatus(gpsMsg) {
    const hasGpsFix = (gpsMsg.fixType || 0) >= 3;
    const enoughSatellites = (gpsMsg.satellitesVisible || 0) >= 6;
    const isReady = hasGpsFix && enoughSatellites;
    const timestamp = new Date().toLocaleTimeString();

    // 🪵 Log the continuous health of your GPS subsystem
    // if (isReady) {
    //   console.info(
    //     `[${timestamp}]  [INFO] GPS Localization Optimal. Fix Type: ${gpsMsg.fixType}, Sats: ${gpsMsg.satellitesVisible}`,
    //   );
    // } else {
    //   console.warn(
    //     `[${timestamp}]  [WARN] GPS Degraded/Acquiring. Fix Type: ${gpsMsg.fixType}/3+, Sats: ${gpsMsg.satellitesVisible}/6+`,
    //   );
    // }

    this.hardwareStatus.gps = {
      ready: isReady,
      fixType: gpsMsg.fixType || 0,
      satellites: gpsMsg.satellitesVisible || 0,
    };
    this.broadcastStatus();
  }

  handleServoStatus(servoMsg) {
    const channels = [
      servoMsg.servo1_raw || 0,
      servoMsg.servo2_raw || 0,
      servoMsg.servo3_raw || 0,
      servoMsg.servo4_raw || 0,
      servoMsg.servo5_raw || 0,
      servoMsg.servo6_raw || 0,
      servoMsg.servo7_raw || 0,
      servoMsg.servo8_raw || 0,
    ];

    const servoReport = {};
    let allServosHealthy = true;
    const timestamp = new Date().toLocaleTimeString();

    channels.forEach((pwmValue, index) => {
      const motorNumber = index + 1;
      // const isHealthy = pwmValue > 0;
      // Check if PWM is within typical operational range (1000us - 2000us)
      const isHealthy = pwmValue >= 1000 && pwmValue <= 2000;
      if (!isHealthy) allServosHealthy = false;

      // 🪵 Log the absolute status of every single individual engine line
      if (isHealthy) {
        console.info(
          `[${timestamp}] 🟢 [INFO] Motor Line ${motorNumber} Active. PWM: ${pwmValue}us`,
        );
      } else {
        console.error(
          `[${timestamp}] 🔴 [ERROR] Motor Line ${motorNumber} Dead or Severed! PWM dropped to ${pwmValue}us`,
        );
      }

      servoReport[`Motor_${motorNumber}`] = {
        pwm: pwmValue,
        status: isHealthy ? "OK" : "DISCONNECTED_OR_FAILED",
      };
    });

    this.hardwareStatus.servos = {
      ready: allServosHealthy,
      channels: servoReport,
    };

    this.broadcastStatus();
  }

  handleTelemetry(telemetryData) {
    if (!telemetryData || typeof telemetryData !== "object") return;
    const { type, data } = telemetryData;
    // console.log(
    //   `Telemetry Ingestion [TYPE] : ${type} at ${new Date().toLocaleTimeString()}`,
    // );
    switch (type) {
      case "SysStatus":
        this.updateFromSysStatus(data);
        break;
      case "Heartbeat":
        this.updateFromHeartbeat(data);
        break;
      case "GpsRawInt":
        this.handleGpsStatus(data);
        break;
      case "EstimatorStatus": // Aligned with standard MAVLink ESTIMATOR_STATUS (230)
      case "EkfStatusReport":
        this.handleEkfStatus(data);
        break;

      case "ServoOutputRaw":
        this.handleServoStatus(data);
        break;
    }
  }

  updateFromSysStatus(sysStatusMsg) {
    // console.log("HWCHK SysStatus:", {
    //   present: sysStatusMsg.onboardControlSensorsPresent,
    //   enabled: sysStatusMsg.onboardControlSensorsEnabled,
    //   health: sysStatusMsg.onboardControlSensorsHealth,
    // });

    const checks = this.analyzeSysStatus(sysStatusMsg);

    const isHealthy = HardwareCheck.CRITICAL_SENSORS.every((name) => {
      const sensor = checks[name];
      return sensor && sensor.healthy && sensor.enabled;
    });

    this.hardwareStatus = {
      ...this.hardwareStatus,
      isHealthy,
      checks,
      timestamp: Date.now(),
      voltage: sysStatusMsg.voltageBattery ?? null,
      current: sysStatusMsg.currentBattery ?? null,
      batteryRemaining: sysStatusMsg.batteryRemaining ?? null,
      errors: sysStatusMsg.errorsCount1 ?? null,
      dropped: sysStatusMsg.dropRateComm ?? null,
    };

    this.broadcastStatus();
    return this.hardwareStatus;
  }

  updateFromHeartbeat(heartbeatMsg) {
    this.hardwareStatus.systemStatus =
      HardwareCheck.SYSTEM_STATES[heartbeatMsg.systemStatus] || "UNKNOWN";
    this.hardwareStatus.isArmed = !!(
      heartbeatMsg.baseMode & HardwareCheck.BASE_MODE_FLAGS.ARMED
    );
    this.hardwareStatus.mode = heartbeatMsg.customMode;
    this.broadcastStatus();
  }

  handleEkfStatus(ekfMsg) {
    // EKF Matrix status check for Attitude, Horiz/Vert Velocity, and Relative Position
    const REQUIRED_EKF_FLAGS = 0x01 | 0x02 | 0x04 | 0x08;
    const flags = ekfMsg.flags || 0;

    this.hardwareStatus.ekf = {
      ready: (flags & REQUIRED_EKF_FLAGS) === REQUIRED_EKF_FLAGS,
      flags: flags,
    };
    this.broadcastStatus();
  }

  canArm() {
    return (
      this.hardwareStatus.isHealthy &&
      this.hardwareStatus.systemStatus === "STANDBY" &&
      this.hardwareStatus.servos?.ready !== false // Block launch if any servo is dead
    );
  }

  broadcastStatus() {
    const now = Date.now();
    if (now - this.lastBroadCast < this.throttleMs) return;
    this.lastBroadCast = now;
    // console.log(this.hardwareStatus);
    this.win?.webContents.send("hardware-status", this.hardwareStatus);
  }

  getReport() {
    // 🟢 Include ALL sensors, mapping their exact status
    const allSensors = Object.entries(this.hardwareStatus.checks || {}).map(
      ([name, check]) => ({
        name,
        status: check.status, // Will show "OK", "UNHEALTHY", "DISABLED", etc.
      }),
    );

    // 🟢 Include ALL motors/servos, mapping their exact status
    const allServos = Object.entries(
      this.hardwareStatus.servos?.channels || {},
    ).map(([motorName, details]) => ({
      name: motorName,
      status: details.status, // Will show "OK" or "DISCONNECTED_OR_FAILED"
    }));

    return {
      overall: this.hardwareStatus.isHealthy ? "READY" : "NOT_READY",
      systemStatus: this.hardwareStatus.systemStatus,
      isArmed: this.hardwareStatus.isArmed,
      battery: {
        voltage: this.hardwareStatus.voltage,
        current: this.hardwareStatus.current,
        remaining: this.hardwareStatus.batteryRemaining,
      },
      gps: this.hardwareStatus.gps,
      ekf: this.hardwareStatus.ekf,
      // 📊 This now contains every single component and its current health state
      componentsList: [...allSensors, ...allServos],
      canArm: this.canArm(),
      lastUpdate: this.hardwareStatus.timestamp
        ? new Date(this.hardwareStatus.timestamp).toISOString()
        : null,
    };
  }
}
