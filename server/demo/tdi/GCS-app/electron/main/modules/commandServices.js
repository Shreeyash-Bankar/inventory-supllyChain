import {
  common,
  send,
  ardupilotmega,
  minimal,
  MavLinkProtocolV2,
} from "node-mavlink";

const gcsProtocolEngine = new MavLinkProtocolV2();
gcsProtocolEngine.sysid = 255;
gcsProtocolEngine.compid = 190;

export class CommandService {
  constructor(port, win) {
    this.port = port;
    this.win = win;
    this.isVehicleArmed = false;
    this.pendingCommands = new Map();
    this.targetSystem = 1;
    this.targetComponent = 1;
  }

  // handleHeartbeat(heartbeatMsg) {
  //   // MAV_MODE_FLAG_SAFETY_ARMED = 128
  //   this.isVehicleArmed = (heartbeatMsg.baseMode & 128) !== 0;
  //   console.log(this.isVehicleArmed);
  // }

  handleHeartbeat(heartbeatMsg) {
    // node-mavlink exposes XML properties using camelCase (baseMode), NOT snake_case (base_mode)
    const baseModeValue = heartbeatMsg.baseMode ?? 0;
    console.log(baseModeValue);

    // MAV_MODE_FLAG_SAFETY_ARMED = 128
    this.isVehicleArmed = (baseModeValue & 128) !== 0;
  }

  async sendAck() {
    try {
      const msg = new common.CommandAck();

      ((msg.targetSystem = this.targetSystem),
        (msg.targetComponent = this.targetComponent));

      ((msg.command = 241), (msg.result = 4));
    } catch (error) {
      console.error("[Error sending command_ack to the drone]", error);
    }
  }

  async sendRCOverride({ roll, pitch, throttle, yaw }) {
    const msg = new common.RcChannelsOverride();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.chan1Raw = roll;
    msg.chan2Raw = pitch;
    msg.chan3Raw = throttle;
    msg.chan4Raw = yaw;

    msg.chan5Raw = 65535;
    msg.chan6Raw = 65535;
    msg.chan7Raw = 65535;
    msg.chan8Raw = 65535;

    const now = Date.now();
    if (!this.lastRcLogTime || now - this.lastRcLogTime > 500) {
      console.log(
        `[COMMAND_SERVICE INTERCEPT]  CH1(Roll): ${roll}μs | CH2(Pitch): ${pitch}μs | CH3(Throt): ${throttle}μs | CH4(Yaw): ${yaw}μs`,
      );
      this.lastRcLogTime = now;
    }

    await send(this.port, msg, gcsProtocolEngine);
  }

  async sendGimbalCommand({
    pitch,
    yaw,
    pitchRate = NaN,
    yawRate = NaN,
    flags = 0,
    gimbalDeviceId = 0,
  }) {
    try {
      const msg = new common.CommandLong();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      msg.command = 1000; // MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW
      msg.param1 = pitch ?? NaN;
      msg.param2 = yaw ?? NaN;
      msg.param3 = pitchRate;
      msg.param4 = yawRate;
      msg.param5 = flags;
      msg.param6 = NaN; // Reserved/Unused param for this command
      msg.param7 = gimbalDeviceId;

      await send(this.port, msg, gcsProtocolEngine);
      console.log(`[GIMBAL] Sent pitch: ${pitch}, yaw: ${yaw}`);

      console.log(
        `[GIMBAL TX] pitch=${pitch.toFixed(2)} yaw=${yaw.toFixed(2)} flags=${flags} device=${gimbalDeviceId}`,
      );
    } catch (error) {
      console.error("[GIMBAL ERROR] Failed to send gimbal command:", error);
    }
  }

  // async testMountControl() {
  //   try {
  //     console.log("inside testmountcontrol");
  //     const msg = new common.CommandLong();

  //     msg.targetSystem = this.targetSystem;
  //     msg.targetComponent = this.targetComponent;

