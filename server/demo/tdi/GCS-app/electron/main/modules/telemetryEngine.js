import {
  MavLinkPacketSplitter,
  MavLinkPacketParser,
  minimal,
  common,
  ardupilotmega,
} from "node-mavlink";

const REGISTRY = {
  ...minimal.REGISTRY,
  ...common.REGISTRY,
  ...ardupilotmega.REGISTRY,
};

const WHITELIST_MSGS = [
  "Attitude",
  "GlobalPositionInt",
  "VfrHud",
  "SysStatus",
  "ParamValue",
  "MissionCurrent",
  "Heartbeat",
  "PowerStatus",
  "GpsRawInt",
  "StatusText",
  "CommandAck",
  "CompassMotStatus",
  "EkfStatusReport",
  "Vibration",
];

const MESSAGE_INTERVALS = {
  Attitude: 200, // 5 Hz
  GlobalPositionInt: 500, // 2 Hz
  VfrHud: 500, // 2 Hz
  SysStatus: 1000, // 1 Hz
  ParamValue: 1000, // 1 Hz
  MissionCurrent: 1000, // 1 Hz
  Heartbeat: 200,
  PowerStatus: 1000,
  GpsRawInt: 200,
  StatusText: 0,
  CommandAck: 0,
  CompassMotStatus: 0,
  EkfStatusReport: 1000,
  Vibration: 1000,
};

export class TelemetryEngine {
  constructor({
    port,
    win,
    flightState,
    paramService,
    commandService,
    hardwareCheck,
    calibrationService,
    compassCalibrationService,
    compassMotCalibrationService,
  }) {
    this.port = port;
    this.win = win;
    this.flightState = flightState;
    this.paramService = paramService;
    this.commandService = commandService;
    this.hardwareCheck = hardwareCheck;
    this.calibrationService = calibrationService;
    this.compassCalibrationService = compassCalibrationService;
    this.compassMotCalibrationService = compassMotCalibrationService;

    this.splitter = new MavLinkPacketSplitter();
    this.parser = new MavLinkPacketParser();

    this.onData = this.onData.bind(this);
    this.onPacket = this.onPacket.bind(this);
    this.messagesPerSecond = 0;
    this.totalMessages = 0;
    this.lastSent = {};
  }

  start() {
    this.port.on("data", this.onData);
    this.splitter.pipe(this.parser);
    // this.parser.on("data", this.onPacket);
    this.parser.on("data", (packet) => this.onPacket(packet));

    this.parser.on("error", console.error);

    // Print every second
    this.statsInterval = setInterval(() => {
      // console.log(` ${this.messagesPerSecond} MAVLink msgs/sec`);

      this.messagesPerSecond = 0;
    }, 1000);

    console.log(" TelemetryEngine started");
  }

  stop() {
    try {
      this.port?.off("data", this.onData);

      this.splitter?.removeAllListeners();
      this.parser?.removeAllListeners();

      this.splitter = null;
      this.parser = null;

      console.log(" TelemetryEngine stopped");
    } catch (e) {
      console.error("TelemetryEngine stop error:", e);
    }
  }

  onData(chunk) {
    this.splitter.write(chunk);
  }

