import { Card } from "@/components/ui/card";
import { useTelemetryStore } from "@/store/telemetryStore";
import { Satellite, MapPin, Crosshair, Navigation } from "lucide-react";

/* ----------------------------------------
   HELPERS
---------------------------------------- */

function safe(value) {
  return value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : value;
}

/* 2 decimal precision + safe */
function toDegE7(v) {
  if (v === null || v === undefined) return "—";

  const num = v / 1e7;

  if (!Number.isFinite(num)) return "—";

  return num.toFixed(5);
}

function toMeters(v) {
  if (v === null || v === undefined) return "—";

  const num = v / 1000;

  if (!Number.isFinite(num)) return "—";

  return num.toFixed(1);
}

/* ----------------------------------------
   STAT COMPONENT
---------------------------------------- */

function Stat({ icon, label, value, color }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:bg-zinc-900/70 transition">
      <div className={`mb-1 ${color}`}>{icon}</div>

      <p className="text-xs font-semibold tracking-wide text-zinc-300">
        {label}
      </p>

      <p className="mt-1 font-mono text-sm font-bold text-white">
        {safe(value)}
      </p>
    </div>
  );
}

/* ----------------------------------------
   MAIN COMPONENT
---------------------------------------- */

export default function GPSCard() {
  const gps = useTelemetryStore((s) => s.messages["GpsRawInt"]?.data);
  const altitude = useTelemetryStore(
    (s) => s.messages["GlobalPositionInt"]?.data,
  );
  // console.log("Gps obj: ", gps);
  // console.log("Altitude containing obj:", altitude);

  const global = useTelemetryStore(
    (s) => s.messages["GlobalPositionInt"]?.data,
  );

  const lat = gps?.lat ?? global?.lat;
  const lon = gps?.lon ?? global?.lon;
  const alt = altitude?.relativeAlt ?? global?.relative_alt;

  const satellites = gps?.satellitesVisible ?? gps?.satellites;
  const fix = gps?.fix_type;

  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <Navigation size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">GPS</h2>
            <p className="text-xs text-zinc-500">Position & Navigation</p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-300">
          FIX: {safe(fix)}
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-3 p-4 border-b border-zinc-800">
        <Stat
          icon={<Satellite size={18} />}
          label="SATELLITES"
          value={satellites}
          color="text-cyan-400"
        />

        <Stat
          icon={<Crosshair size={18} />}
          label="LATITUDE"
          value={toDegE7(lat)}
          color="text-green-400"
        />

        <Stat
          icon={<MapPin size={18} />}
          label="LONGITUDE"
          value={toDegE7(lon)}
          color="text-orange-400"
        />
      </div>

      {/* ALTITUDE */}
      <div className="p-4">
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <span className="text-sm font-semibold text-zinc-300">Altitude</span>

          <span className="font-mono text-sm font-bold text-white">
            {toMeters(alt)} m
          </span>
        </div>

        <p className="mt-2 text-[11px] text-center text-zinc-500">
          Global Navigation Solution
        </p>
      </div>
    </Card>
  );
}