  //     msg.command = 205; // MAV_CMD_DO_MOUNT_CONTROL
  //     msg.confirmation = 0;

  //     msg.param1 = 20; // pitch
  //     msg.param2 = 0; // roll
  //     msg.param3 = 30; // yaw
  //     msg.param4 = 0;
  //     msg.param5 = 0;
  //     msg.param6 = 0;
  //     msg.param7 = 2; // MAV_MOUNT_MODE_MAVLINK_TARGETING

  //     console.log("[GIMBAL TEST] Sending DO_MOUNT_CONTROL");

  //     await send(this.port, msg, gcsProtocolEngine);
  //   } catch (err) {
  //     console.error("[GIMBAL TEST ERROR]", err);
  //   }
  // }

  async sendGimbalCommand2({
    pitch,
    yaw,
    pitchRate = NaN,
    yawRate = NaN,
    flags = 0,
    gimbalDeviceId = 0,
  }) {
    try {
      const msg = new common.CommandLong();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      msg.command = 1000;
      msg.confirmation = 0;

      msg.param1 = 0;
      msg.param2 = 0;
      msg.param3 = 5;
      msg.param4 = 0;
      msg.param5 = flags;
      msg.param6 = NaN;
      msg.param7 = gimbalDeviceId;

      console.log(
        `[GIMBAL TX] command=1000 pitch=${pitch} yaw=${yaw} ` +
          `pitchRate=${pitchRate} yawRate=${yawRate} ` +
          `flags=${flags} device=${gimbalDeviceId}`,
      );

      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.error("[GIMBAL ERROR]", error);
    }
  }

  async setGimbalRate(pitchRateDegS = 0, yawRateDegS = 0, gimbalDeviceId = 0) {
    try {
      const msg = new common.CommandLong();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      msg.command = 1000; // MAV_CMD_DO_GIMBAL_MANAGER_PITCHYAW
      msg.confirmation = 0;

      // NaN means "do not change/set this field"
      msg._param1 = NaN; // Pitch angle
      msg._param2 = NaN; // Yaw angle

      // Angular rates in deg/s
      msg._param3 = pitchRateDegS;
      msg._param4 = yawRateDegS;

      // Gimbal manager flags
      // 0 = body/follow frame
      // 16 = yaw lock / earth frame
      msg._param5 = 0;

      // Reserved
      msg._param6 = 0;

      // Gimbal device ID
      // 0 = all
      msg._param7 = gimbalDeviceId;

      await send(this.port, msg, gcsProtocolEngine);

      console.log(
        `[GIMBAL] rate command: pitch=${pitchRateDegS} deg/s, yaw=${yawRateDegS} deg/s`,
      );
    } catch (error) {
      console.error(
        "[MAVLINK GIMBAL RATE ERROR] Failed to send gimbal rate:",
        error,
      );
    }
  }

  async setGimbalRateHighRate(
    pitchRateDegS = 0,
    yawRateDegS = 0,
    gimbalDeviceId = 0,
  ) {
    try {
      const msg = new common.GimbalManagerSetPitchyaw();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      // 0 = body/follow frame
      msg.flags = 0;

      msg.gimbalDeviceId = gimbalDeviceId;

      // Angles are ignored
      msg.pitch = NaN;
      msg.yaw = NaN;

      // MAVLink message uses radians/sec
      msg.pitchRate = (pitchRateDegS * Math.PI) / 180;
      msg.yawRate = (yawRateDegS * Math.PI) / 180;

      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.error(
        "[MAVLINK GIMBAL HIGH RATE ERROR] Failed to send gimbal setpoint:",
        error,
      );
    }
  }

