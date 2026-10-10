import React, { useEffect, useState } from "react";

const AccellCalibration = () => {
  // Existing full accelerometer calibration state
  const [calState, setCalState] = useState({
    active: false,
    currentInstruction:
      "Click 'Start Calibration' to begin standard 6-axis routine.",
    currentPosition: null,
    progress: 0,
    success: false,
    waitingForUser: false,
  });

  // Separate UI state for level-only calibration
  const [levelCalibrating, setLevelCalibrating] = useState(false);
  const [levelCalMessage, setLevelCalMessage] = useState("");

  useEffect(() => {
    // Existing backend calibration status subscription
    const unsubscribe = window.electron.onAccelCalibrationStatus((data) => {
      setCalState(data);
    });

    return () => unsubscribe();
  }, []);

  // Existing full 6-position calibration
  const handleStart = async () => {
    await window.electron.startAccelCalibration();
  };

  // Existing Next Position logic
  const handleNext = async () => {
    await window.electron.confirmAccelPosition();
  };

  // New level-only calibration
  const handleLevelCalibration = async () => {
    try {
      setLevelCalibrating(true);
      setLevelCalMessage(
        "Make sure the vehicle is physically level, then wait...",
      );

      await window.electron.startAccelLevelCalibration();

      setLevelCalMessage("Level calibration command sent successfully.");
    } catch (error) {
      console.error("[LEVEL CALIBRATION ERROR]", error);

      setLevelCalMessage("Failed to start level calibration.");
    } finally {
      setLevelCalibrating(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center text-white select-none">
      {/* Existing informational header */}
      <div className="font-sans font-medium bg-gray-800 mt-16 rounded-xl py-3 px-6 max-w-[700px] leading-relaxed text-gray-200">
        Calibrates the 3-axis accelerometer using either the standard 6-position
        calibration routine or a level-only calibration using the vehicle's
        current orientation.
      </div>

      {/* Main Control Panel */}
      <div className="flex flex-col items-center bg-gray-800 border border-gray-700 rounded-xl mt-6 p-6 w-full max-w-[700px] shadow-lg">
        <h2 className="text-xl font-bold font-mono tracking-wide text-gray-100">
          Accelerometer Calibration
        </h2>

        {/* Existing live calibration instruction */}
        <div
          className={`w-full text-center py-4 px-4 my-6 rounded-lg text-lg font-mono border transition-all duration-300 ${
            calState.success
              ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
              : calState.waitingForUser
                ? "bg-amber-950/40 border-amber-500 text-amber-400 animate-pulse"
                : "bg-gray-900 border-gray-700 text-gray-300"
          }`}
        >
          {calState.currentInstruction || "Waiting for drone response..."}
        </div>

        {/* Existing progress bar */}
        <div className="w-full bg-gray-900 h-3 rounded-full mb-6 overflow-hidden border border-gray-700">
          <div
            className="bg-emerald-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${calState.progress}%` }}
          />
        </div>

        {/* Existing full calibration controls */}
        <div className="flex gap-4 w-full justify-end">
          {!calState.active || calState.success ? (
            <button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow"
            >
              {calState.success
                ? "Restart Routine"
                : "Start 6-Position Calibration"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!calState.waitingForUser}
              className={`font-semibold py-2.5 px-8 rounded-lg transition-all shadow ${
                calState.waitingForUser
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
              }`}
            >
              Next Position
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-8">
          <div className="flex-1 h-px bg-gray-700" />

          <span className="text-gray-500 text-sm font-mono">OR</span>

          <div className="flex-1 h-px bg-gray-700" />
        </div>

        {/* Level-only calibration section */}
        <div className="w-full bg-gray-900 border border-gray-700 rounded-lg p-5">
          <h3 className="text-lg font-bold font-mono text-gray-100 mb-2">
            Level Calibration
          </h3>

          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Place the vehicle on a physically level surface. This performs
            level/trim calibration only and does not start the 6-position
            accelerometer calibration.
          </p>

          {/* Level calibration status */}
          {levelCalMessage && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg border text-sm font-mono ${
                levelCalibrating
                  ? "bg-amber-950/40 border-amber-500 text-amber-400"
                  : levelCalMessage.includes("successfully")
                    ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                    : "bg-gray-800 border-gray-700 text-gray-300"
              }`}
            >
              {levelCalMessage}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleLevelCalibration}
              disabled={levelCalibrating || calState.active}
              className={`font-semibold py-2.5 px-6 rounded-lg transition-all shadow ${
                levelCalibrating || calState.active
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                  : "bg-purple-600 hover:bg-purple-500 text-white cursor-pointer"
              }`}
            >
              {levelCalibrating
                ? "Calibrating Level..."
                : "Calibrate Level Only"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccellCalibration;
