import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./App.css";

import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

import { Toaster } from "@/components/ui/sonner";

import RenderTelemetry from "./pages/RenderTelemetry";
import PortSelector from "./pages/PortSelector";
import ParamViewer from "./pages/ParamViewer";
import MainLayout from "./layouts/MainLayout";
import FlightLayout from "./layouts/FlightLayout";
import { useHardWareStore } from "./store/hardwareCheckStore";
import { useTelemetryStore } from "@/store/telemetryStore";
import { useParamStore } from "@/store/paramStore";
import { getParamCache, setParamCache } from "@/lib/paramCache";
import HardwareCheck from "./pages/HardwareCheck";
import Calibration from "./pages/Calibration";
import AccellCalibration from "./view/AccellCalibration";
import CompassCalibration from "./view/CompassCalibration";
import CompassMotorCalibration from "./view/CompassMotorCalibration";
import { useJoystick } from "./api/gamepad.jsx";
import { useGamepadDebug } from "./api/gamepadAxes";
import { useGamepad } from "./api/gamepad";
import { JoystickSettings } from "./pages/JoystickSetting";

export function TelemetryBridge() {
  //--------telemetry--------//
  const setMessage = useTelemetryStore((s) => s.setMessage);
  const setAttitude = useTelemetryStore((s) => s.setAttitude);
  const setConnectionState = useTelemetryStore((s) => s.setConnectionState);

  const connectionState = useTelemetryStore((s) => s.connectionState);

  //-----------hardwareStatus----------//
  const setHardwareMsg = useHardWareStore((s) => s.setHardwareStatus);

  //----------params---------//
  const setParams = useParamStore((s) => s.setParams);
  const updateParam = useParamStore((s) => s.updateParam);
  const setMeta = useParamStore((s) => s.setMeta);
  const setLoading = useParamStore((s) => s.setLoading);

  const toDeg = (rad) => (rad * 180) / Math.PI;

  // LOAD META + CACHE ONCE
  useEffect(() => {
    let mounted = true;

    async function init() {
      const cached = getParamCache();

      if (cached && mounted) {
        setParams(cached);
      }

      const meta = await window.electron.getParamMeta();

      if (mounted) {
        setMeta(meta || {});
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // REQUEST PARAMS AFTER CONNECTION
  useEffect(() => {
    if (connectionState !== "CONNECTED") return;

    async function loadParams() {
      setLoading(true);
      await window.electron.requestParams();
    }

    loadParams();
  }, [connectionState]);

  // HardwareCheck

  useEffect(() => {
    const unsubHardware = window.electron.onHardwareStatus((msg) => {
      // console.log("hardware status received:", msg);
      setHardwareMsg(msg);
    });

    return () => {
      unsubHardware?.();
    };
  }, [setHardwareMsg]);

  // PARAM STREAM
  useEffect(() => {
    const unsubParam = window.electron.onParam((msg) => {
      if (!msg?.id) return;

      updateParam(msg.id, {
        id: msg.id,
        value: msg.value,
        type: msg.type,
        index: msg.index,
      });
    });

    const unsubComplete = window.electron.onParamComplete((msg) => {
      const params = msg.params || {};

      setParams(params);
      setParamCache(params);

      setLoading(false);
    });

    const unsubTelemetry = window.electron.onTelemetry((msg) => {
      if (!msg?.type) return;

      if (msg.type === "Attitude") {
        setAttitude(
          toDeg(msg.data.roll),
          toDeg(msg.data.pitch),
          toDeg(msg.data.yaw),
        );
      }

      setMessage(msg);
    });

    const unsubConnection = window.electron.onConnectionState((state) => {
      setConnectionState(state);
    });

    return () => {
      unsubParam?.();
      unsubComplete?.();
      unsubTelemetry?.();
      unsubConnection?.();
    };
  }, []);

  return null;
}

export default function App() {
  // const [connectionState, setConnectionState] = useState("DISCONNECTED");
  const connectionState = useTelemetryStore((s) => s.connectionState);
  const isConnected = connectionState === "CONNECTED";
  const [showParams, setShowParams] = useState(false);
  const navigate = useNavigate();

  // useEffect(() => {
  //   const unsub = window.electron.onConnectionState((state) => {
  //     setConnectionState(state);
  //   });

  //   return () => unsub?.();
  // }, []);

  useJoystick();
  useGamepadDebug();
  useGamepad();

  useEffect(() => {
    if (connectionState === "DISCONNECTED") {
      navigate("/");
    }
  }, [connectionState]);

  return (
    <>
      {/* GLOBAL TELEMETRY STREAM (MUST BE OUTSIDE ROUTES) */}
      <TelemetryBridge />

      <Routes>
        {/* ENTRY */}
        <Route
          path="/"
          element={
            isConnected ? <Navigate to="/telemetry" /> : <PortSelector />
          }
        />

        {/* MAIN LAYOUT */}
        <Route element={<MainLayout />}>
          <Route path="/telemetry" element={<RenderTelemetry />} />
          <Route path="/params" element={<ParamViewer />} />
          <Route path="/flightLayout" element={<FlightLayout />} />
          <Route path="/loadParameters" element={<ParamViewer />} />
          <Route path="/hardwareCheck" element={<HardwareCheck />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/accellCalibration" element={<AccellCalibration />} />
          <Route path="/compassCalibration" element={<CompassCalibration />} />
          <Route
            path="/compassMotorCalibration"
            element={<CompassMotorCalibration />}
          />
          <Route path="/joystick" element={<JoystickSettings />} />
        </Route>
      </Routes>

      <Toaster position="top-center" />
    </>
  );
}