  async sendRcOverride2({ roll, pitch, yaw, throttle }) {
    const msg = new common.RcChannelsOverride(
      this.targetSystem,
      this.targetComponent,

      axisToPwm(roll), // ch1
      axisToPwm(-pitch), // ch2
      throttleToPwm(throttle), // ch3
      axisToPwm(yaw), // ch4

      65535,
      65535,
      65535,
      65535,
    );

    this.sendMessage(msg);
  }

  async rebootFC() {
    try {
      const msg = new common.CommandLong();

      msg.command = 246;
      msg._param1 = 1;
      msg._param2 = 0;
      msg._param3 = 0;
      msg._param4 = 0;
      msg._param5 = 0;
      msg._param6 = 0;
      msg._param7 = 0;

      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.error("Error in sending  the reboot command to the drone", error);
    }
  }

  async rebootToBootloader() {
    try {
      if (!this.port || !this.port.isOpen) {
        throw new Error("MAVLink connection is not open");
      }

      const msg = new common.CommandLong();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      // MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN
      msg.command = 246;

      // Param 1:
      // 1 = normal reboot
      // 3 = reboot and remain in bootloader
      msg._param1 = 3;

      // Param 2: companion computer action
      msg._param2 = 0;

      // Param 3: component action
      msg._param3 = 0;

      // Param 4: component ID
      msg._param4 = 0;

      // Param 5: reserved
      msg._param5 = 0;

      // Param 6: conditions
      msg._param6 = 0;

      // Param 7: reserved
      msg._param7 = 0;

      console.log(
        "[BOOTLOADER] Sending MAV_CMD_PREFLIGHT_REBOOT_SHUTDOWN with param1=3",
      );

      await send(this.port, msg, gcsProtocolEngine);

      console.log(
        "[BOOTLOADER] Reboot-to-bootloader command transmitted successfully.",
      );
    } catch (error) {
      console.error(
        "[BOOTLOADER] Failed to send reboot-to-bootloader command:",
        error,
      );

      throw error;
    }
  }

  // async setThrottle(percent) {
  //   try {
  //     // Convert 0-100% -> PWM 1000-2000
  //     const pwm = Math.round(1000 + percent * 10);

  //     const msg = new common.RcChannelsOverride();

  //     msg.targetSystem = this.targetSystem;
  //     msg.targetComponent = this.targetComponent;

  //     //  all channels unchanged
  //     msg.chan1Raw = 65535;
  //     msg.chan2Raw = 65535;

  //     // Throttle channel
  //     msg.chan3Raw = pwm;

  //     msg.chan4Raw = 65535;
  //     msg.chan5Raw = 65535;
  //     msg.chan6Raw = 65535;
  //     msg.chan7Raw = 65535;
  //     msg.chan8Raw = 65535;

  //     await send(this.port, msg, gcsProtocolEngine);

  //     console.log(`[THROTTLE] percent=${percent}% pwm=${pwm}`);
  //   } catch (err) {
  //     console.error("[THROTTLE ERROR]", err);
  //   }
  // }

  async sendCompassMotCancel() {
    try {
      const ack = new common.CommandAck();

      ack.command = 241; // MAV_CMD_PREFLIGHT_CALIBRATION
      ack.result = 0; // MAV_RESULT_ACCEPTED

      console.log(
        "TX",
        ack.constructor.name,
        "command=",
        ack.command,
        "result=",
        ack.result,
      );

      await send(this.port, ack, gcsProtocolEngine);

      await new Promise((resolve) => setTimeout(resolve, 20));

      console.log(
        "TX",
        ack.constructor.name,
        "command=",
        ack.command,
        "result=",
        ack.result,
      );

      await send(this.port, ack, gcsProtocolEngine);

      console.log("COMPASSMOT CANCEL ACK SENT");
    } catch (err) {
      console.error(err);
    }
  }

  // async sendCompassMotCancel() {
  //   try {
  //     console.log(" COMPASSMOT: Sending cancellation command ...");

  //     await this.releaseThrottleOverride();
  //     console.log("runnedTheReleasedThrottle");

