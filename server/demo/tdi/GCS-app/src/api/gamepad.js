import { useEffect, useState } from "react";

export function useGamepad() {
  const [gamepad, setGamepad] = useState(null);

  useEffect(() => {
    const update = () => {
      const pads = navigator.getGamepads();

      const active = Array.from(pads).find((pad) => pad && pad.connected);

      if (active) {
        setGamepad({
          id: active.id,
          index: active.index,
          axes: active.axes,
          buttons: active.buttons,
        });
      } else {
        setGamepad(null);
      }
    };

    window.addEventListener("gamepadconnected", update);
    window.addEventListener("gamepaddisconnected", update);

    const interval = setInterval(update, 500);

    return () => {
      window.removeEventListener("gamepadconnected", update);
      window.removeEventListener("gamepaddisconnected", update);
      clearInterval(interval);
    };
  }, []);

  return gamepad;
}
