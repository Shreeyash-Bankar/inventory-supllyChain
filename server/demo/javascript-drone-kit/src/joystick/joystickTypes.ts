// src/joystick/JoystickTypes.ts

export type AxisAction =
  | "roll"
  | "pitch"
  | "yaw"
  | "throttle"
  | "cameraYaw"
  | "cameraPitch"
  | "cameraZoom";

export type ButtonAction = "arm" | "disarm" | "setMode" | "cameraTrigger";

export type DroneMode =
  | "STABILIZE"
  | "ALT_HOLD"
  | "LOITER"
  | "GUIDED"
  | "RTL"
  | "LAND";

export interface AxisMapping {
  axis: number;
  action: AxisAction;

  /**
   * Reverse the axis.
   */
  invert?: boolean;

  /**
   * Ignore small joystick movements.
   *
   * Example:
   * 0.05 = ignore -0.05 to +0.05
   */
  deadzone?: number;

  /**
   * Output sensitivity.
   *
   * 1 = normal
   * 0.5 = half sensitivity
   * 2 = more aggressive
   */
  sensitivity?: number;
}

export interface ButtonMapping {
  button: number;
  action: ButtonAction;

  /**
   * Used when action === "setMode"
   */
  mode?: DroneMode;
}

export interface JoystickMapping {
  axes: AxisMapping[];
  buttons: ButtonMapping[];
}