  //     const msg = new common.CommandLong();

  //
  // msg.targetSystem = this.targetSystem
  //     msg.targetComponent = this.targetComponent;
  //     msg.command = 241; // MAV_CMD_PREFLIGHT_CALIBRATION

  //     // Zeroing all parameters tells the active task loop manager to immediately stop
  //     msg._param1 = 0;
  //     msg._param2 = 0;
  //     msg._param3 = 0;
  //     msg._param4 = 0;
  //     msg._param5 = 0;
  //     msg._param6 = 0; // 0 forces CompassMot compilation registers to drop
  //     msg._param7 = 0;

  //     await send(this.port, msg, gcsProtocolEngine);
  //     console.log("COMPASSMOT: Calibration cancellation command transmitted.");
  //   } catch (error) {
  //     console.error(
  //       "COMPASSMOT: Failed to safely cancel calibration sequence:",
  //       error,
  //     );
  //   }
  // }

  async releaseThrottleOverride() {
    try {
      const msg = new common.RcChannelsOverride();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      msg.chan1Raw = 65535;
      msg.chan2Raw = 65535;
      msg.chan3Raw = 1000; //  In ArduPilot, setting a channel to 0 unlocks the override lock condition instantly
      msg.chan4Raw = 65535;
      msg.chan5Raw = 65535;
      msg.chan6Raw = 65535;
      msg.chan7Raw = 65535;
      msg.chan8Raw = 65535;

      await send(this.port, msg, gcsProtocolEngine);
      console.log(
        " [SAFETY]: Throttle channel override released back to physical RC Transmitter control.",
      );
    } catch (err) {
      console.error(
        " [SAFETY]: Failed to release throttle tracking link override:",
        err,
      );
    }
  }

  async sendHeartbeat() {
    try {
      if (!this.port || !this.port.isOpen) return;

      const msg = new minimal.Heartbeat();
      msg.type = 6;
      msg.autopilot = 8;
      msg.baseMode = 0;
      msg.customMode = 0;
      msg.systemStatus = 4;

      await send(this.port, msg, gcsProtocolEngine);

      // console.log("gcs heartbeat sent successfully with SystemID 255");

      // Pass the protocol to stamp the binary header bytes with 255
      await send(this.port, msg, gcsProtocolEngine);
      // await send(this.port, msg);
      // console.log("gcs heartbeat sent with SystemID 255");
    } catch (error) {
      console.error("Failure sending heartbeat:", error);
    }
  }

  async startCompassMotCalibration() {
    console.log(" COMPASSMOT: Sending start command");

    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 241; // MAV_CMD_PREFLIGHT_CALIBRATION

    msg._param1 = 0;
    msg._param2 = 0;
    msg._param3 = 0;
    msg._param4 = 0;
    msg._param5 = 0;
    msg._param6 = 1; // CompassMot
    msg._param7 = 0;

    console.log(" COMPASSMOT: command=241 param6=1");

    await send(this.port, msg, gcsProtocolEngine);

    console.log(" COMPASSMOT: command sent");
  }

  async startAccelCalibration() {
    try {
      const msg = new common.CommandLong();

      msg.targetSystem = this.targetSystem;

      msg.targetComponent = this.targetComponent;

      msg.command = 241;

      msg.confirmation = 0;

      msg._param1 = 0;
      msg._param2 = 0;
      msg._param3 = 0;
      msg._param4 = 0;
      msg._param5 = 1;
      msg._param6 = 0;
      msg._param7 = 0;

      // await send(this.port, msg);
      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.log(error);
    }
  }

