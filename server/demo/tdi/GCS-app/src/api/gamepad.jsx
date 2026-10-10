// // import { useEffect } from "react";

// // export function useJoystick() {
// //   useEffect(() => {
// //     const handleConnected = (e) => {
// //       console.log(`Joystick plugged in: ${e.gamepad.id}`);
// //       window.electron?.enableJoystick();
// //     };

// //     const handleDisconnected = (e) => {
// //       console.log("Joystick pulled out.");
// //       window.electron?.disableJoystick();
// //     };

// //     window.addEventListener("gamepadconnected", handleConnected);
// //     window.addEventListener("gamepaddisconnected", handleDisconnected);

// //     const interval = setInterval(() => {
// //       const gamepad = navigator.getGamepads()[0];

// //       if (!gamepad) return;

// //       console.log(
// //         "Buttons:",
// //         gamepad.buttons.map((b) => b.pressed),
// //       );

// //       window.electron.sendJoystick({
// //         axes: {
// //           roll: gamepad.axes[0],
// //           pitch: gamepad.axes[1],
// //           yaw: gamepad.axes[2],
// //           throttle: gamepad.axes[3],
// //         },
// //         buttons: gamepad.buttons.map((b) => b.pressed),
// //       });
// //     }, 50); // 20 time per second

// //     return () => {
// //       window.removeEventListener("gamepadconnected", handleConnected);
// //       window.removeEventListener("gamepaddisconnected", handleDisconnected);
// //       clearInterval(interval);
// //       // Ensure backend loop terminates if the user leaves this page view
// //       window.electron?.disableJoystick();
// //     };
// //   }, []);
// // }

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ///////////////////////////////////////////////////////////////////////////////

// ///////////////////////////////////////////////////////////////////////////////

// ///////////////////////////////////////////////////////////////////////////////

// // import { useEffect } from "react";

// // export function useJoystick() {
// //   useEffect(() => {
// //     const handleConnected = (e) => {
// //       console.log(`Joystick plugged in: ${e.gamepad.id}`);
// //       window.electron?.enableJoystick();
// //     };

// //     const handleDisconnected = () => {
// //       console.log("Joystick pulled out.");
// //       window.electron?.disableJoystick();
// //     };

// //     window.addEventListener("gamepadconnected", handleConnected);
// //     window.addEventListener("gamepaddisconnected", handleDisconnected);

// //     const interval = setInterval(() => {
// //       const gamepad = navigator.getGamepads()[0];
// //       if (!gamepad) return;

// //       // Extract raw arrays unmodified
// //       const rawAxes = Array.from(gamepad.axes);
// //       let rawButtons = gamepad.buttons.map((b) => (b.pressed ? 1 : 0));

// //       // Send the clean, raw state down to Electron
// //       window.electron.sendJoystick({
// //         axes: rawAxes,
// //         buttons: rawButtons,
// //       });
// //     }, 20); // 50Hz Loop

// //     return () => {
// //       window.removeEventListener("gamepadconnected", handleConnected);
// //       window.removeEventListener("gamepaddisconnected", handleDisconnected);
// //       clearInterval(interval);
// //       window.electron?.disableJoystick();
// //     };
// //   }, []);
// // }

// import { useEffect, useRef } from "react";

// export function useJoystick() {
//   // Store the active hardware array slot index dynamically
//   const activeGamepadIndexRef = useRef(null);

//   useEffect(() => {
//     const handleConnected = (e) => {
//       // console.log(
//       //   `Joystick plugged in: ${e.gamepad.id} at slot [${e.gamepad.index}]`,
//       // );
//       activeGamepadIndexRef.current = e.gamepad.index; // Save the exact new index
//       window.electron?.enableJoystick();
//     };

//     const handleDisconnected = (e) => {
//       if (activeGamepadIndexRef.current === e.gamepad.index) {
//         // console.log(`Joystick pulled out from slot [${e.gamepad.index}].`);
//         activeGamepadIndexRef.current = null; // Clear out index
//         window.electron?.disableJoystick();
//       }
//     };

//     window.addEventListener("gamepadconnected", handleConnected);
//     window.addEventListener("gamepaddisconnected", handleDisconnected);

//     // Scan for any controller already plugged in before mounting listeners
//     const initialGamepads = navigator.getGamepads();
//     for (let i = 0; i < initialGamepads.length; i++) {
//       if (initialGamepads[i]) {
//         activeGamepadIndexRef.current = i;
//         window.electron?.enableJoystick();
//         break;
//       }
//     }

//     const interval = setInterval(() => {
//       if (activeGamepadIndexRef.current === null) return;

//       // Always read the array using the active slot index reference
//       const gamepad = navigator.getGamepads()[activeGamepadIndexRef.current];
//       if (!gamepad) return; // Safely handle structural dropouts

//       const rawAxes = Array.from(gamepad.axes || []);
//       const rawButtons = (gamepad.buttons || []).map((b) =>
//         b.pressed ? 1 : 0,
//       );

//       window.electron.sendJoystick({
//         axes: rawAxes,
//         buttons: rawButtons,
//       });
//     }, 15); // 50Hz Loop

//     return () => {
//       window.removeEventListener("gamepadconnected", handleConnected);
//       window.removeEventListener("gamepaddisconnected", handleDisconnected);
//       clearInterval(interval);
//       window.electron?.disableJoystick();
//     };
//   }, []);
// }

import { useEffect, useRef } from "react";

export function useJoystick() {
  const activeGamepadIndexRef = useRef(null);

  useEffect(() => {
    const handleConnected = (e) => {
      activeGamepadIndexRef.current = e.gamepad.index;

      console.log(`Joystick connected: ${e.gamepad.id} [${e.gamepad.index}]`);

      // ❌ DO NOT ENABLE HERE
    };

    const handleDisconnected = (e) => {
      if (activeGamepadIndexRef.current === e.gamepad.index) {
        activeGamepadIndexRef.current = null;

        console.log("Joystick disconnected.");

        // ❌ DO NOT disable here either if you want
        // the UI state controlled only by the Enable button.
      }
    };

    window.addEventListener("gamepadconnected", handleConnected);
    window.addEventListener("gamepaddisconnected", handleDisconnected);

    // Find controller already connected
    const initialGamepads = navigator.getGamepads();

    for (let i = 0; i < initialGamepads.length; i++) {
      if (initialGamepads[i]) {
        activeGamepadIndexRef.current = i;

        console.log(`Existing joystick found at slot [${i}]`);

        // ❌ DO NOT ENABLE HERE

        break;
      }
    }

    const interval = setInterval(() => {
      if (activeGamepadIndexRef.current === null) return;

      const gamepad = navigator.getGamepads()[activeGamepadIndexRef.current];

      if (!gamepad) return;

      const rawAxes = Array.from(gamepad.axes || []);

      const rawButtons = (gamepad.buttons || []).map((b) =>
        b.pressed ? 1 : 0,
      );

      // Continue sending controller data.
      // Backend decides whether joystick control is enabled.
      window.electron?.sendJoystick({
        axes: rawAxes,
        buttons: rawButtons,
      });
    }, 15);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnected);
      window.removeEventListener("gamepaddisconnected", handleDisconnected);

      clearInterval(interval);

      // REMOVE THIS TOO
      // window.electron?.disableJoystick();
    };
  }, []);
}
