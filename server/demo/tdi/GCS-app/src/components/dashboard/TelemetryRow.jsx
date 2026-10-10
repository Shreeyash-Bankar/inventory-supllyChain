export function TelemetryRow({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className="font-mono font-semibold">
        {value}
        {unit && <span className="text-muted-foreground ml-1">{unit}</span>}
      </span>
    </div>
  );
}
