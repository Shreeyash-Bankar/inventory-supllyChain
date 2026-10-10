import { Commands } from "@/api/commands";
import { Button } from "@/components/ui/button";

export default function FlightActions() {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={() => Commands.engineStart()}>Engine Start</Button>

      <Button onClick={() => Commands.missionStart()}>Mission Start</Button>

      <Button onClick={() => Commands.setMode("AUTO")}>Set AUTO Mode</Button>

      <Button onClick={() => Commands.rtl()}>RTL</Button>

      <Button variant="destructive" onClick={() => Commands.stop()}>
        STOP
      </Button>
    </div>
  );
}
