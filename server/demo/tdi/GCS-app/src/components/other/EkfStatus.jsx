import React, { useState } from "react";
import { useTelemetryStore } from "@/store/telemetryStore";
import FloatingPanel from "./FloatingPanel";

const EKF_BARS = [
  { label: "Velocity", key: "velocityVariance" },
  { label: "Position Horizontal", key: "posHorizVariance" },
  { label: "Position Vertical", key: "posVertVariance" },
  { label: "Compass", key: "compassVariance" },
  { label: "Terrain", key: "terrainAltVariance" },
];

const EKF_FLAGS = [
  { label: "Attitude", bit: 1 },
  { label: "Horizontal Velocity", bit: 2 },
  { label: "Vertical Velocity", bit: 4 },
  { label: "Horizontal Position Relative", bit: 8 },
  { label: "Horizontal Position Absolute", bit: 16 },
  { label: "Vertical Position Absolute", bit: 32 },
  { label: "Vertical Position AGL", bit: 64 },
  { label: "Constant Position Mode", bit: 128 },
  { label: "Predicted Horizontal Position Relative", bit: 256 },
  { label: "Predicted Horizontal Position Absolute", bit: 512 },
  { label: "Uninitialized", bit: 1024 },
  { label: "GPS Glitching", bit: 32768 },
];

function getEkfStatus(value) {
  if (value >= 0.8) {
    return {
      label: "CRITICAL",
      color: "bg-red-500",
      text: "text-red-400",
    };
  }

  if (value >= 0.5) {
    return {
      label: "WARNING",
      color: "bg-amber-400",
      text: "text-amber-400",
    };
  }

  return {
    label: "NORMAL",
    color: "bg-emerald-400",
    text: "text-emerald-400",
  };
}

function EkfBar({ label, value }) {
  const numericValue = Number(value) || 0;

  // Clamp value to 0 - 1
  const normalizedValue = Math.min(1, Math.max(0, numericValue));

  // Convert 0-1 value to percentage
  const percentage = normalizedValue * 100;

  const status = getEkfStatus(normalizedValue);

  return (
    <div className="flex min-w-[90px] flex-1 flex-col items-center">
      {/* Label */}
      <p className="mb-2 text-center text-xs font-semibold text-zinc-300">
        {label}
      </p>

      {/* Status */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${status.color}`} />

        <span className={`text-[10px] font-bold tracking-wide ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Barrel + scale */}
      <div className="relative flex">
        {/* Scale */}
        <div className="relative mr-2 h-40 w-7 text-[10px] font-medium text-zinc-300">
          {/* 1.0 */}
          <span className="absolute right-0 top-0 -translate-y-1/2">1.0</span>

          {/* 0.8 */}
          <span className="absolute right-0 top-[20%] -translate-y-1/2">
            0.8
          </span>

          {/* 0.5 */}
          <span className="absolute right-0 top-[50%] -translate-y-1/2">
            0.5
          </span>

          {/* 0.0 */}
          <span className="absolute right-0 bottom-0 translate-y-1/2">0.0</span>
        </div>

        {/* Barrel */}
        <div className="relative h-40 w-12 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-800 shadow-inner">
          {/* Filled value */}
          <div
            className={`absolute bottom-0 left-0 w-full transition-all duration-300 ${status.color}`}
            style={{
              height: `${percentage}%`,
            }}
          />

          {/* 0.5 GREEN threshold */}
          <div
            className="absolute left-0 z-20 h-[2px] w-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            style={{
              bottom: "50%",
            }}
          />

          {/* 0.8 RED threshold */}
          <div
            className="absolute left-0 z-20 h-[2px] w-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
            style={{
              bottom: "80%",
            }}
          />

          {/* Barrel highlight */}
          <div className="pointer-events-none absolute left-2 top-2 h-[calc(100%-16px)] w-1 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Current value */}
      <div className="mt-3 text-center">
        <span className="font-mono text-xl font-bold text-white">
          {normalizedValue.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

function FlagRow({ label, enabled }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
        enabled
          ? "border-emerald-500/20 bg-emerald-500/6"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            enabled ? "bg-emerald-400" : "bg-zinc-600"
          }`}
        />

        <span
          className={`text-xs ${enabled ? "text-zinc-200" : "text-zinc-300"}`}
        >
          {label}
        </span>
      </div>

      <span
        className={`text-[10px] font-bold ${
          enabled ? "text-emerald-400" : "text-zinc-600"
        }`}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    </div>
  );
}

export default function EkfStatus({ onClose }) {
  const [minimized, setMinimized] = useState(false);
  // const [closed, setClosed] = useState(false);

  const ekfData = useTelemetryStore(
    (state) => state.messages["EkfStatusReport"]?.data,
  );

  const flags = Number(ekfData?.flags) || 0;

  const enabledFlags = EKF_FLAGS.filter(
    (flag) => (flags & flag.bit) !== 0,
  ).length;

  // if (closed) {
  //   return null;
  // }

  return (
    <FloatingPanel
      title="EKF Status"
      subtitle="Estimator health and sensor fusion"
      width="720px"
      onClose={onClose}
      right={
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-xs font-semibold text-zinc-300">
            {enabledFlags}/{EKF_FLAGS.length}
          </span>
        </div>
      }
    >
      {/* ================= HEADER ================= */}

      {!minimized && (
        <div className="overflow-y-auto p-5">
          {/* ================= BARRELS ================= */}

          <div className="flex gap-4 overflow-x-auto pb-5">
            {EKF_BARS.map((metric) => (
              <EkfBar
                key={metric.key}
                label={metric.label}
                value={ekfData?.[metric.key]}
              />
            ))}
          </div>

          {/* ================= FLAGS ================= */}

          <div className="border-t border-zinc-800 pt-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-white">Estimator Flags</h3>

              <p className="text-xs text-zinc-500">Current EKF state</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EKF_FLAGS.map((flag) => (
                <FlagRow
                  key={flag.bit}
                  label={flag.label}
                  enabled={(flags & flag.bit) !== 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </FloatingPanel>
  );
}
