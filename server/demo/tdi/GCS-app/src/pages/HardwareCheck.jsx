import React from "react";
import { useHardWareStore } from "@/store/hardwareCheckStore";
import {
  CheckCircle2,
  AlertCircle,
  Cpu,
  ShieldCheck,
  Activity,
} from "lucide-react";

const HardwareCheck = () => {
  const status = useHardWareStore((state) => state.hardwareStatus);
  // console.log("Logging the Complete status obj: ", status);
  const checks = status?.checks || {};

  return (
    <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <ShieldCheck size={32} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Hardware Check
            </h2>
            <p className="text-slate-400 text-base">
              Monitoring hardware sensor
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Global State
          </span>
          <div
            className={`px-6 py-2 rounded-lg text-sm font-black uppercase tracking-widest border-2 shadow-lg ${
              status?.isHealthy
                ? "bg-green-500/10 text-green-400 border-green-500/30 shadow-green-500/5"
                : "bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/5"
            }`}
          >
            {status?.systemStatus || "OFFLINE"}
          </div>
        </div>
      </div>

      {/* Sensor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {Object.entries(checks).map(([name, detail]) => (
          <div
            key={name}
            className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800/50 hover:border-slate-600 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-700">
                  <Cpu size={24} className="text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-200 leading-tight">
                  {name}
                </h4>
              </div>
              {detail.healthy ? (
                <CheckCircle2
                  size={28}
                  className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                />
              ) : (
                <AlertCircle
                  size={28}
                  className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                />
              )}
            </div>

            {/* Status Section */}
            <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 mb-6">
              <div className="text-[14px] uppercase tracking-[0.2em] font-black text-slate-500 mb-1">
                Current Status
              </div>
              <div
                className={`text-2xl font-black tracking-tight ${detail.healthy ? "text-white" : "text-red-400"}`}
              >
                {detail.status}
              </div>
            </div>

            {/* Detailed Flags */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 p-3 bg-slate-950/30 rounded-lg border border-slate-800">
                <span className="text-[14px] uppercase font-bold text-slate-500">
                  Presence
                </span>
                <span
                  className={`text-xs font-bold ${detail.present ? "text-slate-300" : "text-red-500"}`}
                >
                  {detail.present ? "CONNECTED" : "MISSING"}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-slate-950/30 rounded-lg border border-slate-800">
                <span className="text-[14px] uppercase font-bold text-slate-500">
                  Operation
                </span>
                <span
                  className={`text-xs font-bold ${detail.enabled ? "text-blue-400" : "text-slate-600"}`}
                >
                  {detail.enabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HardwareCheck;
