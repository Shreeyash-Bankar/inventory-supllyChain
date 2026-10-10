import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTelemetryStore } from "@/store/telemetryStore";
import { RotateCcw, MoveVertical, Compass } from "lucide-react";

/* ----------------------------------------
   HELPERS
---------------------------------------- */

function safeNumber(v, decimals = 1) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return Number(v).toFixed(decimals);
}

/* ----------------------------------------
   ROW
---------------------------------------- */

function TelemetryRow({ icon, label, value, unit, color }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-all hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className="text-[11px] text-zinc-600">Flight Axis</p>
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono text-2xl font-bold text-white">
          {value}
          <span className="ml-1 text-sm text-zinc-500">{unit}</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------
   MAIN
---------------------------------------- */

export default function AttitudeCard() {
  const attitude = useTelemetryStore((s) => s.attitude) ?? {};

  const roll = attitude.roll;
  const pitch = attitude.pitch;
  const yaw = attitude.yaw;

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-5 py-4 backdrop-blur">
        <div>
          <h2 className="text-lg font-bold tracking-wide text-white">
            ATTITUDE
          </h2>
          <p className="text-xs text-zinc-500">Aircraft Orientation</p>
        </div>

        <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
          LIVE
        </Badge>
      </div>

      {/* CONTENT */}
      <div className="space-y-3 p-5">
        <TelemetryRow
          label="Roll"
          value={safeNumber(roll, 1)}
          unit="°"
          color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
          icon={<RotateCcw size={18} />}
        />

        <TelemetryRow
          label="Pitch"
          value={safeNumber(pitch, 1)}
          unit="°"
          color="bg-orange-500/10 text-orange-400 border border-orange-500/20"
          icon={<MoveVertical size={18} />}
        />

        <TelemetryRow
          label="Yaw"
          value={safeNumber(yaw, 1)}
          unit="°"
          color="bg-violet-500/10 text-violet-400 border border-violet-500/20"
          icon={<Compass size={18} />}
        />
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/70 px-5 py-3 text-xs text-zinc-500">
        <span>Telemetry Stream Active</span>
        <span className="font-mono text-emerald-400">5Hz</span>
      </div>

      {/* GLOW */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
    </Card>
  );
}
