import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTelemetryStore } from "@/store/telemetryStore";

import { HeartPulse, Cpu, Radio, ShieldCheck } from "lucide-react";

import {
  MAV_TYPE,
  MAV_AUTOPILOT,
  MAV_STATE,
  // decodeBaseMode,
  decodeCustomMode,
} from "@/lib/mavLinkEnums";

/* ---------------------------------------- */
function formatValue(value) {
  if (value === null || value === undefined) return "—";

  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : value.toFixed(2);
  }

  return String(value);
}

function formatLabel(label) {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ---------------------------------------- */
/* CENTRALIZED MAVLINK VALUE MAPPING */
/* ---------------------------------------- */
function mapHeartbeatValue(key, value, hb) {
  switch (key) {
    case "type":
      return MAV_TYPE[value] || value;

    case "autopilot":
      return MAV_AUTOPILOT[value] || value;

    case "system_status":
    case "systemStatus":
      return MAV_STATE[value] || value;

    // case "base_mode":
    // case "baseMode": {
    //   const decoded = decodeBaseMode(value);

    //   if (Array.isArray(decoded)) {
    //     return decoded.join(", ");
    //   }

    //   if (typeof decoded === "object" && decoded !== null) {
    //     return Object.keys(decoded)
    //       .filter((k) => decoded[k])
    //       .join(", ");
    //   }

    //   return decoded || value;
    // }
    case "custom_mode":
    case "customMode":
      return decodeCustomMode(value);

    default:
      return value;
  }
}

/* ---------------------------------------- */
function TelemetryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <span className="text-sm text-zinc-400">{formatLabel(label)}</span>

      <span className="font-mono text-sm font-semibold text-white">
        {formatValue(value)}
      </span>
    </div>
  );
}

/* ---------------------------------------- */
export default function HeartbeatCard() {
  const hb = useTelemetryStore((s) => s.messages["Heartbeat"]?.data) || {};

  const gps = useTelemetryStore((s) => s.messages["GpsRawInt"]?.data) || {};

  const hdop =
    gps.hdop ??
    gps.hDop ??
    (gps.eph != null && gps.eph !== 65535 ? gps.eph / 100 : null);

  /* RAW VALUES */
  const {
    system_status,
    systemStatus,
    base_mode,
    baseMode,
    custom_mode,
    customMode,
    type,
    autopilot,
  } = hb;

  /* MAPPED VALUES */
  const mappedStatus = mapHeartbeatValue(
    "system_status",
    system_status ?? systemStatus ?? 0,
    hb,
  );

  const mappedType = mapHeartbeatValue("type", type, hb);

  const mappedAutopilot = mapHeartbeatValue("autopilot", autopilot, hb);

  const mappedMode = mapHeartbeatValue(
    "custom_mode",
    custom_mode ?? customMode ?? 0,
    hb,
  );

  const statusCode = system_status ?? systemStatus ?? 0;

  const isActive = statusCode === 4;

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-gray-800 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-gray-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <HeartPulse size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">HEARTBEAT</h2>
            <p className="text-xs text-zinc-500">Vehicle Status</p>
          </div>
        </div>

        <Badge
          className={
            isActive
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-orange-500/20 bg-orange-500/10 text-orange-400"
          }
        >
          {mappedStatus}
        </Badge>
      </div>

      {/* QUICK INFO */}
      <div className="grid grid-cols-3 gap-3 border-b border-zinc-800 p-4">
        <div className="text-center">
          <Cpu className="mx-auto mb-2 text-cyan-400" size={30} />

          <p className="text-[10px] text-zinc-500">TYPE</p>

          <p className="text-sm font-semibold text-white">
            {mappedType || "—"}
          </p>
        </div>

        <div className="text-center">
          <Radio className="mx-auto mb-2 text-orange-400" size={30} />

          <p className="text-[10px] text-zinc-500">AUTOPILOT</p>

          <p className="text-sm font-semibold text-white">
            {mappedAutopilot || "—"}
          </p>
        </div>

        <div className="text-center">
          <ShieldCheck className="mx-auto mb-2 text-violet-400" size={30} />

          <p className="text-[10px] text-zinc-500">MODE</p>

          <p className="text-sm font-semibold text-white">{mappedMode}</p>
        </div>
      </div>

      {/* FULL LIST */}
      {/* <div className="space-y-2 p-4">
        {Object.entries(hb).map(([key, value]) => (
          <TelemetryRow
            key={key}
            label={key}
            value={mapHeartbeatValue(key, value, hb)}
          />
        ))}
      </div> */}

      <div className="space-y-2 p-4">
        {Object.entries(hb)
          .filter(
            ([key]) =>
              key !== "mavlink_version" &&
              key !== "mavlinkVersion" &&
              key !== "base_mode" &&
              key !== "baseMode",
          )
          .map(([key, value]) => (
            <TelemetryRow
              key={key}
              label={key}
              value={mapHeartbeatValue(key, value, hb)}
            />
          ))}

        {/* Replace MAVLink Version with HDOP */}
        <TelemetryRow
          label="hdop"
          value={hdop != null ? Number(hdop).toFixed(2) : "—"}
        />
      </div>
    </Card>
  );
}

// css of card unchanged <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-xl">
