import { useEffect } from "react";

export function useGamepadDebug() {
  useEffect(() => {
    const timer = setInterval(() => {
      const gp = navigator.getGamepads()[0];

      if (!gp) return;

      // console.log("complete GB object: ", gp);
      // console.log("Controller:", gp.id);

      // console.log("Axes:", gp.axes);

      // console.log(
      //   "Buttons:",
      //   gp.buttons.map((b, i) => ({
      //     index: i,
      //     pressed: b.pressed,
      //     value: b.value,
      //   })),
      // );
    }, 200);

    return () => clearInterval(timer);
  }, []);
}
