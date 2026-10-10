import React, { useState, useEffect, useRef } from "react";

const AVAILABLE_AXES_ACTIONS = [
  { value: "unassigned", label: "None / Disabled" },
  { value: "roll", label: "Roll " },
  { value: "pitch", label: "Pitch " },
  { value: "yaw", label: "Yaw " },
  { value: "throttle", label: "Throttle" },
];

const AVAILABLE_BUTTONS_ACTIONS = [
  { value: "unassigned", label: "None / Disabled" },
  { value: "ARM_TOGGLE", label: "Arm / Disarm Drone" },
  { value: "MODE_RTL", label: "Return To Launch (RTL)" },
  { value: "MODE_LOITER", label: "Loiter Mode" },
  { value: "MODE_ALTHOLD", label: "Altitude Hold Mode" },
  { value: "MODE_STABILIZE", label: "Stabilize Mode" },
  { value: "MODE_GUIDED", label: "Guided Mode" },
  { value: "MODE_LAND", label: "Land Drone Mode" },
  { value: "GIMBAL_PITCH_UP", label: "Gimbal Pitch Up" },
  { value: "GIMBAL_PITCH_DOWN", label: "Gimbal Pitch Down" },
  { value: "GIMBAL_YAW_LEFT", label: "Gimbal Yaw Left" },
  { value: "GIMBAL_YAW_RIGHT", label: "Gimbal Yaw Right" },
];

