export default function SelectedTelemetryPanel({
  selectedFields,
  messages,
  onRemove,
}) {
  const formatValue = (v) => {
    if (typeof v === "number") return v.toFixed(2);
    return String(v);
  };

  //  EMPTY STATE
  if (selectedFields.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 border rounded">
        No telemetry fields selected
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {selectedFields.map(({ type, key }, i) => {
        const value = messages[type]?.data?.[key];

        return (
          <div
            key={i}
            className="relative p-3 bg-black text-green-400 rounded shadow font-mono"
          >
            {/* ❌ REMOVE BUTTON */}
            <button
              onClick={() => onRemove(type, key)}
              className="absolute top-1 right-1 text-xs text-gray-400 hover:text-red-400"
            >
              ✕
            </button>

            {/* LABEL */}
            <div className="text-xs text-gray-400">
              {type}.{key}
            </div>

            {/* VALUE */}
            <div className="text-lg">
              {value !== undefined ? formatValue(value) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
