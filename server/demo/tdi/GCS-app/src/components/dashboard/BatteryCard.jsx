import { Card } from "@/components/ui/card";
import { useTelemetryStore } from "@/store/telemetryStore";

/* ----------------------------------------
   NORMALIZATION (SAFE)
---------------------------------------- */

function normalizeBattery(b) {
  if (!b) {
    return {
      voltage: null,
      // servo: null,
      current: null,
      remaining: null,
      // raw: null,
    };
  }

  // const vcc = b.Vcc ?? b.vcc;
  // const vservo = b.Vservo ?? b.vservo;
  const batteryRemaining = b.batteryRemaining;
  const currentBattery = b.currentBattery;
  const voltageBattery = b.voltageBattery;
  // const load = b.load;

  return {
    // voltage: vcc != null ? vcc / 1000 : null,
    // servo: vservo != null ? vservo / 1000 : null,
    // remaining: b.battery_remaining ?? b.remaining ?? null,
    // raw: b,

    voltage: voltageBattery / 1000,
    current:
      currentBattery != null && currentBattery !== -1
        ? currentBattery / 100
        : null,
    remaining: batteryRemaining ? batteryRemaining : null,
  };
}

/* ----------------------------------------
   UI HELPERS
---------------------------------------- */

function Stat({ label, value, unit, accent }) {
  const colors = {
    cyan: "text-cyan-300",
    orange: "text-orange-300",
    green: "text-green-300",
    red: "text-red-400",
  };

  return (
    <div className="text-center">
      <p className="text-[11px] uppercase text-zinc-400 tracking-wide">
        {label}
      </p>

      <p className="font-mono text-base font-semibold text-white mt-1">
        {value ?? "—"} {unit}
      </p>

      <div className={`h-1 w-8 mx-auto mt-2 rounded-full ${colors[accent]}`} />
    </div>
  );
}

/* ----------------------------------------
   MAIN COMPONENT
---------------------------------------- */

export default function BatteryCard() {
  const raw = useTelemetryStore((s) => s.messages["PowerStatus"]?.data) ?? null;
  const batteryData =
    useTelemetryStore((s) => s.messages["SysStatus"]?.data) ?? null;

  // console.log("batteryData :", batteryData);
  // console.log("Raw :", raw);

  // const battery = normalizeBattery(raw);
  const battery = normalizeBattery(batteryData);

  const voltage = battery.voltage;
  const servo = battery.servo;
  const remaining = battery.remaining;
  const current = battery.current;
  let safeRemaining = remaining ?? 0;

  const isLow = safeRemaining < 25;
  const isCritical = safeRemaining < 10;
  if (safeRemaining === -1) {
    safeRemaining = "No Batteries";
  }
  return (
    <Card className="overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-xl">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            BATTERY
          </h2>
          <p className="text-sm text-zinc-400">
            Power System (FC + Servo Rail)
          </p>
        </div>

        <div
          className={`
            px-3 py-1 rounded-lg text-xs font-mono border
            ${
              isCritical
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : isLow
                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }
          `}
        >
          {/* {safeRemaining}% POWER */}
          {typeof safeRemaining === "number"
            ? `${safeRemaining} % Power`
            : safeRemaining}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-4 p-5 border-b border-zinc-800">
        <Stat
          label="Battery Voltage"
          value={voltage != null ? voltage.toFixed(2) : "—"}
          unit="V"
          accent="cyan"
        />

        <Stat
          label="Current"
          value={current != null ? current.toFixed(2) : "—"}
          unit="V"
          accent="orange"
        />

        <Stat
          label="Battery Left"
          value={safeRemaining}
          unit={typeof safeRemaining === "number" ?? "%"}
          accent="green"
        />
      </div>

      {/* OPTIONAL DEBUG */}
      {/* <div className="px-5 pb-4 text-[11px] text-zinc-600 font-mono">
        Vcc: {raw?.Vcc ?? "—"} | Vservo: {raw?.Vservo ?? "—"} | flags:{" "}
        {raw?.flags ?? "—"}
      </div> */}
    </Card>
  );
}
