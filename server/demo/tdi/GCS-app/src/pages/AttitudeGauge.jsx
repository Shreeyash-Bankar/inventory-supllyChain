import { useEffect, useRef } from "react";
import "canvas-gauges/gauge.min.js";

export default function AttitudeGauge({ roll = 0, pitch = 0 }) {
  const canvasRef = useRef(null);
  const gaugeRef = useRef(null);

  // INIT ONCE
  useEffect(() => {
    if (!canvasRef.current || !window.LinearGauge) return;

    gaugeRef.current = new window.LinearGauge({
      renderTo: canvasRef.current,
      width: 300,
      height: 300,

      title: "ATTITUDE",

      // pitch scale
      minValue: -90,
      maxValue: 90,

      value: 0,

      // looks like aircraft instrument
      colorPlate: "#000",
      colorNumbers: "#fff",
      colorNeedle: "#fff",

      borders: false,
      needleType: "line",

      ticksAngle: 240,
      startAngle: 30,
    }).draw();
  }, []);

  // UPDATE LIVE DATA
  useEffect(() => {
    if (!gaugeRef.current) return;

    const toDeg = (r) => (r * 180) / Math.PI;

    gaugeRef.current.value = toDeg(pitch);

    // roll is applied as rotation of the whole gauge
    gaugeRef.current.update({
      animation: false,
      angle: toDeg(roll),
    });
  }, [roll, pitch]);

  return <canvas ref={canvasRef} />;
}
