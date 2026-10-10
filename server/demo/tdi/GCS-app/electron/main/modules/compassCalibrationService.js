import { EventEmitter } from "node:events";

export class CompassCalibrationService extends EventEmitter {
  constructor(commandService, win) {
    super();

    this.commandService = commandService;
    this.win = win;

    this.reset();
  }

  reset() {
    this.state = {
      active: false,

      stage: "IDLE",

      progress: {},

      compasses: {},

      started: false,

      completed: false,

      success: false,

      failed: false,

      lastReport: null,

      startedAt: null,

      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
    };
  }

  async start() {
    this.reset();

    this.state.active = true;

    this.state.stage = "STARTING";

    this.state.startedAt = Date.now();

    this.broadcast();

    await this.commandService.startCompassCalibration();
  }

  async cancel() {
    await this.commandService.cancelCompassCalibration();

    this.state.active = false;

    this.state.stage = "CANCELLED";

    this.broadcast();
  }

  handleAck(command, result) {
    if (command !== 42424) return;

    if (result === 0) {
      this.state.stage = "WAITING_FOR_PROGRESS";

      this.broadcast();
    } else {
      this.state.stage = "START_REJECTED";

      this.state.failed = true;

      this.broadcast();
    }
  }

  handleProgress(msg) {
    if (!this.state.active) return;

    this.state.started = true;

    this.state.stage = "CALIBRATING";

    const compassId = msg.compassId;

    this.state.progress[compassId] = msg.completionPct;

    this.state.compasses[compassId] = {
      completionPct: msg.completionPct,

      completionMask: msg.completionMask,

      directionX: msg.directionX,

      directionY: msg.directionY,

      directionZ: msg.directionZ,
    };

    this.broadcast();
  }

  handleReport(msg) {
    if (!this.state.active) return;

    this.state.lastReport = msg;
    this.state.offsetX = msg.ofsX;
    this.state.offsetY = msg.ofsY;
    this.state.offsetZ = msg.ofsZ;

    const compassId = msg.compassId;

    const status = msg.calStatus;

    if (status === 4) {
      this.state.progress[compassId] = 100;

      const allFinished = Object.values(this.state.progress).every(
        (p) => p >= 100,
      );

      if (allFinished) {
        this.state.stage = "COMPLETE";

        this.state.success = true;

        this.state.completed = true;

        this.state.active = false;
      }
    } else {
      this.state.failed = true;

      this.state.stage = "FAILED";
    }

    this.broadcast();
  }

  broadcast() {
    this.win.webContents.send(
      "compass-calibration-status",
      structuredClone(this.state),
    );
  }
}
//statusText Receving : Mag(0) internal bad orientation: 10 11.1 , severity : 2