  async AccellCalibrateLevelOnly() {
    try {
      const msg = new common.CommandLong();

      // Core identifiers routing directly to your flight controller
      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;

      // Command ID 241 corresponds to MAV_CMD_PREFLIGHT_CALIBRATION
      msg.command = 241;
      msg.confirmation = 0;

      // Parameter Breakdown for Level-Only Calibration:
      msg._param1 = 0; // Gyro calibration (0 = skip)
      msg._param2 = 0; // Magnetometer calibration (0 = skip)
      msg._param3 = 0; // Ground pressure/barometer calibration (0 = skip)
      msg._param4 = 0; // Radio calibration (0 = skip)

      //  MAGIC VALUE: 2 instructs ArduPilot to set level offsets using current attitude
      msg._param5 = 2;

      msg._param6 = 0; // Unused
      msg._param7 = 0; // Unused

      console.log(
        "[CALIBRATION] Dispatching level-only horizon calibration packet...",
      );
      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.error(
        "[CALIBRATION ERROR] Failed to send level calibration:",
        error,
      );
    }
  }

  sendAccelPosition(position) {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;

    msg.targetComponent = this.targetComponent;

    msg.command = 42429;

    msg.confirmation = 1;

    msg._param1 = position;
    msg._param2 = 0;
    msg._param3 = 0;
    msg._param4 = 0;
    msg._param5 = 0;
    msg._param6 = 0;
    msg._param7 = 0;

    send(this.port, msg, gcsProtocolEngine);
  }

  async startCompassCalibration() {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 42424;
    msg._param1 = 0;
    msg._param2 = 1;
    msg._param3 = 1;
    msg._param4 = 0;

    this.pendingCommands.set(42424, {
      command: 42424,
      time: Date.now(),
    });

    // await send(this.port, msg);
    await send(this.port, msg, gcsProtocolEngine);
  }

  async cancelCompassCalibration() {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 42425;

    await send(this.port, msg, gcsProtocolEngine);
  }

  async requestStreams() {
    const msg = new common.RequestDataStream();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.reqStreamId = 0; // all streams
    msg.reqMessageRate = 50;
    msg.startStop = 1;

    // await send(this.port, msg);
    await send(this.port, msg, gcsProtocolEngine);
  }

  // async requestStatusText() {
  //   const streamRequest = new common.RequestMessageCommand();

  //   streamRequest.targetSystem = 1;
  //   streamRequest.targetComponent = 1;

  //   streamRequest.messageId = 253; // 253  MAVLink ID for STATUSTEXT

  //   console.log("requestStatusText");

  //   await send(this.port, streamRequest);
  // }

  async setGuidedPosition(lat, lon, alt = 10) {
    console.log("setGuidedPosition Triggered");
    const msg = new common.SetPositionTargetGlobalInt();

    msg.timeBootMs = Date.now() > 0;

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.coordinateFrame = 6;

    msg.latInt = Math.round(lat * 1e7);
    msg.lonInt = Math.round(lon * 1e7);

    msg.alt = alt;

    // msg.typeMask = 0b0000111111111000;
    msg.typeMask = 3576;

    // Initialize unmapped mandatory MAVLink float payload parameters
    msg.vx = 0;
    msg.vy = 0;
    msg.vz = 0;
    msg.afx = 0;
    msg.afy = 0;
    msg.afz = 0;
    msg.yaw = 0;
    msg.yawRate = 0;

    await send(this.port, msg, gcsProtocolEngine);
    console.log(
      `[MAVLINK REPOSITON] Dispatched target point : Lat=${lat}, Lon=${lon}, Alt=${alt}m`,
    );
  }

  async repositionTo(lat, lon, alt = 10) {
    try {
      // const msg = new common.CommandLong();
      const msg = new common.CommandInt();

      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;
      msg.frame = 6;
      msg.command = 192;
      // msg.confirmation = 0;

      // msg._param1 = 0 ;
      // msg._param2 = 0;
      // msg._param3 = 0;
      // msg._param4 = 0;
      // msg._param5 = lat;
      // msg._param6 = lon;
      // msg._param7 = alt;

      msg.autocontinue = 0;
      msg._param1 = -1;
      msg._param2 = 0;
      msg._param3 = 0;
      msg._param4 = NaN;
      msg._param5 = Math.round(lat * 1e7);
      msg._param6 = Math.round(lon * 1e7);
      msg._param7 = alt;

      await send(this.port, msg, gcsProtocolEngine);
      console.log(
        `[MAVLINK REPOSITON] Dispatched target point : Lat=${lat}, Lon=${lon}, Alt=${alt}m`,
      );
    } catch (error) {
      console.error(
        "[MAVLINK REPOSITION ERROR] Failed to transmit command structure:",
        error,
      );
    }
  }