export function JoystickSettings() {
  const [mapping, setMapping] = useState({
    axes: {
      0: "yaw",
      1: "throttle",
      2: "roll",
      3: "pitch",
    },

    buttons: {
      0: "MODE_LAND", // A
      1: "MODE_RTL", // B
      2: "MODE_GUIDED", // X
      3: "MODE_LOITER", // Y
      4: "MODE_STABILIZE",
      5: "MODE_ALTHOLD",
      12: "GIMBAL_PITCH_UP",
      13: "GIMBAL_PITCH_DOWN",
      14: "GIMBAL_YAW_LEFT",
      15: "GIMBAL_YAW_RIGHT",
    },
  });

  const [liveData, setLiveData] = useState({ axes: [], buttons: [] });
  const [lastActiveAxis, setLastActiveAxis] = useState(null);
  const [lastActiveButton, setLastActiveButton] = useState(null);
  const [joystickEnabled, setJoystickEnabled] = useState(false);

  const prevAxesRef = useRef([]);

  const activeGamepadIndexRef = useRef(null);
  // const prevAxesRef = useRef([]);

  useEffect(() => {
    const handleConnected = (e) => {
      activeGamepadIndexRef.current = e.gamepad.index;
    };
    const handleDisconnected = (e) => {
      if (activeGamepadIndexRef.current === e.gamepad.index) {
        activeGamepadIndexRef.current = null;
        setLiveData({ axes: [], buttons: [] }); // Reset UI state cleanly
      }
    };

    window.addEventListener("gamepadconnected", handleConnected);
    window.addEventListener("gamepaddisconnected", handleDisconnected);

    // Initial check
    const initialGamepads = navigator.getGamepads();
    for (let i = 0; i < initialGamepads.length; i++) {
      if (initialGamepads[i]) {
        activeGamepadIndexRef.current = i;
        break;
      }
    }

    const pollGamepad = () => {
      if (activeGamepadIndexRef.current === null) return;

      const gamepads = navigator.getGamepads();
      const gamepad = gamepads[activeGamepadIndexRef.current]; //  Read dynamic index
      if (!gamepad) return;

      const currentAxes = Array.from(gamepad.axes || []);
      const currentButtons = (gamepad.buttons || []).map((b) => b.pressed);

      setLiveData({ axes: currentAxes, buttons: currentButtons });

      currentAxes.forEach((val, idx) => {
        const prevVal = prevAxesRef.current[idx] ?? 0;
        const delta = Math.abs(val - prevVal);
        if (Math.abs(val) > 0.15 && delta > 0.05) {
          setLastActiveAxis(idx);
        }
      });
      prevAxesRef.current = currentAxes;

      currentButtons.forEach((pressed, idx) => {
        if (pressed) {
          setLastActiveButton(idx);
        }
      });
    };

    const interval = setInterval(pollGamepad, 50); // Balanced 50Hz Loop
    return () => {
      window.removeEventListener("gamepadconnected", handleConnected);
      window.removeEventListener("gamepaddisconnected", handleDisconnected);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = window.electron?.onJoystickState((data) => {
      setJoystickEnabled(Boolean(data.enabled));
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleJoystickToggle = () => {
    if (joystickEnabled) {
      window.electron?.disableJoystick();
    } else {
      window.electron?.enableJoystick();
    }
  };

  const handleAxisChange = (axisIndex, action) => {
    const updated = {
      ...mapping,
      axes: { ...mapping.axes, [axisIndex]: action },
    };
    setMapping(updated);
    window.electron?.updateJoystickConfig(updated);
  };

  const handleButtonChange = (buttonIndex, action) => {
    const updated = {
      ...mapping,
      buttons: { ...mapping.buttons, [buttonIndex]: action },
    };
    setMapping(updated);
    window.electron?.updateJoystickConfig(updated);
  };

  // Convert raw gamepad axis (-1 to 1) to flight software PWM values (1000 to 2000)
  const calculatePwm = (axisValue, actionType) => {
    if (axisValue === undefined) return 1500;

    // Throttle typically maps from 1000 (fully back/down) to 2000 (fully forward/up)
    if (actionType === "throttle") {
      // Invert sign if hardware follows native gamepad standard (down = positive)
      const cleanVal = -axisValue;
      return Math.round(1000 + ((cleanVal + 1) / 2) * 1000);
    }

    // Standard control channels map 1500 as the absolute neutral center point
    // const cleanVal = actionType === "pitch" ? -axisValue : axisValue;
    const cleanVal = axisValue;
    return Math.round(1500 + cleanVal * 500);
  };

  return (
    <div
      style={{
        padding: "24px",
        color: "#fff",
        background: "#1a1a1a",
        borderRadius: "12px",
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "20px auto",
      }}
    >
      <div
        style={{
          borderBottom: "1px solid #333",
          paddingBottom: "16px",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            margin: "0 0 8px 0",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          Joystick Setting
        </h2>
        <p style={{ margin: "0", fontSize: "14px", color: "#aaa" }}>
          Move a thumbstick or press any key to highlight its layout mapping
          assignment configuration dynamically.
        </p>

        <button
          onClick={handleJoystickToggle}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            background: joystickEnabled ? "#dc2626" : "#16a34a",
            color: "white",
          }}
        >
          {joystickEnabled ? "Disable Joystick" : "Enable Joystick"}
        </button>
      </div>

      {/* STICKS SECTION */}
      <div style={{ marginBottom: "40px" }}>
        <h3
          style={{
            color: "#4caf50",
            borderBottom: "1px solid #2e7d32",
            paddingBottom: "6px",
          }}
        >
          Thumb Stick Axes Calibration
        </h3>
        {liveData.axes.map((val, index) => {
          const assignedAction = mapping.axes[index] || "unassigned";
          const pwm = calculatePwm(val, assignedAction);
          const isActive = lastActiveAxis === index;

          return (
            <div
              key={`axis-${index}`}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 220px 1fr",
                alignItems: "center",
                gap: "15px",
                margin: "12px 0",
                padding: "10px",
                background: isActive ? "#1b3a24" : "#262626",
                borderRadius: "6px",
                border: isActive
                  ? "1px solid #4caf50"
                  : "1px solid transparent",
                transition: "background 0.2s, border 0.2s",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>Axis {index}</span>
                {isActive && (
                  <span
                    style={{
                      background: "#4caf50",
                      color: "#000",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontWeight: "black",
                    }}
                  >
                    MOVING
                  </span>
                )}
              </div>

              <select
                value={assignedAction}
                onChange={(e) => handleAxisChange(index, e.target.value)}
                style={{
                  padding: "8px",
                  width: "100%",
                  background: "#333",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                }}
              >
                {AVAILABLE_AXES_ACTIONS.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>

              {/* LIVE PWM SLIDER GRAPHICS */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <input
                  type="range"
                  min="1000"
                  max="2000"
                  value={pwm}
                  readOnly
                  style={{
                    flex: 1,
                    accentColor: "#4caf50",
                    cursor: "not-allowed",
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    width: "70px",
                    textAlign: "right",
                    background: "#333",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "13px",
                    border: "1px solid #444",
                  }}
                >
                  {pwm} µs
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* BUTTONS SECTION */}
      <div>
        <h3
          style={{
            color: "#2196f3",
            borderBottom: "1px solid #1565c0",
            paddingBottom: "6px",
          }}
        >
          Controller Button Assignments
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "15px",
          }}
        >
          {liveData.buttons.map((isPressed, index) => {
            const isActive = lastActiveButton === index;

            return (
              <div
                key={`btn-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  background: isPressed
                    ? "#0d47a1"
                    : isActive
                      ? "#1c2836"
                      : "#262626",
                  borderRadius: "6px",
                  border: isPressed
                    ? "1px solid #2196f3"
                    : isActive
                      ? "1px solid #1565c0"
                      : "1px solid transparent",
                  transition: "background 0.1s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: isPressed ? "#2196f3" : "#555",
                      boxShadow: isPressed ? "0 0 8px #2196f3" : "none",
                    }}
                  />
                  <span style={{ fontWeight: isActive ? "bold" : "normal" }}>
                    Button {index}
                  </span>
                </div>

                <select
                  value={mapping.buttons[index] || "unassigned"}
                  onChange={(e) => handleButtonChange(index, e.target.value)}
                  style={{
                    padding: "6px",
                    width: "160px",
                    background: "#333",
                    color: "#fff",
                    border: "1px solid #444",
                    borderRadius: "4px",
                  }}
                >
                  {AVAILABLE_BUTTONS_ACTIONS.map((act) => (
                    <option key={act.value} value={act.value}>
                      {act.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
