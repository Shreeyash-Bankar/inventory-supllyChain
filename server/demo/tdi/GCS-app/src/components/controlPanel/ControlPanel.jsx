import { useState } from "react";
import Tabs from "./Tabs";
import QuickActions from "./QuickActions";
import MissionPlanner from "./MissionPlanner";

export default function ControlPanel() {
  const [tab, setTab] = useState("quick");

  return (
    <div className="w-1/3 h-full border-r border-zinc-200 backdrop-blur-xl flex flex-col">
      {/* HEADER */}
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-800">CONTROL PANEL</h1>
        <p className="text-xs text-zinc-500">Drone Operations</p>
      </div>

      {/* TABS */}
      <Tabs tab={tab} setTab={setTab} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "quick" && <QuickActions />}
        {tab === "mission" && <MissionPlanner />}
      </div>
    </div>
  );
}