  // async takeoff(lat, lon, alt = 10, pitch = 0, yaw = NaN) {
  //   try {
  //     const msg = new common.CommandInt();

  //     msg.targetSystem = this.targetSystem;
  //     msg.targetComponent = this.targetComponent;
  //     msg.frame = 1; // MAV_FRAME_GLOBAL_RELATIVE_ALT_INT
  //     msg.command = 22; // MAV_CMD_NAV_TAKEOFF
  //     msg.autocontinue = 0;

  //     msg._param1 = pitch; // Minimum / desired pitch
  //     msg._param2 = 0;     // Empty
  //     msg._param3 = 0;     // Flags (NAV_TAKEOFF_FLAGS)
  //     msg._param4 = yaw;   // Yaw angle (NaN uses current heading mode)
  //     // msg._param5 = Math.round(lat * 1e7); // Latitude scaled to int32
  //     // msg._param6 = Math.round(lon * 1e7); // Longitude scaled to int32
  //     msg._param5 = lat === 0 ? 0 : Math.round(lat * 1e7);
  //     msg._param6 = lon === 0 ? 0 : Math.round(lon * 1e7);
  //     msg._param7 = alt;   // Altitude (float)

  //     await send(this.port, msg, gcsProtocolEngine);
  //     console.log(
  //       `[MAVLINK TAKEOFF] Dispatched takeoff target: Lat=${lat}, Lon=${lon}, Alt=${alt}m`,
  //     );
  //   } catch (error) {
  //     console.error(
  //       "[MAVLINK TAKEOFF ERROR] Failed to transmit command structure:",
  //       error,
  //     );
  //   }
  // }

  async takeoff(alt, ignoreHorizontalLock = false) {
    try {
      // console.log("takeoff alt is :", alt);
      console.log("take off method hitted");
      const msg = new common.CommandLong();
      msg.targetSystem = this.targetSystem;
      msg.targetComponent = this.targetComponent;
      // msg.frame = 1; // MAV_FRAME_GLOBAL_RELATIVE_ALT_INT
      msg.command = 22; // MAV_CMD_NAV_TAKEOFF
      // msg.autocontinue = 0;

      msg._param1 = 0;
      msg._param2 = 0;
      msg._param3 = 0;
      msg._param4 = 0;
      msg._param5 = 0;
      msg._param6 = 0;
      msg._param7 = alt;

      await send(this.port, msg, gcsProtocolEngine);
    } catch (error) {
      console.error(
        "[MAVLINK TAKEOFF ERROR] Failed to transmit command structure:",
        error,
      );
    }
  }

  async missionStart() {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;
    msg.command = 300; // MISSION_START

    await send(this.port, msg, gcsProtocolEngine);
  }
  async setVelocity(vx, vy, vz) {
    const msg = new common.SetPositionTargetLocalNed();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.vx = vx;
    msg.vy = vy;
    msg.vz = vz;

    msg.typeMask = 0b0000111111000111; // position ignored

    await send(this.port, msg, gcsProtocolEngine);
  }
  async setYaw(angle) {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 115; // CONDITION_YAW
    msg.param1 = angle;

    await send(this.port, msg, gcsProtocolEngine);
  }

  async toggleArm() {
    if (this.isVehicleArmed) {
      console.log("Vehicle is armed. Sending disarm command...");
      await this.disarm();
    } else {
      console.log("Vehicle is disarmed. Sending arm command...");
      await this.arm();
    }
  }

