import React, { useState } from "react";
import FloatingPanel from "./FloatingPanel";
import { useTelemetryStore } from "@/store/telemetryStore";

const VIBRATION_AXES = [
  {
    label: "X Axis",
    shortLabel: "X",
    key: "vibrationX",
  },
  {
    label: "Y Axis",
    shortLabel: "Y",
    key: "vibrationY",
  },
  {
    label: "Z Axis",
    shortLabel: "Z",
    key: "vibrationZ",
  },
];

function getVibrationStatus(value) {
  if (value >= 60) {
    return {
      label: "CRITICAL",
      color: "bg-red-500",
      text: "text-red-400",
    };
  }

  if (value >= 30) {
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

function VibrationBar({ label, shortLabel, value }) {
  const numericValue = Number(value) || 0;

  const MAX = 90;

  const percentage = Math.min(100, Math.max(0, (numericValue / MAX) * 100));

  const status = getVibrationStatus(numericValue);

  return (
    <div className="flex min-w-35 flex-1 flex-col items-center">
      {/* Axis */}
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-white">
        {shortLabel}
      </div>

      <p className="text-xs font-semibold text-zinc-300">{label}</p>

      {/* Status */}
      <div className="mt-2 mb-3 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${status.color}`} />

        <span className={`text-[10px] font-bold ${status.text}`}>
          {status.label}
        </span>
      </div>

      {/* Barrel + Scale */}
      <div className="relative h-44 w-24">
        {/* Barrel */}
        <div className="absolute bottom-0 left-1/2 h-44 w-14 -translate-x-1/2 overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-800 shadow-inner">
          {/* Filled barrel */}
          <div
            className={`absolute bottom-0 left-0 w-full rounded-full transition-all duration-300 ${status.color}`}
            style={{
              height: `${percentage}%`,
            }}
          />

          {/* Warning threshold - 30 */}
          <div
            className="absolute left-0 z-10 h-0.5 w-full bg-amber-300"
            style={{
              bottom: `${(30 / MAX) * 100}%`,
            }}
          />

          {/* Critical threshold - 60 */}
          <div
            className="absolute left-0 z-10 h-0.5 w-full bg-red-500"
            style={{
              bottom: `${(60 / MAX) * 100}%`,
            }}
          />

          {/* Highlight */}
          <div className="absolute left-2 top-2 h-[calc(100%-16px)] w-1 rounded-full bg-white/10" />
        </div>

        {/* ================= SCALE MARKINGS ================= */}

        {/* 90 - TOP */}
        <div className="absolute -right-3 top-1 flex items-center">
          <span className="mr-1 text-[9px] font-medium text-zinc-300">90</span>

          {/* <div className="h-px w-3 bg-zinc-600" /> */}
        </div>

        {/* 60 - RED MARKING */}
        <div
          className="absolute -right-3 top-14 flex -translate-y-1/2 items-center"
          style={{
            bottom: `${(60 / MAX) * 100}%`,
          }}
        >
          <span className="mr-1 text-[9px] font-bold text-red-400">60</span>

          {/* <div className="h-px w-3 bg-red-500" /> */}
        </div>

        {/* 30 - YELLOW MARKING */}
        <div
          className="absolute -right-3 top-29 flex -translate-y-1/2 items-center"
          style={{
            bottom: `${(30 / MAX) * 100}%`,
          }}
        >
          <span className="mr-1 text-[9px] font-bold text-amber-400">30</span>

          {/* <div className="h-px w-3 bg-amber-300" /> */}
        </div>

        {/* 0 - BOTTOM */}
        <div className="absolute bottom-0 -right-3 flex translate-y-1/2 items-center">
          <span className="mr-1 text-[9px] font-medium text-zinc-300">0</span>

          {/* <div className="h-px w-3 bg-zinc-600" /> */}
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 text-center">
        <span className="font-mono text-xl font-bold text-white">
          {numericValue.toFixed(2)}
        </span>

        <span className="ml-1 text-[10px] text-zinc-500">m/s²</span>
      </div>
    </div>
  );
}

function ClippingRow({ label, value }) {
  const count = Number(value) || 0;
  const hasClipping = count > 0;

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
        hasClipping
          ? "border-red-500/30 bg-red-500/6"
          : "border-zinc-800 bg-zinc-900/60"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            hasClipping ? "bg-red-500" : "bg-emerald-500"
          }`}
        />

        <span className="text-xs text-zinc-300">{label}</span>
      </div>

      <span
        className={`font-mono text-sm font-bold ${
          hasClipping ? "text-red-400" : "text-white"
        }`}
      >
        {count}
      </span>
    </div>
  );
}

export default function Vibration({ onClose }) {
  // const [minimized, setMinimized] = useState(false);
  // const [closed, setClosed] = useState(false);

  const vibrationData = useTelemetryStore(
    (state) => state.messages["Vibration"]?.data,
  );

  // if (closed) {
  //   return null;
  // }

  return (
    <FloatingPanel
      title="Vibration"
      subtitle="Accelerometer vibration levels"
      width="650px"
      onClose={onClose}
      right={
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/6 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Live
          </span>
        </div>
      }
    >
      <div className="p-5">
        {/* BARRELS */}

        <div className="flex gap-6">
          {VIBRATION_AXES.map((axis) => (
            <VibrationBar
              key={axis.key}
              label={axis.label}
              shortLabel={axis.shortLabel}
              value={vibrationData?.[axis.key]}
            />
          ))}
        </div>

        {/* CLIPPING */}

        <div className="mt-5 border-t border-zinc-800 pt-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-white">Clipping</h3>

            <p className="text-xs text-zinc-500">Sensor clipping events</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ClippingRow label="Primary" value={vibrationData?.clipping0} />

            <ClippingRow label="Secondary" value={vibrationData?.clipping1} />

            <ClippingRow label="Tertiary" value={vibrationData?.clipping2} />
          </div>
        </div>
      </div>
    </FloatingPanel>
  );
}
