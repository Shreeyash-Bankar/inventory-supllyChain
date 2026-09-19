// src/joystick/JoystickMapping.ts

import type { JoystickMapping } from "./joystickTypes.js";

export const defaultJoystickMapping: JoystickMapping = {
  axes: [
    {
      axis: 0,
      action: "roll",
      invert: false,
      deadzone: 0.05,
      sensitivity: 1,
    },

    {
      axis: 1,
      action: "pitch",
      invert: true,
      deadzone: 0.05,
      sensitivity: 1,
    },

    {
      axis: 2,
      action: "throttle",
      invert: true,
      deadzone: 0.02,
      sensitivity: 1,
    },

    {
      axis: 3,
      action: "yaw",
      invert: false,
      deadzone: 0.05,
      sensitivity: 1,
    },
  ],

  buttons: [
    {
      button: 0,
      action: "arm",
    },

    {
      button: 1,
      action: "disarm",
    },

    {
      button: 2,
      action: "setMode",
      mode: "GUIDED",
    },

    {
      button: 3,
      action: "setMode",
      mode: "LOITER",
    },

    {
      button: 4,
      action: "setMode",
      mode: "RTL",
    },
  ],
};
