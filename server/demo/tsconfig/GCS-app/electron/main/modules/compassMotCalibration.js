export class CompassMotCalibrationService {
  constructor(commandService, win) {
    this.commandService = commandService;
    this.win = win;
    this.compassMotRunning = false;
    // this.throttle = 0;
    this.userThrottlePercent = 0;
    this.telemetryRawThrottle = 1000;
    this.currentInterference = 0;
    this.currentAmps = 0;
    this.overrideTimer = null;
    this.compensationX = 0;
    this.compensationY = 0;
    this.compensationZ = 0;
  }

  startThrottleOverrideLoop() {
    if (this.overrideTimer) {
      clearInterval(this.overrideTimer);
    }

    this.overrideTimer = setInterval(() => {
      if (!this.compassMotRunning) return;

      this.commandService.setThrottle(this.userThrottlePercent);
    }, 20); // 50 Hz
  }

  stopThrottleOverrideLoop() {
    if (this.overrideTimer) {
      clearInterval(this.overrideTimer);
      this.overrideTimer = null;
    }
  }

  async startCompassMot() {
    console.log("");

    console.log(" STARTING COMPASSMOT");

    this.compassMotRunning = true;
    this.startThrottleOverrideLoop();
    this.currentInterference = 0;
    this.currentAmps = 0;
    this.userThrottlePercent = 0;
    this.interferenceX = 0;
    this.interferenceY = 0;
    this.interferenceZ = 0;

    this.win.webContents.send("compassmot-status", {
      state: "STARTING",
    });

    await this.commandService.startCompassMotCalibration();
  }

  handleUserThrottleInput(throttlePercentage) {
    if (!this.compassMotRunning) return;

    // if (this.commandService.setThrottle) {
    //   this.commandService.setThrottle(throttlePercentage);
    // }

    this.userThrottlePercent = Math.min(Number(throttlePercentage), 80);
  }

  async stopCompassMot() {
    if (!this.compassMotRunning) return;
    console.log("manual abort requested by pilot");

    this.stopThrottleOverrideLoop();

    await this.commandService.releaseThrottleOverride();

    await this.commandService.sendCompassMotCancel();

    this.win.webContents.send("compassmot-status", {
      state: "FAILED",
    });

    this.compassMotRunning = false;
  }

  handleAck(command, result) {
    // console.log(` COMPASSMOT ACK command=${command} result=${result}`);

    if (!this.compassMotRunning) return;

    if (command !== 241) return;

    switch (result) {
      case 0:
        console.log(" COMPASSMOT accepted by FC");

        this.win.webContents.send("compassmot-status", {
          state: "ACCEPTED",
        });

        break;

      case 1:
        console.log(" COMPASSMOT temporarily rejected");

        break;

      case 2:
        console.log(" COMPASSMOT denied");

        break;

      case 3:
        console.log("COMPASSMOT unsupported");

        break;

      case 4:
        console.log(" COMPASSMOT failed");
        console.log(" COMPASSMOT startup rejected by flight hardware rules.");
        this.compassMotRunning = false;
        this.win.webContents.send("compassmot-status", {
          state: "FAILED",
        });

        break;
    }
  }

  handleCompassMotStatusMessage(msg) {
    if (!this.compassMotRunning) return;

    // const rawThrottle = msg.throttle; // Standard servo input (1000 - 2000)
    const rawThrottle = Number(msg.throttle);
    const amps = Number(msg.current); // Live power consumption
    const percent = Number(msg.interference); // Live calculated magnetic distortion %
    const compensationX = msg.compensationX;
    const compensationY = msg.compensationY;
    const compensationZ = msg.compensationZ;
    this.telemetryRawThrottle = rawThrottle;
    this.currentAmps = amps;

    const throttlePercent = Math.round(rawThrottle / 10);
    // Pipe the numeric parameters straight to the frontend charting state arrays
    this.win.webContents.send("compassmot-status", {
      state: "ComMotCalTel",
      current: amps,
      interference: percent,
      throttle: throttlePercent,
      compensationX: compensationX,
      compensationY: compensationY,
      compensationZ: compensationZ,
    });
  }

  async handleStatusText(text) {
    if (!this.compassMotRunning) return;

    console.log(` COMPASSMOT STATUSTEXT: ${text}`);

    this.win.webContents.send("compassmot-status", {
      state: "MESSAGE",
      text,
    });

    if (
      text.toLowerCase().includes("successful") ||
      text.toLowerCase().includes("complete")
    ) {
      this.stopThrottleOverrideLoop();
      await this.commandService.releaseThrottleOverride();
      console.log(" COMPASSMOT run COMPLETED SUCCESSFULLY");
      console.log(`Final Interference = ${this.currentInterference}%`);
      console.log(`Final Current = ${this.currentAmps}A`);

      this.compassMotRunning = false;
      this.win.webContents.send("compassmot-status", {
        state: "COMPLETE",
        interference: this.currentInterference,
        current: this.currentAmps,
      });
    }

    if (text.toLowerCase().includes("failed")) {
      this.stopThrottleOverrideLoop();
      await this.commandService.releaseThrottleOverride();
      console.log(" COMPASSMOT TERMINATED BY FC , Failed");
      this.compassMotRunning = false;
      this.win.webContents.send("compassmot-status", {
        state: "FAILED",
      });
    }
  }
}
