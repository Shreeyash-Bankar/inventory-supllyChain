import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { memo } from "react";

import TelemetrySelectorModal from "./TelemetrySelectorModal";
import SelectedTelemetryPanel from "./SelectedTelemetryPanel";
import AttitudeIndicator from "./AttitudeIndicator";
import FlightActions from "./FlightActions";
import Compass from "./Compass";
import { useTelemetryStore } from "@/store/telemetryStore";
import { TelemetryCard } from "./TelemetryCard";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FlightDashboard from "@/components/dashboard/FlightDashboard";

const toDeg = (rad) => (rad * 180) / Math.PI;

const TelemetryGrid = memo(function TelemetryGrid({
  messages,
  flash,
  formatValue,
  getAge,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ">
      {Object.entries(messages).map(([type, payload]) => {
        return (
          <TelemetryCard
            key={type}
            type={type}
            payload={payload}
            flashTime={flash[type]}
            formatValue={formatValue}
            getAge={getAge}
          />
        );
      })}
    </div>
  );
});

/* ---------------- MAIN ---------------- */

export default function RenderTelemetry() {
  const [selectedFields, setSelectedFields] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  const messages = useTelemetryStore((s) => s.messages);
  const flash = useTelemetryStore((s) => s.flash);
  const attitude = useTelemetryStore((s) => s.attitude);

  // const [attitude, setAttitude] = useState({
  //   roll: 0,
  //   pitch: 0,
  //   yaw: 0,
  // });

  const lastUpdateRef = useRef({});

  const handleRemoveField = (type, key) => {
    setSelectedFields((prev) =>
      prev.filter((f) => !(f.type === type && f.key === key)),
    );
  };

  const formatValue = (v) => {
    if (typeof v === "number") {
      if (Math.abs(v) < 0.01) return v.toExponential(2);
      return v.toFixed(3);
    }
    return String(v);
  };

  const getAge = (t) => {
    if (!t) return "—";
    const diff = (Date.now() - t) / 1000;
    return diff < 1 ? "now" : `${diff.toFixed(1)}s ago`;
  };

  return (
    <div className="flex h-full overflow-hidden bg-background  text-foreground relative">
      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-sidebar-foreground">
        {showSelector && (
          <TelemetrySelectorModal
            messages={messages}
            selectedFields={selectedFields}
            onChange={setSelectedFields}
            onClose={() => setShowSelector(false)}
          />
        )}

        <div className="flex-1 overflow-y-auto pr-2 bg-sidebar-foreground">
          {/* FLIGHT DASHBOARD */}
          {activeTab === "dashboard" && <FlightDashboard />}

          {/* RAW MAVLINK TELEMETRY */}
          {activeTab === "telemetry" && (
            <TelemetryGrid
              messages={messages}
              flash={flash}
              formatValue={formatValue}
              getAge={getAge}
            />
          )}

          {/* CUSTOM TELEMETRY */}
          {activeTab === "custom" && (
            <SelectedTelemetryPanel
              selectedFields={selectedFields}
              messages={messages}
              onRemove={handleRemoveField}
            />
          )}

          {/* ACTIONS */}
          {activeTab === "actions" && <FlightActions />}
        </div>
      </div>
    </div>
  );
}
