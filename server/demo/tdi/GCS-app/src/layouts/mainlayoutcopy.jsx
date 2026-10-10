import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useTelemetryStore } from "@/store/telemetryStore";

import {
  LayoutDashboard,
  Activity,
  Gamepad2,
  SlidersHorizontal,
  CircuitBoard,
  DraftingCompass,
  Drone,
  Shield,
  ShieldAlert,
  Save,
  RotateCcw,
} from "lucide-react";

// ArduPilot custom mode integers matching your backend CommandService.setMode(modeId) rules
const FLIGHT_MODES = [
  { value: 1, label: "Stabilize" },
  { value: 2, label: "Altitude Hold" },
  { value: 5, label: "Loiter" },
  { value: 4, label: "Guided" },
  { value: 3, label: "Auto" },
  { value: 0, label: "Return To Launch (RTL)" },
  { value: 9, label: "Land" },
];

export default function MainLayout() {
  const [guidedDialogOpen, setGuidedDialogOpen] = useState(false);
  const [guidedAltitude, setGuidedAltitude] = useState(10);

  const navigate = useNavigate();
  const location = useLocation();

  // Connect cleanly to your unified messages object store layout
  const connectionState = useTelemetryStore((s) => s.connectionState);
  const heartbeatMessage = useTelemetryStore(
    (s) => s.messages["Heartbeat"]?.data,
  );
  const globalPosInt = useTelemetryStore(
    (s) => s.messages["GlobalPositionInt"]?.data,
  );

  const isConnected = connectionState === "CONNECTED";

  const latitude =
    globalPosInt?.lat !== undefined ? globalPosInt.lat / 1e7 : null;

  const longitude =
    globalPosInt?.lon !== undefined ? globalPosInt.lon / 1e7 : null;

  // MAVLink Bitmask extraction: ArduPilot uses base_mode bit 128 (0x80) for armed status
  const baseMode =
    heartbeatMessage?.baseMode ?? heartbeatMessage?.base_mode ?? 0;
  const isArmed = (baseMode & 128) !== 0;

  // Extract the live active mode running inside the drone autopilot registers
  const currentVehicleMode =
    heartbeatMessage?.customMode ?? heartbeatMessage?.custom_mode ?? 1;

  // Staged state for mode change selection BEFORE pushing down the telemetry line
  const [selectedMode, setSelectedMode] = useState(Number(currentVehicleMode));

  // Sync selection state if mode shifts internally due to failsafes or switch toggles
  useEffect(() => {
    setSelectedMode(Number(currentVehicleMode));
  }, [currentVehicleMode]);

  const tabs = [
    { path: "/telemetry?tab=dashboard", icon: LayoutDashboard },
    { path: "/telemetry?tab=telemetry", icon: Activity },
    { path: "/hardwareCheck", icon: CircuitBoard },
    { path: "/flightLayout", icon: Drone },
    { path: "/loadParameters", icon: SlidersHorizontal },
    { path: "/calibration", icon: DraftingCompass },
    { path: "/joystick", icon: Gamepad2 },
  ];

  // Leverages your matching preload signature: window.electron.flightCommand(cmd, payload)
  const handleArmToggle = () => {
    if (!isConnected) return;
    const actionKey = isArmed ? "DISARM" : "ARM";
    window.electron?.flightCommand(actionKey);
  };

  const handleRebootFC = () => {
    if (!isConnected) return;

    const confirmed = window.confirm(
      "Reboot the Flight Controller?\n\nThe vehicle will disconnect temporarily and reconnect after the reboot.",
    );

    if (!confirmed) return;

    window.electron?.restartFc();
  };

  //  Executes your explicit CommandService.setMode(modeId) routine via your save block
  const handleSaveMode = () => {
    if (!isConnected) return;
    const targetModeId = Number(selectedMode);
    // console.log(
    //   `[MAIN-LAYOUT] Requesting mode write hook to hardware ID: ${targetModeId}`,
    // );

    window.electron?.flightCommand("SET_MODE", targetModeId);
  };

  const handleGuidedSave = () => {
    if (latitude == null || longitude == null) {
      alert("GPS position unavailable.");
      return;
    }

    window.electron?.flightCommand("GUIDED", {
      lat: latitude,
      lon: longitude,
      alt: guidedAltitude,
    });

    setSelectedMode(4);
    setGuidedDialogOpen(false);
  };

  // Handles dropdown changes and intercepts Guided Mode (Value 4)
  const handleDropdownChange = (e) => {
    const nextMode = Number(e.target.value);
    setSelectedMode(nextMode);

    if (nextMode === 4) {
      if (latitude == null || longitude == null) {
        alert(
          "Cannot switch to Guided Mode: Live telemetry GPS coordinates are currently unavailable.",
        );
        setSelectedMode(Number(currentVehicleMode));
        return;
      }
      setGuidedDialogOpen(true);
    }
  };

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* GLOBAL SIDEBAR */}
      <div className="w-20 bg-sidebar-primary flex flex-col items-center py-4 gap-4">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = location.pathname + location.search === tab.path;

          return (
            <button
              key={i}
              onClick={() => navigate(tab.path)}
              className={`text-white w-12 h-12 rounded-xl flex items-center justify-center transition
        ${isActive ? "bg-chart-4 text-white shadow-md" : "hover:bg-chart-4"}`}
            >
              <Icon size={27} />
            </button>
          );
        })}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col overflow-hidden bg-sidebar-primary text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950">
          <h1 className="text-lg font-semibold tracking-wide text-zinc-200">
            MAVLink GCS
          </h1>

          <div className="flex gap-3 items-center">
            {/* MODE CHANGE SELECTOR DROPDOWN */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                Mode:
              </span>
              <select
                disabled={!isConnected}
                value={selectedMode}
                onChange={handleDropdownChange}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {FLIGHT_MODES.map((mode) => (
                  <option
                    key={mode.value}
                    value={mode.value}
                    className="bg-zinc-950 text-white"
                  >
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>

            {/*  SAVE MODE TRIGGER ACTION BUTTON */}
            <Button
              variant="outline"
              size="sm"
              disabled={
                !isConnected ||
                Number(selectedMode) === Number(currentVehicleMode)
              }
              onClick={handleSaveMode}
              className="flex items-center gap-1.5 border-zinc-700 hover:bg-zinc-500 text-zinc-300 disabled:opacity-40"
            >
              <Save size={15} />
              <span>Save Mode</span>
            </Button>

            {/*  FLIGHT CONTROLLER ARMING TOGGLE */}
            <Button
              size="sm"
              disabled={!isConnected}
              variant={isArmed ? "destructive" : "default"}
              onClick={handleArmToggle}
              className={`flex items-center gap-1.5 font-bold transition duration-200 min-w-[110px] ${
                !isArmed && isConnected
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  : ""
              }`}
            >
              {isArmed ? (
                <>
                  <ShieldAlert size={16} className="animate-pulse" />
                  <span>DISARM FC</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>ARM DRONE</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={!isConnected}
              onClick={handleRebootFC}
              className="flex items-center gap-1.5 border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-white"
            >
              <RotateCcw size={16} />
              <span>Reboot FC</span>
            </Button>

            {/* MONO STATUS BAR CHIP */}
            <Card className="px-3 py-1.5 text-xs font-mono font-bold tracking-wider bg-zinc-900 border-zinc-800 text-zinc-300">
              {connectionState}
            </Card>

            {/* SYSTEM DISCONNECT ACTION */}
            <Button
              variant={isConnected ? "destructive" : "secondary"}
              size="sm"
              onClick={() => {
                if (isConnected) {
                  window.electron.disconnectPort();
                }
              }}
            >
              {isConnected ? "Disconnect" : "Disconnected"}
            </Button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* GUIDED MODE DIALOG PORTAL */}
      {guidedDialogOpen && (
        <div className="fixed inset-0 z-1100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[400px] rounded-lg bg-zinc-900 border border-zinc-800 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Drone className="text-blue-500 animate-pulse" size={20} />
              Guided Mode Takeoff
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              The drone will change its flight mode to Guided and hold its
              current telemetry location coordinates.
            </p>

            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Target Altitude (Meters)
              </label>
              <input
                type="number"
                value={guidedAltitude}
                min={0}
                max={120}
                onChange={(e) => setGuidedAltitude(Number(e.target.value))}
                className="w-full rounded border border-zinc-700 bg-zinc-950 text-white font-mono px-3 py-2 outline-none focus:border-blue-500 transition"
                placeholder="e.g. 10"
              />
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-400 mb-6 space-y-1">
              <div className="flex justify-between">
                <span>Live Telemetry Lat:</span>
                <span className="text-zinc-200">
                  {latitude != null ? latitude.toFixed(7) : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Live Telemetry Lon:</span>
                <span className="text-zinc-200">
                  {longitude != null ? longitude.toFixed(7) : "--"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setGuidedDialogOpen(false);
                  setSelectedMode(Number(currentVehicleMode));
                }}
                className="px-4 py-2 text-sm font-semibold rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleGuidedSave}
                disabled={guidedAltitude <= 0}
                className="px-4 py-2 text-sm font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm & Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
