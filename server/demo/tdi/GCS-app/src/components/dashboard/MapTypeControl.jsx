import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Card } from "@/components/ui/card";

/* --- 1. THE CONTROL COMPONENT --- */
export function MapTypeControl({ activeLayer, setActiveLayer, layers }) {
  return (
    /* Leaflet classes 'leaflet-top' and 'leaflet-right' handle the positioning */
    <div className="leaflet-top leaflet-right !m-4">
      <div className="leaflet-control flex gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-2xl pointer-events-auto">
        {Object.entries(layers).map(([key, l]) => (
          <button
            key={key}
            onClick={(e) => {
              e.stopPropagation(); // Prevents map drag when clicking buttons
              setActiveLayer(key);
            }}
            className={`
              rounded-md px-3 py-1 text-sm font-mono border transition
              ${
                activeLayer === key
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
              }
            `}
          >
            {l.name}
          </button>
        ))}
      </div>
    </div>
  );
}
