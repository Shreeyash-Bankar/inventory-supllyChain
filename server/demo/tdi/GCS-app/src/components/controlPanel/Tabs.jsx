export default function Tabs({ tab, setTab }) {
  return (
    <div className="flex border-b border-zinc-800">
      <button
        onClick={() => setTab("quick")}
        className={`flex-1 py-3 text-xs transition ${
          tab === "quick"
            ? "text-white border-b-2 border-cyan-400 bg-black"
            : "text-zinc-400 hover:text-black"
        }`}
      >
        Quick
      </button>

      <button
        onClick={() => setTab("mission")}
        className={`flex-1 py-3 text-xs transition ${
          tab === "mission"
            ? "text-white border-b-2 border-cyan-400 bg-black"
            : "text-zinc-400 hover:text-black"
        }`}
      >
        Mission
      </button>
    </div>
  );
}