  async arm(force = false) {
    const msg = new common.CommandLong();

    msg.command = 400; // MAV_CMD_COMPONENT_ARM_DISARM
    msg._param1 = 1; // arm
    msg._param2 = force ? 2989 : 0;
    msg.confirmation = 0;
    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    const commandId = 400;

    this.pendingCommands.set(commandId, {
      command: 400,
      time: Date.now(),
    });

    await send(this.port, msg, gcsProtocolEngine);

    console.log("Drone Arm Successfull");

    console.log(
      `[INFO] [MAVLINK_TX] [ARM-FORCE = ${force}] Sending CMD_LONG (${msg.command}). Params: P1=${msg._param1}, P2=${msg._param2}`,
    );
  }

  async disarm(force = false) {
    const msg = new common.CommandLong();

    msg.command = 400;
    msg._param1 = 0; // disarm
    msg._param2 = force ? 21196 : 0;
    msg.confirmation = 0;
    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    await send(this.port, msg, gcsProtocolEngine);
    console.log("Drone Disarmed Successfull");

    console.log(
      `[INFO] [MAVLINK_TX] Sending CMD_LONG (${msg.command}). Params: P1=${msg._param1}, P2=${msg._param2}`,
    );
  }

  async land() {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 21; // LAND
    msg.param1 = 0;

    await send(this.port, msg, gcsProtocolEngine);
  }

  // async takeoff(altitude = 5) {
  //   const msg = new common.CommandLong();

  //   msg.command = 22; // MAV_CMD_NAV_TAKEOFF
  //   msg.param7 = altitude;

  //   msg.targetSystem = this.targetSystem;
  //   msg.targetComponent = this.targetComponent;

  //   await send(this.port, msg, gcsProtocolEngine);
  // }

  // async setMode(modeId) {
  //   const msg = new common.SetMode();

  //   msg.targetSystem = this.targetSystem;
  //   msg.baseMode = 1; // MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
  //   msg.customMode = modeId;

  //   await send(this.port, msg, gcsProtocolEngine);
  // }

  async setMode(modeId) {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = 1; // 1 represents the primary autopilot component (MAV_COMP_ID_AUTOPILOT1)
    msg.command = 176; // MAV_CMD_DO_SET_MODE
    msg.confirmation = 0; // First transmission of this command

    // Param 1: Base mode flag. 1 specifies MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
    msg._param1 = 1;

    // Param 2: The custom flight mode ID number (e.g., your modeId variable)
    msg._param2 = modeId;

    // Param 3: Sub-mode (Not used by ArduPilot, set to 0)
    msg._param3 = 0;

    // Params 4-7 are unused for this specific command and must be cleared to 0
    msg._param4 = 0;
    msg._param5 = 0;
    msg._param6 = 0;
    msg._param7 = 0;

    await send(this.port, msg, gcsProtocolEngine);

    console.log(
      `[INFO] [MAVLINK_TX] Sending CMD_LONG (${msg.command}). Params: P1=${msg._param1}, P2=${msg._param2}`,
    );
  }

  async rtl() {
    const msg = new common.CommandLong();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.command = 20; // MAV_CMD_NAV_RETURN_TO_LAUNCH

    await send(this.port, msg, gcsProtocolEngine);
  }

  onAck(command, status) {
    for (const [key, pending] of this.pendingCommands.entries()) {
      if (pending.command === command) {
        console.log(" ACK matched:", key, status);

        this.pendingCommands.delete(key);

        https: if (status === "ACCEPTED") {
          console.log(" SUCCESS:", key);
        } else {
          console.log(" FAILED:", key, status);
        }

        // optional: emit to UI
        this.win?.webContents.send("command-result", {
          command: key,
          status,
        });

        break;
      }
    }
  }
}
