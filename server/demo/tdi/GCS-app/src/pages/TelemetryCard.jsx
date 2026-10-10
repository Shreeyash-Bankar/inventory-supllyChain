import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
export const TelemetryCard = memo(function TelemetryCard({
  type,
  payload,
  flashTime,
  formatValue,
  getAge,
}) {
  const data = payload.data;
  const updatedAt = payload.updatedAt;

  const isFlashing = flashTime && Date.now() - flashTime < 400;

  return (
    <Card
      className={`bg-gray-700 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]
      ${isFlashing ? "border-green-500 shadow-lg" : "hover:shadow-md"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2 items-center">
          <h3 className="font-semibold text-sm text-blue-200">{type}</h3>
          <Badge variant="secondary">{Object.keys(data || {}).length}</Badge>
        </div>

        <span className="text-xs text-muted-foreground">
          {getAge(updatedAt)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
        {Object.entries(data || {})
          .slice(0, 6)
          .map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted">{key}</span>
              <span className="font-mono text-blue-200">
                {formatValue(value)}
              </span>
            </div>
          ))}
      </div>

      <ScrollArea className="h-32 pr-2 border rounded-md p-2">
        <div className="space-y-1 text-xs">
          {Object.entries(data || {}).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b py-1">
              <span className="text-sidebar">{key}</span>
              <span className="font-mono text-blue-200">
                {formatValue(value)}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
});
