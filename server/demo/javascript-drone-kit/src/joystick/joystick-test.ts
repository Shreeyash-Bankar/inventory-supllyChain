// // @ts-ignore
// import { installNavigatorShim } from "gamepad-node";

// installNavigatorShim();

// setInterval(() => {
//   const gamepads = navigator.getGamepads();

//   for (const gamepad of gamepads) {
//     if (!gamepad) continue;
//     console.log(gamepad);
//     console.log("================================");
//     console.log("Controller:", gamepad.id);
//     console.log("Axes:", [...gamepad.axes]);

//     gamepad.buttons.forEach((button, index) => {
//       console.log(
//         `Button ${index}: pressed=${button.pressed}, value=${button.value}`,
//       );
//     });
//   }
// }, 100);

import { JoystickManager } from "./joystickManager.js";
import { defaultJoystickMapping } from "./joystickMapping.js";

const joystick = new JoystickManager(defaultJoystickMapping);

console.log("Joystick manager started");

joystick.start();
