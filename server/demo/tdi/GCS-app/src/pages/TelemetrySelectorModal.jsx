import { useMemo, useState } from "react";

export default function TelemetrySelectorModal({
  messages,
  selectedFields,
  onChange,
  onClose,
}) {
  const [search, setSearch] = useState("");

  const toggleField = (type, key) => {
    const exists = selectedFields.find((f) => f.type === type && f.key === key);

    if (exists) {
      onChange(
        selectedFields.filter((f) => !(f.type === type && f.key === key)),
      );
    } else {
      onChange([...selectedFields, { type, key }]);
    }
  };

  const allFields = useMemo(() => {
    const fields = [];

    Object.entries(messages).forEach(([type, payload]) => {
      Object.keys(payload.data || {}).forEach((key) => {
        fields.push({ type, key });
      });
    });

    return fields
      .sort((a, b) => a.key.localeCompare(b.key))
      .filter((f) =>
        `${f.type}.${f.key}`.toLowerCase().includes(search.toLowerCase()),
      );
  }, [messages, search]);

  return (
    // Dimmed backdrop with a soft blur effect
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1100 backdrop-blur-md">
      {/* MODAL CONTAINER - Modern Carbon Black */}
      <div className="bg-zinc-900 rounded-xl w-[720px] h-[80vh] flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] border border-zinc-800 font-mono">
        {/* HEADER */}
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/50 backdrop-blur-md rounded-t-xl">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Select Telemetry Fields
          </h2>

          <input
            type="text"
            placeholder="Search telemetry field (e.g. battery, roll, alt)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-3 w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-300
                       placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>

        {/* FIELD LIST */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/40">
          <div className="grid grid-cols-2 gap-3">
            {allFields.map(({ type, key }, i) => {
              const checked = selectedFields.some(
                (f) => f.type === type && f.key === key,
              );

              return (
                <label
                  key={i}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md
                             border transition-all duration-150 cursor-pointer text-xs
                             ${
                               checked
                                 ? "bg-zinc-900 border-emerald-500/40 shadow-[0_0_12px_-3px_rgba(16,185,129,0.1)]"
                                 : "bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700"
                             }`}
                >
                  <div>
                    <div
                      className={`font-bold tracking-wide transition-colors ${checked ? "text-emerald-400" : "text-zinc-300"}`}
                    >
                      {key}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-tight mt-0.5">
                      {type}
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleField(type, key)}
                    className="w-4 h-4 accent-emerald-500 rounded bg-zinc-950 border-zinc-800 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-zinc-800/60 bg-zinc-900 rounded-b-xl flex justify-between items-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            {selectedFields.length} fields selected
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-150"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