  onPacket(packet) {
    try {
      // console.log(
      //   "[RAW MAVLINK]",
      //   "msgid=",
      //   packet.header.msgid,
      //   "sys=",
      //   packet.header.systemid,
      //   "comp=",
      //   packet.header.componentid,
      // );
      this.messagesPerSecond++;
      this.totalMessages++;
      // console.log(packet);
      if (!packet?.header) return;

      //capturing the system id
      const currentSysId = packet.header.sysid;
      const currentCompId = packet.header.compid;
      // console.log(packet.header);

      //  2. Push it straight into your command service so it stays updated
      if (this.commandService) {
        this.commandService.targetSystem = currentSysId;
        this.commandService.targetComponent = currentCompId;
        // console.log("the targetStystem is:", currentSysId);
        // console.log("the targetComponent is :", currentCompId);
      }

      if (this.paramService) {
        this.paramService.targetSystem = currentSysId;
        this.paramService.targetComponent = currentCompId;
        // console.log("param service targetSystem:", currentSysId);
      }

      const Clazz = REGISTRY[packet.header.msgid];
      if (!Clazz) return;

      const msg = packet.protocol.data(packet.payload, Clazz);
      if (!msg) return;

      const msgType = Clazz.name;
      // console.log("TELEM ONPACKET:", msgType, "msgid=", packet.header.msgid);
      // this.hardwareCheck?.processIncomingTelemetry(msgType, msg);
      // console.log(msg);

      // -------------------------
      // STATE UPDATES
      // -------------------------
      if (packet.header.msgid === 1) {
        this.flightState?.updateSysStatus(msg);
      }

      if (packet.header.msgid === 74) {
        this.flightState?.updateVfrHud(msg);
      }

      if (packet.header.msgid === 193) {
        this.flightState?.updateEkfStatus(msg);
      }
      if (packet.header.msgid === 0) {
        this.flightState?.updateHeartbeat(msg);
        this.commandService?.handleHeartbeat(msg);
      }

      if (packet.header.msgid === 33) {
        this.flightState?.updatePosition(msg);
      }

      if (packet.header.msgid === 177) {
        this.compassMotCalibrationService?.handleCompassMotStatusMessage(msg);
        console.log("object of compassMotStatus = 177: ", msg);
      }

      if (packet.header.msgid === 24) {
        this.flightState?.updateGPS(msg);
      }
      if (packet.header.msgid === 253) {
        console.log(
          `statusText Receving : ${msg.text} , severity : ${msg.severity} `,
        );
        // console.log(`message: ${msg}`);
        this.calibrationService?.handleStatusText(msg.text);
        this.compassMotCalibrationService?.handleStatusText(msg.text);
        this.win.webContents.send("telemetry", {
          type: "StatusText",
          data: msg,
          sentAt: Date.now(),
        });
      }

      if (packet.header.msgid === 76) {
        // COMMAND_LONG
        const cmdLong = packet.protocol.data(
          packet.payload,
          common.CommandLong,
        );

        // If the drone is sending command 42429, it's telling us what position it wants!
        if (
          cmdLong.command === 42429 &&
          this.calibrationService?.state.active
        ) {
          console.log(
            `[DRONE SOURCE] Drone is explicitly requesting position index: ${cmdLong._param1}`,
          );
          this.calibrationService.handleDroneRequestedPosition(cmdLong._param1);
        }
      }

      if (packet.header.msgid === 77) {
        console.log("this message is from command_ack", msg);
        console.log(
          ` [DRONE ACK RESULT] Received response for command ${msg.command}. Result code is: ${msg.result}`,
          msg,
        );
        const command = msg.command;
        const result = msg.result;

        let status = "UNKNOWN";

        switch (result) {
          case 0:
            status = "ACCEPTED";
            break;

          case 1:
            status = "TEMP_REJECTED";
            break;
          case 2:
            status = "DENIED";
            break;
          case 3:
            status = "UNSUPPORTED";
            break;
          case 4:
            status = "FAILED";
            break;
        }

        this.flightState?.updateAck(command, status);

        this.commandService?.onAck(command, status);

        // this.calibrationService?.handleAck(command, result);

        this.compassCalibrationService?.handleAck(command, result);

        this.compassMotCalibrationService?.handleAck(command, result);
      }

      if (msgType === "MagCalProgress") {
        console.log("Received MagCalProgress ", msgType);
        this.compassCalibrationService?.handleProgress(msg);
      }

      if (msgType === "MagCalReport") {
        console.log("Received MagCalReport", msgType);
        this.compassCalibrationService?.handleReport(msg);
      }

      this.paramService?.handle?.(msg);

      const now = Date.now();

      if (!WHITELIST_MSGS.includes(msgType)) return;

      // Throttle messages
      const interval = MESSAGE_INTERVALS[msgType] || 1000;
      if (this.lastSent[msgType] && now - this.lastSent[msgType] < interval) {
        return; // skip sending
      }
      this.lastSent[msgType] = now;
      this.hardwareCheck?.processIncomingTelemetry(msgType, msg);
      // this.lastSent[msgType] = now;

      const sentAt = Date.now();

      // Send telemetry to UI
      this.win.webContents.send("telemetry", {
        type: msgType,
        data: msg,
        sentAt,
      });
    } catch (err) {
      console.error("Telemetry decode error:", err);
    }
  }
}
