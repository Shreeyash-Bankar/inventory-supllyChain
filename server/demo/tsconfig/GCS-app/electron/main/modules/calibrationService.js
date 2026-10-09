export const ACCEL_POSITIONS = {
  LEVEL: 1,

  LEFT: 2,

  RIGHT: 3,

  NOSE_DOWN: 4,

  NOSE_UP: 5,

  BACK: 6,
};

import { EventEmitter } from "events";

export class CalibrationService extends EventEmitter {
  constructor(commandService, win) {
    super();

    this.commandService = commandService;

    this.win = win;

    this.reset();
  }

  reset() {
    this.state = {
      active: false,

      currentInstruction: "",

      currentPosition: null,

      progress: 0,

      success: false,

      waitingForUser: false,
    };
  }

  async start() {
    console.log("in the calibrationService start function");
    this.reset();

    this.state.active = true;

    await this.commandService.startAccelCalibration();

    this.broadcast();
    console.log(this.state);
  }

  async startLevelCalib() {
    console.log(
      "[ACCEL LEVEL CAL] Starting level-only accelerometer calibration",
    );

    try {
      // Level calibration is NOT the 6-position state machine.
      // Do not set this.state.active = true.

      await this.commandService.AccellCalibrateLevelOnly();

      console.log(
        "[ACCEL LEVEL CAL] Level-only calibration command sent successfully",
      );
    } catch (error) {
      console.error(
        "[ACCEL LEVEL CAL] Failed to start level-only calibration:",
        error,
      );

      throw error;
    }
  }

  updateInstructionText(position) {
    switch (position) {
      case ACCEL_POSITIONS.LEVEL:
        this.state.currentInstruction =
          "Place vehicle level and press confirm.";
        break;
      case ACCEL_POSITIONS.LEFT:
        this.state.currentInstruction = "Place vehicle on its LEFT side.";
        break;
      case ACCEL_POSITIONS.RIGHT:
        this.state.currentInstruction = "Place vehicle on its RIGHT side.";
        break;
      case ACCEL_POSITIONS.NOSE_DOWN:
        this.state.currentInstruction = "Point vehicle NOSE DOWN straight.";
        break;
      case ACCEL_POSITIONS.NOSE_UP:
        this.state.currentInstruction = "Point vehicle NOSE UP straight.";
        break;
      case ACCEL_POSITIONS.BACK:
        this.state.currentInstruction = "Flip vehicle upside down on its BACK.";
        break;
      default:
        this.state.currentInstruction = "Waiting for drone instruction...";
    }
  }

  async confirmPosition() {
    console.log("[BACKEND] confirmPosition called");

    console.log("[BACKEND] waitingForUser:", this.state.waitingForUser);

    console.log("[BACKEND] currentPosition:", this.state.currentPosition);

    if (!this.state.waitingForUser) {
      console.log("[BACKEND] Ignored because waitingForUser=false");
      return;
    }

    const position = this.state.currentPosition;

    console.log("[BACKEND] Sending position:", position);

    await this.commandService.sendAccelPosition(position);

    this.state.waitingForUser = false;

    this.broadcast();
  }

  handleStatusText(text) {
    if (!this.state.active) return;

    const lower = text.toLowerCase();

    const calibrationMessage =
      lower.includes("level") ||
      lower.includes("left") ||
      lower.includes("right") ||
      lower.includes("nose down") ||
      lower.includes("nose up") ||
      lower.includes("back") ||
      lower.includes("calibration successful") ||
      lower.includes("trim ok") ||
      lower.includes("calibration failed");

    if (!calibrationMessage) return;

    // this.state.currentInstruction = text;

    if (lower.includes("trim ok") || lower.includes("Calibration successful")) {
      console.log(" [ACCEL calibration]: Calibration completed.");
      this.state.currentInstruction = text; // "Trim OK: roll=0.28 pitch=-0.67 yaw=0.00"
      // this.state.success = true;
      // this.state.progress = 100;
      // this.state.waitingForUser = false;
      // this.state.active = false;

      this.broadcast();
    }

    if (lower.includes("right")) {
      // this.state.currentPosition = ACCEL_POSITIONS.RIGHT;
      // this.state.progress = 40;
      // this.state.waitingForUser = true;
      // this.state.currentInstruction = text;
    }

    if (lower.includes("nose down")) {
      // this.state.currentPosition = ACCEL_POSITIONS.NOSE_DOWN;
      // this.state.progress = 55;
      // this.state.waitingForUser = true;
      // this.state.currentInstruction = text;
    }

    if (lower.includes("nose up")) {
      // this.state.currentPosition = ACCEL_POSITIONS.NOSE_UP;
      // this.state.progress = 70;
      // this.state.waitingForUser = true;
      // this.state.currentInstruction = text;
    }

    if (lower.includes("back")) {
      // this.state.currentPosition = ACCEL_POSITIONS.BACK;
      // this.state.progress = 85;
      // this.state.waitingForUser = true;
      // this.state.currentInstruction = text;
    }

    if (lower.includes("calibration successful")) {
      // this.state.success = true;
      // this.state.progress = 100;
      // this.state.waitingForUser = false;
      // this.state.currentInstruction = text;
    }

    if (lower.includes("calibration failed")) {
      this.reset();
    }

    this.broadcast();
  }

  handleDroneRequestedPosition(positionIndex) {
    // 1. CRITICAL GUARD: If calibration is already complete or turned off,
    // immediately exit to stop the logs and thrashing loops.
    if (!this.state.active) {
      return;
    }

    // 2. TERMINAL COMPLETION CATCHER: Handle ArduPilot's exit/done flag (-1 / 16777215)
    if (positionIndex === 16777215 || positionIndex <= 0) {
      console.log(
        " [ACCEL SERVICE] Drone pushed completion marker index. Wrapping up. ",
      );

      this.state.currentInstruction =
        "Calibration successful! You can safely close this panel.";
      this.state.success = true;
      this.state.progress = 100;
      this.state.waitingForUser = false; // Disable frontend confirm button
      this.state.active = false; //  This turns off the service and trips Guard #1 on next packet!

      this.broadcast();
      return; // Exit immediately
    }

    // 3. STEP PROTECTION: If we are already waiting for this exact step, do nothing
    if (
      this.state.currentPosition === positionIndex &&
      this.state.waitingForUser === true
    ) {
      return;
    }

    // 4. STEP STEPPING: Update indices for a valid new position step (1 to 6)
    console.log(
      ` [ACCEL SERVICE] State updated cleanly using MAVLink ID to position: ${positionIndex}`,
    );
    this.state.currentPosition = positionIndex;
    this.state.waitingForUser = true; // Safely unlock frontend button
    this.updateInstructionText(positionIndex);

    // Dynamically calculate progress bar percentage smoothly
    this.state.progress = Math.round((positionIndex / 6) * 90);

    this.broadcast();
  }

  stopAccellCalibration() {
    this?.removeAllListeners();
  }

  broadcast() {
    this.win.webContents.send("accel-calibration-status", this.state);
  }
}
