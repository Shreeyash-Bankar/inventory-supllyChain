export class JoystickService {
  // Define a static default configuration so it's always accessible
  // static DEFAULT_CONFIG = {
  //   axes: { 0: "roll", 1: "pitch", 2: "yaw", 3: "throttle" },
  //   buttons: {
  //     0: "ARM_TOGGLE",
  //     1: "MODE_RTL",
  //     2: "MODE_LOITER",
  //     3: "MODE_ALTHOLD",
  //     4: "MODE_STABILIZE",
  //     5: "MODE_GUIDED",
  //     6: "MODE_LAND",
  //   },
  // };
  static DEFAULT_CONFIG = {
    axes: {
      0: "yaw",
      1: "throttle",
      2: "roll",
      3: "pitch",
    },

    buttons: {
      0: "MODE_LAND", // A
      1: "MODE_RTL", // B
      2: "MODE_GUIDED", // X
      3: "MODE_LOITER", // Y
      4: "MODE_STABILIZE", //LB
      5: "MODE_ALTHOLD", // RB
    },
  };

  constructor(commandService) {
    this.commandService = commandService;

    // Use the static reference safely to deep clone your fallback layout
    this.config = JSON.parse(JSON.stringify(JoystickService.DEFAULT_CONFIG));

    this.axes = { roll: 0, pitch: 0, yaw: 0, throttle: -1 };
    this.buttons = [];
    this.previousButtons = [];
    this.interval = null;
  }

  setConfiguration(newConfig) {
    if (!newConfig) {
      this.config = JSON.parse(JSON.stringify(JoystickService.DEFAULT_CONFIG));
      console.log(
        "[BACKEND-JOYSTICK] Received empty config. Resetting to system fallback mappings.",
      );
      return;
    }

    // Safely merge incoming configuration properties with static fallbacks
    this.config = {
      axes: {
        ...JoystickService.DEFAULT_CONFIG.axes,
        ...(newConfig.axes || {}),
      },
      buttons: {
        ...JoystickService.DEFAULT_CONFIG.buttons,
        ...(newConfig.buttons || {}),
      },
    };
    console.log(" Current Active Button Assignments:");
    Object.entries(this.config.buttons).forEach(([buttonIndex, actionName]) => {
      console.log(
        `   • [Button ${buttonIndex}] ──► Assigned to Function: ${actionName}`,
      );
    });

    console.log(" Current Active Axis Assignments:");
    Object.entries(this.config.axes).forEach(([axisIndex, actionName]) => {
      console.log(
        `   • [Axis ${axisIndex}] ──► Assigned to Function: ${actionName.toUpperCase()}`,
      );
    });
    console.log(
      "[BACKEND-JOYSTICK] Configuration merged. Active mapping shape:",
      this.config,
    );
  }

  updateAxes(data) {
    const rawAxes = data.axes ?? [];
    let rawButtons = data.buttons ?? [];
    rawButtons = rawButtons.map((b) => (b === true || b === 1 ? 1 : 0));

    if (rawAxes.length > 0 || rawButtons.length > 0) {
      console.log(
        `[BACKEND-JOYSTICK] Axes Data: [${rawAxes.map((v) => v.toFixed(2)).join(", ")}] | 🔴 Buttons Data: [${rawButtons.map((b) => (b ? "1" : "0")).join(", ")}]`,
      );
    }

    let nextAxes = { roll: 0, pitch: 0, yaw: 0, throttle: -1 };

    // rawAxes.forEach((axisValue, index) => {
    //   // Safely point to JoystickService.DEFAULT_CONFIG instead of this.DEFAULT_CONFIG
    //   const assignedAction =
    //     this.config.axes[index] ||
    //     JoystickService.DEFAULT_CONFIG.axes[index] ||
    //     "unassigned";

    //   if (assignedAction !== "unassigned") {
    //     if (assignedAction === "pitch" || assignedAction === "throttle") {
    //       nextAxes[assignedAction] = -axisValue;
    //     } else {
    //       nextAxes[assignedAction] = axisValue;
    //     }
    //   }
    // });

    // rawAxes.forEach((axisValue, index) => {
    //   const assignedAction = this.config.axes[index] || "unassigned";

    //   if (assignedAction !== "unassigned") {
    //     // Clean, single-point inversion logic for flight hardware standards
    //     // Gamepad standard is typically Down/Right = Positive, Flight is Up/Right = Positive
    //     if (assignedAction === "pitch" || assignedAction === "throttle") {
    //       nextAxes[assignedAction] = -axisValue;
    //     } else {
    //       nextAxes[assignedAction] = axisValue;
    //     }
    //   }
    // });

    rawAxes.forEach((axisValue, index) => {
      const assignedAction = this.config.axes[index] || "unassigned";

      if (assignedAction !== "unassigned") {
        if (assignedAction === "throttle") {
          nextAxes[assignedAction] = -axisValue;
        } else if (assignedAction === "pitch") {
          //  FIX: Keep the raw value.
          // Up on stick (-1.0) ──► nextAxes.pitch = -1.0 ──► axisToPwm = 1000 PWM
          // Down on stick (+1.0) ──► nextAxes.pitch = +1.0 ──► axisToPwm = 2000 PWM
          nextAxes[assignedAction] = axisValue;
        } else {
          nextAxes[assignedAction] = axisValue;
        }
      }
    });

    this.axes = nextAxes;

    if (data.buttons) {
      this.previousButtons = this.buttons.length
        ? [...this.buttons]
        : new Array(rawButtons.length).fill(0);

      this.buttons = [...rawButtons];

      this.handleButtonActions();
    }
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.sendOverride();
      // this.handleButtonActions();
      this.previousButtons = [...this.buttons];
    }, 50); //20Hz
  }

  async stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
    await this.commandService.sendRCOverride({
      roll: 1500,
      pitch: 1500,
      yaw: 1500,
      throttle: 1000,
    });
  }

  deadband(value, threshold = 0.05) {
    const absValue = Math.abs(value);
    if (absValue < threshold) return 0;
    const sign = Math.sign(value);
    return sign * ((absValue - threshold) / (1.0 - threshold));
  }

  // sendOverride() {
  //   const rollPwm = this.axisToPwm(this.axes.roll);
  //   const pitchPwm = this.axisToPwm(-this.axes.pitch);
  //   const yawPwm = this.axisToPwm(this.axes.yaw);
  //   const throttlePwm = this.throttleToPwm(-this.axes.throttle);

  //   this.commandService.sendRCOverride({
  //     roll: rollPwm,
  //     pitch: pitchPwm,
  //     yaw: yawPwm,
  //     throttle: throttlePwm,
  //   });
  // }

  sendOverride() {
    // 🪄 The real axis magic: Map directly from the cleaned object properties
    // No secondary hardcoded negative signs!
    const rollPwm = this.axisToPwm(this.axes.roll);
    const pitchPwm = this.axisToPwm(this.axes.pitch);
    const yawPwm = this.axisToPwm(this.axes.yaw);
    const throttlePwm = this.throttleToPwm(this.axes.throttle);

    this.commandService.sendRCOverride({
      roll: rollPwm,
      pitch: pitchPwm,
      yaw: yawPwm,
      throttle: throttlePwm,
    });
  }

  handleButtonActions() {
    if (this.buttons.length === 0) return;

    const isJustPressed = (index) => {
      // Check if currently 1 (pressed) and previously 0 (not pressed)
      return (
        Number(this.buttons[index]) === 1 &&
        Number(this.previousButtons[index]) === 0
      );
    };

    this.buttons.forEach((_, index) => {
      if (isJustPressed(index)) {
        const assignedAction = this.config.buttons[index];
        if (assignedAction && assignedAction !== "unassigned") {
          this.executeCustomAction(assignedAction);
        }
      }
    });
  }

  executeCustomAction(actionKey) {
    console.log(`Triggering custom action map key: ${actionKey}`);
    switch (actionKey) {
      case "ARM_TOGGLE":
        console.log("Executing: toggleArm");
        // this.commandService.toggleArm();
        break;
      case "MODE_RTL":
        console.log("Executing: Mode rtl");
        this.commandService.setMode(6);
        break;
      case "MODE_LOITER":
        console.log("Executing: Loiter");
        this.commandService.setMode(5);
        break;
      case "MODE_ALTHOLD":
        console.log("Executing: AltHold");
        this.commandService.setMode(2);
        break;

      case "MODE_STABILIZE":
        console.log("Executing: Stabilize Mode");
        this.commandService.setMode(0); // ArduPilot Stabilize is mode 1
        break;
      case "MODE_GUIDED":
        console.log("Executing: Guided Mode");
        this.commandService.setMode(4); // ArduPilot Guided is mode 4
        break;
      case "MODE_LAND":
        console.log("Executing: Land Mode");
        this.commandService.setMode(9); // ArduPilot Land is mode 9
        break;
      default:
        console.warn(`Action string unrecognized: ${actionKey}`);
    }
  }

  axisToPwm(axis) {
    const clamped = Math.max(-1, Math.min(1, axis));
    const cleanAxis = this.deadband(clamped);
    return Math.round(1500 + cleanAxis * 500);
  }

  throttleToPwm(axis) {
    const clamped = Math.max(-1, Math.min(1, axis));
    return Math.round(1000 + ((clamped + 1) / 2) * 1000);
  }
}
