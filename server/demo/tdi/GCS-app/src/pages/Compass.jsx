import { useMemo } from "react";

export default function Compass({ heading = 0, size = 200 }) {
  const normalized = ((heading % 360) + 360) % 360;
  const radius = size / 2;

  const ticks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 360; i += 5) {
      arr.push({
        deg: i,
        major: i % 30 === 0,
        mid: i % 10 === 0,
      });
    }
    return arr;
  }, []);

  const getCardinal = (deg) => {
    return { 0: "N", 90: "E", 180: "S", 270: "W" }[deg] || null;
  };

  return (
    <div
      style={{ width: size, height: size }}
      className="relative rounded-full overflow-hidden bg-gradient-to-br from-slate-900 to-black border border-white/10 shadow-2xl"
    >
      {/* ROTATING RING */}
      <div
        className="absolute inset-0 will-change-transform transition-transform duration-200 ease-out"
        style={{ transform: `rotate(${-normalized}deg)` }}
      >
        {/* TICKS */}
        {ticks.map((t, i) => {
          const tickHeight = t.major ? 14 : t.mid ? 10 : 6;

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 origin-center"
              style={{
                transform: `rotate(${t.deg}deg) translateY(-${radius - 8}px)`,
              }}
            >
              <div
                style={{ height: tickHeight }}
                className={`w-[1.5px] rounded-full ${
                  t.major ? "bg-white" : t.mid ? "bg-white/70" : "bg-white/40"
                }`}
              />
            </div>
          );
        })}

        {/* CARDINALS */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 text-xs font-semibold tracking-widest text-white -translate-x-1/2 -translate-y-1/2"
            style={{
              transform: `
                rotate(${deg}deg)
                translateY(-${radius - 28}px)
                rotate(${-deg}deg)
              `,
            }}
          >
            {getCardinal(deg)}
          </div>
        ))}
      </div>

      {/* CENTER DOT */}
      {/* <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-white/20 border border-white/30" />
      </div> */}

      {/* POINTER */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[6px]">
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <div className="w-[2px] h-5 bg-gradient-to-b from-red-500 to-transparent mx-auto" />
      </div>

      {/* DEGREE DISPLAY */}
      <div className="absolute bottom-11 left-1/2 -translate-x-1/2">
        <div className="px-3 py-1 rounded-md bg-white/10 border border-white/10 text-xs font-mono text-white">
          {normalized.toFixed(0)}°
        </div>
      </div>
    </div>
  );
}
