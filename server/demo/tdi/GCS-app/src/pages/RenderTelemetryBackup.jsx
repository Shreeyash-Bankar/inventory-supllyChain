import { useEffect, useRef, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import TelemetrySelectorModal from "./TelemetrySelectorModal";
import SelectedTelemetryPanel from "./SelectedTelemetryPanel";

import AttitudeIndicator from "./AttitudeIndicator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import FlightActions from "./FlightActions";

const toDeg = (rad) => (rad * 180) / Math.PI;

export default function RenderTelemetry() {
  const [messages, setMessages] = useState({});
  const [flash, setFlash] = useState({});
  const [attitudeHistory, setAttitudeHistory] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [attitude, setAttitude] = useState({
    roll: 0,
    pitch: 0,
    yaw: 0,
  });

  const lastUpdateRef = useRef({});

  useEffect(() => {
    const unsubscribe = window.electron.onTelemetry((msg) => {
      if (!msg?.type) return;

      // console.log("Telemetry message:", msg);

      const now = Date.now();

      // ✅ capture attitude stream
      if (msg.type === "Attitude") {
        const roll = msg.data.roll;
        const pitch = msg.data.pitch;
        const yaw = msg.data.yaw;

        setAttitude({
          roll: toDeg(msg.data.roll),
          pitch: toDeg(msg.data.pitch),
          yaw: toDeg(msg.data.yaw),
        });

        setAttitudeHistory((prev) =>
          [
            ...prev,
            {
              time: now,
              roll: toDeg(roll),
              pitch: toDeg(pitch),
              yaw: toDeg(yaw),
            },
          ].slice(-100),
        );
      }

      setMessages((prev) => ({
        ...prev,
        [msg.type]: {
          data: msg.data,
          updatedAt: now,
        },
      }));

      // flash highlight
      setFlash((prev) => ({
        ...prev,
        [msg.type]: now,
      }));

      lastUpdateRef.current[msg.type] = now;
    });

    return () => unsubscribe?.();
  }, []);

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
    <div className="p-4 space-y-4">
      <SelectedTelemetryPanel
        selectedFields={selectedFields}
        messages={messages}
        onRemove={handleRemoveField}
      />
      {showSelector && (
        <TelemetrySelectorModal
          messages={messages}
          selectedFields={selectedFields}
          onChange={setSelectedFields}
          onClose={() => setShowSelector(false)}
        />
      )}
      <Card className="p-4 flex justify-center">
        <AttitudeIndicator
          roll={attitude.roll}
          pitch={attitude.pitch}
          heading={attitude.yaw}
          size={400}
        />
      </Card>

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Live MAVLink Telemetry</h1>

        <Button onClick={() => window.electron.requestParams()}>
          Reload Params
        </Button>

        <Button onClick={() => setShowSelector(true)}>
          Customize Dashboard
        </Button>
      </div>
      <div>
        <FlightActions />
      </div>
      {showGraph && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-2">
            Live Attitude (Streaming)
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attitudeHistory}>
              <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip />

              <Line
                type="monotone"
                dataKey="roll"
                stroke="#ef4444"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="pitch"
                stroke="#22c55e"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="yaw"
                stroke="#3b82f6"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* EMPTY STATE */}
      {Object.keys(messages).length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No telemetry yet...
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(messages).map(([type, payload]) => {
            const data = payload.data;
            const updatedAt = payload.updatedAt;
            const isFlashing = flash[type] && Date.now() - flash[type] < 400;

            return (
              <Card
                key={type}
                className={`p-4 flex flex-col gap-3 transition-all duration-300 ${
                  isFlashing ? "border-green-500 shadow-md" : ""
                }`}
              >
                {/* HEADER */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    <h3 className="font-semibold text-sm">{type}</h3>
                    <Badge variant="secondary">
                      {Object.keys(data || {}).length} fields
                    </Badge>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {getAge(updatedAt)}
                  </span>
                </div>

                {/* KEY VALUES (TOP 3 PRIORITY LOOK) */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(data || {})
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between bg-muted/40 px-2 py-1 rounded"
                      >
                        <span className="text-xs text-muted-foreground">
                          {key}
                        </span>
                        <span className="text-xs font-mono">
                          {formatValue(value)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* FULL RAW VIEW */}
                <ScrollArea className="h-40 pr-2 border rounded-md p-2">
                  <div className="space-y-1 text-xs">
                    {Object.entries(data || {}).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between border-b py-1"
                      >
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-mono">{formatValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
