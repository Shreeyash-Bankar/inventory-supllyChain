import React, { useMemo } from "react";

export default function AttitudeIndicator({
  roll = 0,
  pitch = 0,
  heading = 0,
  size = 220,
}) {
  const clampedPitch = Math.max(-60, Math.min(60, pitch));

  const scale = size / 200;
  const ringWidth = 30 * scale;
  const innerSize = size - ringWidth * 2;

  // smooth pitch mapping
  const pitchOffset = (clampedPitch / 60) * (innerSize * 0.4);

  const directions = ["N", "E", "S", "W"];

  // COMPASS TICKS + DEGREE LABELS (FIXED)
  const compassTicks = useMemo(() => {
    const ticks = [];

    for (let i = 0; i < 360; i += 10) {
      const isMajor = i % 30 === 0;
      const isCardinal = i % 90 === 0;

      const tickLength = (isCardinal ? 12 : isMajor ? 8 : 4) * scale;

      const angle = i - heading;

      ticks.push(
        <g key={i} transform={`rotate(${angle} ${size / 2} ${size / 2})`}>
          <line
            x1={size / 2}
            y1={14 * scale}
            x2={size / 2}
            y2={14 * scale + tickLength}
            stroke={isCardinal ? "#fff" : isMajor ? "#cbd5e1" : "#475569"}
            strokeWidth={isCardinal ? 2 : 1}
          />

          {/* CARDINAL LABELS */}
          {isCardinal && (
            <text
              x={size / 2}
              y={10 * scale}
              textAnchor="middle"
              fill="#fff"
              fontSize={11 * scale}
              fontWeight="600"
            >
              {directions[i / 90]}
            </text>
          )}

          {/* DEGREE LABELS (FIXED MISSING FEATURE) */}
          {isMajor && !isCardinal && (
            <text
              x={size / 2}
              y={10 * scale}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={8 * scale}
            >
              {i}
            </text>
          )}
        </g>,
      );
    }

    return ticks;
  }, [heading, size, scale]);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        borderRadius: "50%",
        overflow: "hidden", // IMPORTANT FIX (removes white gaps)
        background: "#000",
      }}
    >
      {/* COMPASS RING */}
      <svg width={size} height={size} style={{ position: "absolute" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 2}
          fill="none"
          stroke="#334155"
        />
        {compassTicks}
      </svg>

      {/* ATTITUDE CORE */}
      <div
        style={{
          position: "absolute",
          top: ringWidth,
          left: ringWidth,
          width: innerSize,
          height: innerSize,
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid #334155",
        }}
      >
        {/* SKY + GROUND LAYER */}
        <div
          style={{
            transform: `translateY(${pitchOffset}px) rotate(${-roll}deg)`,
            height: "200%",
            width: "200%", // IMPORTANT FIX: prevents white edges during rotation
            position: "absolute",
            top: "-50%",
            left: "-50%",
          }}
        >
          {/* SKY */}
          <div
            style={{
              position: "absolute",
              top: 0,
              width: "100%",
              height: "50%",
              background: "linear-gradient(#1d4ed8, #2563eb)",
            }}
          />

          {/* GROUND */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "50%",
              background: "linear-gradient(#a16207, #78350f)",
            }}
          />

          {/* PITCH LADDER */}
          {[-45, -30, -20, -10, 10, 20, 30, 45].map((deg) => {
            const y = (deg * innerSize * 0.4) / 60 + pitchOffset;

            return (
              <g key={deg}>
                {/* line */}
                <div
                  style={{
                    position: "absolute",
                    top: `calc(50% + ${y}px)`,
                    left: "20%",
                    width: "60%",
                    height: 1,
                    background: "rgba(255,255,255,0.6)",
                  }}
                />

                {/* left label */}
                <div
                  style={{
                    position: "absolute",
                    top: `calc(50% + ${y}px - 6px)`,
                    left: "10%",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {deg}
                </div>

                {/* right label */}
                <div
                  style={{
                    position: "absolute",
                    top: `calc(50% + ${y}px - 6px)`,
                    right: "10%",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {deg}
                </div>
              </g>
            );
          })}

          {/* HORIZON LINE */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              width: "100%",
              height: 2,
              background: "white",
              boxShadow: "0 0 4px rgba(255,255,255,0.6)",
            }}
          />
        </div>

        {/* AIRCRAFT SYMBOL */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 70,
            height: 24,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* wings */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 2,
              background: "yellow",
            }}
          />
          {/* center dot */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "yellow",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
