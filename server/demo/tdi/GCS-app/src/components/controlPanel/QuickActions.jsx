import { Button } from "../ui/button";

export default function QuickActions() {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500">
        Flight Controls
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="bg-green-400 p-2 text-black"
          onClick={() => window.electron.flight.arm()}
        >
          ARM
        </Button>
        <Button
          className="bg-red-400 p-2 text-black"
          onClick={() => window.electron.flight.disarm()}
        >
          DISARM
        </Button>
        <Button
          className="bg-cyan-400 p-2 text-black"
          onClick={() => window.electron.flight.takeoff(10)}
        >
          TAKEOFF
        </Button>
        <Button
          className="bg-amber-400 p-2 text-black"
          onClick={() => window.electron.flight.land()}
        >
          LAND
        </Button>
        {/* <Button
          className="bg-amber-400 p-2 text-black"
          onClick={() => window.electron.flight.guided()}
        >
          GUIDED
        </Button>
        <Button
          className="bg-amber-400 p-2 text-black"
          onClick={() => window.electron.flight.stabilize()}
        >
          STABILIZE
        </Button> */}

        <button
          className="col-span-2 bg-violet-400 p-2"
          onClick={() => window.electron.flight.rtl()}
        >
          RTL
        </button>
      </div>
    </div>
  );
}
