import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { useTelemetryStore } from "@/store/telemetryStore";
import EkfStatus from "@/components/other/EkfStatus";
import Vibration from "@/components/other/Vibration";

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
  PlaneTakeoff,
} from "lucide-react";

// ArduPilot custom mode integers matching your backend CommandService.setMode(modeId) rules
const FLIGHT_MODES = [
  { value: 0, label: "Stabilize" },
  { value: 2, label: "Altitude Hold" },
  { value: 5, label: "Loiter" },
  { value: 4, label: "Guided" },
  { value: 3, label: "Auto" },
  { value: 6, label: "Return To Launch (RTL)" },
  { value: 9, label: "Land" },
];

export default function MainLayout() {
  const [guidedDialogOpen, setGuidedDialogOpen] = useState(false);
  const [guidedAltitude, setGuidedAltitude] = useState(10);
  const [takeoffAltitude, setTakeoffAltitude] = useState(10);
  const [showEkf, setShowEkf] = useState(false);
  const [showVibration, setShowVibration] = useState(false);

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
    // { path: "/flightLayout", icon: Drone },
    { path: "/loadParameters", icon: SlidersHorizontal },
    { path: "/calibration", icon: DraftingCompass },
    { path: "/joystick", icon: Gamepad2 },
    { path: "/firmware", icon: Drone },
  ];

  // Leverages your matching preload signature: window.electron.flightCommand(cmd, payload)

  // const handleArmToggle = () => {
  //   if (!isConnected) return;
  //   const actionKey = isArmed ? "DISARM" : "ARM";
  //   window.electron?.flightCommand(actionKey);
  // };
  const [forceRetry, setForceRetry] = useState(null);

  const handleArmToggle = () => {
    if (!isConnected) return;

    const action = isArmed ? "DISARM" : "ARM";

    if (forceRetry) {
      const confirmed = window.confirm(
        `Force ${action}? This bypasses certain safety checks.`,
      );

      if (!confirmed) return;

      window.electron?.flightCommand(`FORCE_${action}`);
      setForceNext(false);
      return;
    }

    window.electron?.flightCommand(action);
  };

  useEffect(() => {
    const unsubscribe = window.electron?.onCommandAck((ack) => {
      if (Number(ack.command) !== 400) return;
      console.log("this is ack used in mainlayout :", ack);

      const action = ack.action;
      const rejected =
        ack.resultName === "DENIED" ||
        ack.resultName === "TEMP_REJECTED" ||
        ack.resultName === "FAILED";

      if (rejected && (action === "ARM" || action === "DISARM")) {
        setForceRetry(action);

        alert(
          `${action} was rejected. Click the same button again to retry with force.`,
        );
      } else if (ack.resultName === "ACCEPTED") {
        setForceRetry(null);
      }
    });

    return () => unsubscribe?.();
  }, []);

  const handleRebootFC = () => {
    if (!isConnected) return;

    const confirmed = window.confirm(
      "Reboot the Flight Controller?\n\nThe vehicle will disconnect temporarily and reconnect after the reboot.",
    );

    if (!confirmed) return;

    window.electron?.restartFc();
  };

  const handleRebootToBootloader = () => {
    if (!isConnected) return;

    const confirmed = window.confirm(
      "Reboot the Flight Controller into bootloader mode?\n\n" +
        "The normal ArduPilot firmware will stop running and the controller " +
        "will remain in bootloader mode until it is reset or firmware operation is completed.",
    );

    if (!confirmed) return;

    console.log(
      "[MAIN-LAYOUT] Requesting Flight Controller reboot to bootloader...",
    );

    window.electron?.firmware.enterBootloader();
  };

  // Executes your explicit CommandService.setMode(modeId) routine via your save block
  const handleSaveMode = () => {
    if (!isConnected) return;
    const targetModeId = Number(selectedMode);
    console.log(
      `[MAIN-LAYOUT] Requesting mode write hook to hardware ID: ${targetModeId}`,
    );

    window.electron?.flightCommand("SET_MODE", targetModeId);
  };

  const handleImmediateTakeoff = () => {
    if (!isConnected) return;

    if (!isArmed) {
      alert(
        "Takeoff Denied: You must ARM the flight controller before initializing takeoff.",
      );
      return;
    }

    if (Number(currentVehicleMode) !== 4) {
      alert(
        "Takeoff Denied: ArduPilot requires the drone to be explicitly in GUIDED mode to execute a Takeoff command.",
      );
      return;
    }

    if (takeoffAltitude <= 0 || takeoffAltitude > 50) {
      alert(
        "Takeoff Denied: Please specify a valid target altitude between 1 and 120 meters.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Confirm launch sequence? Drone will ascend vertically to ${takeoffAltitude} meters.`,
    );
    if (!confirmed) return;

    window.electron?.flightCommand("TAKEOFF", { alt: takeoffAltitude });
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

    // if (nextMode === 4) {
    //   if (latitude == null || longitude == null) {
    //     alert(
    //       "Cannot switch to Guided Mode: Live telemetry GPS coordinates are currently unavailable.",
    //     );
    //     setSelectedMode(Number(currentVehicleMode));
    //     return;
    //   }
    //   setGuidedDialogOpen(true);
    // }
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

          <div className="flex gap-3 ">
            <p
              className={`cursor-pointer ${showEkf ? "text-green-500 font-semibold" : "font-semibold"}`}
              onClick={() => setShowEkf((prev) => !prev)}
            >
              EKF
            </p>
            <p
              className={`cursor-pointer ${showVibration ? "text-green-500 font-semibold" : "font-semibold"}`}
              onClick={() => setShowVibration((prev) => !prev)}
            >
              Vibration
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* PLACE DIRECTLY TO THE LEFT OF MODE CHANGE DROPDOWN CONTAINER */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-md">
              <div className="flex items-center gap-1 pl-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Alt:
                </span>
                <input
                  type="number"
                  disabled={!isConnected}
                  // Shows an empty box instead of 0 when backspacing
                  value={takeoffAltitude === 0 ? "" : takeoffAltitude}
                  min={1}
                  max={150}
                  // Allows typing freely without blocking keys mid-way
                  onChange={(e) => setTakeoffAltitude(Number(e.target.value))}
                  // Cleans up the number to be strictly between 1 and 150 when clicking away
                  onBlur={(e) => {
                    const val = Number(e.target.value);
                    setTakeoffAltitude(Math.min(150, Math.max(1, val)));
                  }}
                  className="w-12 bg-zinc-950 text-center text-xs font-mono font-bold text-emerald-400 border border-zinc-800 rounded py-0.5 outline-none focus:border-zinc-600 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[10px] text-zinc-500 font-bold font-mono">
                  m
                </span>
              </div>

              <Button
                size="sm"
                onClick={handleImmediateTakeoff}
                disabled={
                  !isConnected || !isArmed || Number(currentVehicleMode) !== 4
                }
                className={`flex items-center gap-1 text-xs font-black tracking-wide uppercase px-2.5 h-7 transition duration-200 ${
                  isArmed && Number(currentVehicleMode) === 4
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                    : "bg-zinc-700 text-zinc-300 border border-zinc-700 opacity-40 cursor-not-allowed"
                }`}
              >
                <PlaneTakeoff size={14} />
                <span>Takeoff</span>
              </Button>
            </div>

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
              className={`flex items-center gap-1.5 font-bold transition duration-200 min-w-27.5 ${
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

      {showEkf && <EkfStatus onClose={() => setShowEkf(false)} />}
      {showVibration && <Vibration onClose={() => setShowVibration(false)} />}
    </div>
  );
}
