import { useMemo } from "react";

import {
  calculateRadiation,
  type RadiationPatternType,
  type RadiationParameters,
} from "../../physics/radiationPatterns";

interface PolarPatternProps {
  pattern: RadiationPatternType;
  radiationParameters?: RadiationParameters;
}

const SIZE = 420;
const CENTER = SIZE / 2;
const MAX_RADIUS = 150;
const MIN_DB = -30;

export default function PolarPattern({
  pattern,
  radiationParameters,
}: PolarPatternProps) {
  const { path, peakAngle } = useMemo(() => {
    const samples = 360;

    const values: {
      angle: number;
      power: number;
    }[] = [];

    let maximumPower = 0;

    // Sample the complete 360-degree vertical plane.
    for (let i = 0; i <= samples; i++) {
      const angle = (2 * Math.PI * i) / samples;

      const theta = Math.acos(Math.max(-1, Math.min(1, Math.cos(angle))));

      const phi = angle <= Math.PI ? 0 : Math.PI;

      const power = Math.max(
        0,
        calculateRadiation(pattern, theta, phi, radiationParameters),
      );

      values.push({ angle, power });
      maximumPower = Math.max(maximumPower, power);
    }

    let strongestPower = 0;

    for (const value of values) {
      strongestPower = Math.max(strongestPower, value.power);
    }

    const strongestAngles = values
      .filter(
        (value) =>
          strongestPower > 0 && Math.abs(value.power - strongestPower) < 1e-8,
      )
      .map((value) => Math.round((value.angle * 180) / Math.PI))
      .filter((angle) => angle < 360);

    const coordinates = values.map(({ angle, power }) => {
      const normalizedPower = maximumPower > 0 ? power / maximumPower : 0;

      const db =
        normalizedPower > 0 ? 10 * Math.log10(normalizedPower) : MIN_DB;

      const clippedDb = Math.max(MIN_DB, Math.min(0, db));

      const radius = ((clippedDb - MIN_DB) / Math.abs(MIN_DB)) * MAX_RADIUS;

      const x = CENTER + radius * Math.sin(angle);
      const y = CENTER - radius * Math.cos(angle);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return {
      path: `M ${coordinates.join(" L ")} Z`,
      peakAngle:
        strongestAngles.length > 0 ? `${strongestAngles.join("° / ")}°` : "N/A",
    };
  }, [pattern, radiationParameters]);

  const angleLabels = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className="polar-pattern-wrapper">
      <div className="polar-pattern-heading">
        <div>
          <span className="polar-eyebrow">RADIATION DISTRIBUTION</span>
          <h3>{pattern.toUpperCase()} POLAR PLOT</h3>
        </div>

        <div className="polar-peak">
          <span>PEAK DIRECTION</span>
          <strong>{peakAngle}</strong>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="polar-pattern-svg"
        role="img"
        aria-label={`Polar radiation pattern for ${pattern} antenna`}
      >
        <defs>
          <linearGradient id="polarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#32b9ff" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#1674ce" stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((level) => {
          const radius = MAX_RADIUS * (1 - level / 3);

          return (
            <g key={level}>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={radius}
                fill="none"
                stroke="#34465b"
                strokeWidth="1"
                strokeDasharray={level === 0 ? "0" : "3 5"}
              />

              {level > 0 && (
                <text
                  x={CENTER + 7}
                  y={CENTER - radius + 12}
                  fill="#8295aa"
                  fontSize="10"
                >
                  {level * -10} dB
                </text>
              )}
            </g>
          );
        })}

        {angleLabels.map((angle) => {
          const radians = (angle * Math.PI) / 180;

          const x = CENTER + MAX_RADIUS * Math.sin(radians);
          const y = CENTER - MAX_RADIUS * Math.cos(radians);

          const labelRadius = MAX_RADIUS + 24;

          const labelX = CENTER + labelRadius * Math.sin(radians);

          const labelY = CENTER - labelRadius * Math.cos(radians);

          return (
            <g key={angle}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke="#34465b"
                strokeWidth="1"
                strokeDasharray="3 5"
              />

              <text
                x={labelX}
                y={labelY}
                fill="#a0b2c6"
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {angle}°
              </text>
            </g>
          );
        })}

        <path
          d={path}
          fill="url(#polarFill)"
          stroke="#32b9ff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <circle cx={CENTER} cy={CENTER} r="3" fill="#e4f6ff" />
      </svg>

      <div className="polar-pattern-legend">
        <span>
          <i className="polar-legend-line" />
          Relative radiation power
        </span>
        <span>0 dB = Maximum radiation</span>
      </div>

      <p className="polar-pattern-note">
        Normalized 360° vertical-plane pattern · 0 dB maximum · Power levels
        clipped at −30 dB
      </p>
    </div>
  );
}
