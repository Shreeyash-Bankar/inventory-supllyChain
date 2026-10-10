export default function MissionPlanner() {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500">
        Mission Planning
      </h2>

      <div className="space-y-2">
        <button className="w-full btn-base">Add Waypoint</button>
        <button className="w-full btn-base">Clear Mission</button>
        <button className="w-full btn-cyan">Upload Mission</button>
      </div>

      <div className="mt-4 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-500">
        Mission timeline placeholder
      </div>
    </div>
  );
}
