import React, { useEffect, useState } from "react";

const CompassCalibration = () => {
  const [calState, setCalState] = useState({
    active: false,
    stage: "IDLE",
    progress: {},
    compasses: {},
    started: false,
    completed: false,
    success: false,
    failed: false,
    offsetX: 0,
    offsetY: 0,
    offsetZ: 0,
  });

  useEffect(() => {
    const unsubscribe = window.electron.onCompassCalibrationStatus((state) => {
      setCalState(state);
    });

    return () => unsubscribe();
  }, []);

  const handleStart = () => {
    window.electron.startCompassCalibration();
  };

  const handleCancel = () => {
    window.electron.cancelCompassCalibration();
  };

  const getStageColor = () => {
    switch (calState.stage) {
      case "IDLE":
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";

      case "STARTING":
      case "WAITING_FOR_PROGRESS":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse";

      case "CALIBRATING":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";

      case "COMPLETE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      case "FAILED":
      case "START_REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "CANCELLED":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";

      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Compass Calibration
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Calibrate the vehicle's onboard magnetometers
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide ${getStageColor()}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {calState.stage}
        </span>
      </div>

      {/* Main Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/80 shadow-2xl shadow-black/20 backdrop-blur-sm">
        {/* IDLE / START SCREEN */}
        {!calState.active &&
          calState.stage !== "COMPLETE" &&
          calState.stage !== "FAILED" && (
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                {/* Compass Icon */}
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
                  <svg
                    className="h-10 w-10 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2z" />
                  </svg>
                </div>

                <h3 className="text-xl font-semibold text-white">
                  Ready to Calibrate
                </h3>

                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">
                  Ensure the drone is away from large metal objects, power
                  lines, and your phone before beginning.
                </p>

                <button
                  onClick={handleStart}
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-[0.98]"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Start Calibration
                </button>
              </div>
            </div>
          )}

        {/* ACTIVE CALIBRATION */}
        {calState.active && (
          <div className="p-6 sm:p-8">
            {/* Calibration Header */}
            <div className="mb-7 flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <svg
                  className="h-6 w-6 animate-pulse"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white">
                  Calibration in Progress
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-400">
                  Rotate the vehicle smoothly through all axes.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-7 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-orange-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>

                <p className="text-sm leading-6 text-orange-200/80">
                  <strong className="font-semibold text-orange-300">
                    Pick up the vehicle and rotate it smoothly in all axes
                  </strong>{" "}
                  (roll, pitch, and yaw) until all bars reach 100%. Avoid rapid
                  or jerky movements.
                </p>
              </div>
            </div>

            {/* Compass Progress */}
            <div className="space-y-5">
              {Object.keys(calState.compasses).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-10 text-center">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

                  <p className="text-sm font-medium text-slate-300">
                    Waiting for initial compass data stream...
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Listening for calibration progress
                  </p>
                </div>
              ) : (
                Object.entries(calState.compasses).map(([id, data]) => (
                  <div
                    key={id}
                    className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                          {parseInt(id) + 1}
                        </div>

                        <span className="text-sm font-semibold text-slate-200">
                          Compass #{parseInt(id) + 1}
                        </span>
                      </div>

                      <span
                        className={`text-sm font-semibold ${
                          data.completionPct >= 100
                            ? "text-emerald-400"
                            : "text-orange-400"
                        }`}
                      >
                        {data.completionPct}%
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          data.completionPct >= 100
                            ? "bg-emerald-500 shadow-lg shadow-emerald-500/20"
                            : "bg-orange-500 shadow-lg shadow-orange-500/20"
                        }`}
                        style={{
                          width: `${data.completionPct}%`,
                        }}
                      />
                    </div>

                    {/* Progress Footer */}
                    <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                      <span>Calibration progress</span>

                      <span>
                        {data.completionPct >= 100
                          ? "Complete"
                          : "Collecting data"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cancel */}
            <button
              onClick={handleCancel}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300 active:scale-[0.99]"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              Cancel Calibration
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {calState.stage === "COMPLETE" && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <svg
                  className="h-8 w-8 text-emerald-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12l4 4L19 6" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white">
                Calibration Successful
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Your compass calibration has completed successfully.
              </p>

              {/* Offset Card */}
              <div className="mt-7 w-full rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      Calculated Mag Offsets
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      Final calibration values
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                    Saved
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* X */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                    <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                      X Offset
                    </span>

                    <span className="mt-2 block text-xl font-bold tabular-nums text-white">
                      {calState.offsetX?.toFixed(2) || "0.00"}
                    </span>
                  </div>

                  {/* Y */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                    <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Y Offset
                    </span>

                    <span className="mt-2 block text-xl font-bold tabular-nums text-white">
                      {calState.offsetY?.toFixed(2) || "0.00"}
                    </span>
                  </div>

                  {/* Z */}
                  <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-4">
                    <span className="block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Z Offset
                    </span>

                    <span className="mt-2 block text-xl font-bold tabular-nums text-white">
                      {calState.offsetZ?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="mt-5 w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-3">
                <p className="text-sm text-slate-300">
                  The new compass offsets have been configured successfully.
                </p>
              </div>

              {/* Reboot Warning */}
              <div className="mt-3 flex w-full items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.3 4.5L2.8 17.5A2 2 0 004.5 20h15a2 2 0 001.7-2.5L13.7 4.5a2 2 0 00-3.4 0z" />
                </svg>

                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    Reboot required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-200/70">
                    You must reboot your flight controller to apply the new
                    compass calibration.
                  </p>
                </div>
              </div>

              {/* Again */}
              <button
                onClick={handleStart}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-slate-600 active:scale-[0.98]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12a8 8 0 0114.9-4M20 12a8 8 0 01-14.9 4" />
                  <path d="M19 4v4h-4M5 20v-4h4" />
                </svg>
                Calibrate Again
              </button>
            </div>
          </div>
        )}

        {/* FAILED */}
        {(calState.stage === "FAILED" ||
          calState.stage === "START_REJECTED") && (
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              {/* Failure Icon */}
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <svg
                  className="h-8 w-8 text-red-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-white">
                Calibration Failed
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                The command was rejected or timed out. Ensure the vehicle is
                safely disarmed and sitting still before restarting.
              </p>

              {/* Error Info */}
              <div className="mt-6 w-full rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
                <div className="flex items-start gap-3">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>

                  <div>
                    <p className="text-sm font-semibold text-red-300">
                      Calibration could not be completed
                    </p>

                    <p className="mt-1 text-xs leading-5 text-red-200/60">
                      Check the vehicle state and magnetic environment before
                      trying again.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-500 active:scale-[0.98]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 12a8 8 0 0114.9-4M20 12a8 8 0 01-14.9 4" />
                  <path d="M19 4v4h-4M5 20v-4h4" />
                </svg>
                Retry Calibration
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompassCalibration;
