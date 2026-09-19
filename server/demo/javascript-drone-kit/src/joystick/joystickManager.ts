// src/joystick/JoystickManager.ts
// @ts-ignore
import { installNavigatorShim } from "gamepad-node";

import type {
  JoystickMapping,
  AxisMapping,
  ButtonMapping,
} from "./joystickTypes.js";

export interface JoystickAxisEvent {
  action: string;
  value: number;
}

export interface JoystickButtonEvent {
  action: string;
  pressed: boolean;
  mode?: string;
}

export class JoystickManager {
  private mapping: JoystickMapping;

  private running = false;

  private interval: NodeJS.Timeout | null = null;

  private previousButtons = new Map<number, boolean>();

  constructor(mapping: JoystickMapping) {
    this.mapping = mapping;

    // Makes navigator.getGamepads() available in Node.
    installNavigatorShim();
  }

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    this.interval = setInterval(() => {
      this.poll();
    }, 50);
  }

  stop(): void {
    this.running = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  setMapping(mapping: JoystickMapping): void {
    this.mapping = mapping;
  }

  getMapping(): JoystickMapping {
    return this.mapping;
  }

  private poll(): void {
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (!gamepad) {
        continue;
      }

      this.processAxes(gamepad);
      this.processButtons(gamepad);

      // Currently we only process the first controller.
      break;
    }
  }

  private processAxes(gamepad: any): void {
    for (const mapping of this.mapping.axes) {
      const rawValue = gamepad.axes[mapping.axis];

      if (rawValue === undefined) {
        continue;
      }

      const value = this.processAxis(rawValue, mapping);

      this.emitAxis({
        action: mapping.action,
        value,
      });
    }
  }

  private processButtons(gamepad: any): void {
    for (const mapping of this.mapping.buttons) {
      const button = gamepad.buttons[mapping.button];

      if (!button) {
        continue;
      }

      const pressed = button.pressed;

      const previous = this.previousButtons.get(mapping.button) ?? false;

      /*
       * Only emit when the button changes.
       */
      if (pressed !== previous) {
        this.previousButtons.set(mapping.button, pressed);

        this.emitButton({
          action: mapping.action,
          pressed,
          mode: mapping.mode,
        });
      }
    }
  }

  private processAxis(value: number, mapping: AxisMapping): number {
    let result = value;

    /*
     * Invert
     */
    if (mapping.invert) {
      result *= -1;
    }

    /*
     * Deadzone
     */
    const deadzone = mapping.deadzone ?? 0;

    if (Math.abs(result) < deadzone) {
      result = 0;
    } else if (deadzone > 0) {
      /*
       * Rescale the remaining range so that
       * the output still reaches -1 to +1.
       */
      const sign = result < 0 ? -1 : 1;

      result = sign * ((Math.abs(result) - deadzone) / (1 - deadzone));
    }

    /*
     * Sensitivity
     */
    const sensitivity = mapping.sensitivity ?? 1;

    result *= sensitivity;

    /*
     * Clamp
     */
    result = Math.max(-1, Math.min(1, result));

    return result;
  }

  protected emitAxis(event: JoystickAxisEvent): void {
    console.log(`[AXIS] ${event.action}: ${event.value.toFixed(3)}`);
  }

  protected emitButton(event: JoystickButtonEvent): void {
    console.log(
      `[BUTTON] ${event.action}: ${event.pressed ? "PRESSED" : "RELEASED"}`,
    );

    if (event.mode) {
      console.log(`       Mode: ${event.mode}`);
    }
  }
}
