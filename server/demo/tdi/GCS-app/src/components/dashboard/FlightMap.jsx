// import { useState, useEffect, useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMap,
//   useMapEvents,
//   Polyline,
// } from "react-leaflet";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { useTelemetryStore } from "@/store/telemetryStore";
// import L from "leaflet";
// import { Navigation, Navigation2 } from "lucide-react";

// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// let DefaultIcon = L.icon({
//   iconUrl: markerIcon,
//   shadowUrl: markerShadow,
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });

// L.Marker.prototype.options.icon = DefaultIcon;

// const layers = {
//   street: {
//     name: "Normal",
//     url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
//     attribution: "© OpenStreetMap",
//   },
//   satellite: {
//     name: "Satellite",
//     url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
//     attribution: "Tiles © Esri",
//   },
// };

// const WORLD_CENTER = [20.59, 78.96];

// function MapRecenter({ position }) {
//   const map = useMap();
//   const hasCentered = useRef(false);

//   useEffect(() => {
//     if (position && !hasCentered.current) {
//       map.flyTo(position, 14, { animate: true, duration: 1.5 });
//       hasCentered.current = true;
//     }
//     if (!position) {
//       hasCentered.current = false;
//       map.flyTo([20.59, 78.96], 5, { animate: true, duration: 1.5 });
//     }
//   }, [position, map]);

//   return null;
// }

// function MapTypeControl({ activeLayer, setActiveLayer, layers }) {
//   return (
//     <div className="leaflet-top leaflet-right m-4!">
//       <div className="leaflet-control flex gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-2xl pointer-events-auto">
//         {Object.entries(layers).map(([key, l]) => (
//           <button
//             key={key}
//             onClick={(e) => {
//               e.stopPropagation();
//               setActiveLayer(key);
//             }}
//             className={`rounded-md px-3 py-1 text-sm font-mono border transition ${
//               activeLayer === key
//                 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
//                 : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
//             }`}
//           >
//             {l.name}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }

// // NEW COMPONENT: Intercepts clicks on the map layer for Guided Mode routing actions
// function MapClickHandler({ onMapClick }) {
//   useMapEvents({
//     click(e) {
//       onMapClick(e.latlng.lat, e.latlng.lng);
//     },
//   });
//   return null;
// }

// export default function FlightMap() {
//   const [activeLayer, setActiveLayer] = useState("street");
//   const layer = layers[activeLayer];
//   const [activeTarget, setActiveTarget] = useState(null);
//   const [flightPath, setFlightPath] = useState([]);

//   const connectionState = useTelemetryStore((s) => s.connectionState);
//   const gpsRaw = useTelemetryStore((s) => s.messages["GPS_RAW_INT"]?.data);
//   const globalPos = useTelemetryStore(
//     (s) => s.messages["GlobalPositionInt"]?.data,
//   );

//   // Guided routing states
//   const [targetPoint, setTargetPoint] = useState(null); // { lat, lon }
//   const [targetAlt, setTargetAlt] = useState(15); // Default cruise altitude in meters

//   const isConnected = connectionState === "CONNECTED";

//   let dronePosition = null;
//   if (isConnected) {
//     if (globalPos?.lat && globalPos?.lon) {
//       dronePosition = [globalPos.lat / 1e7, globalPos.lon / 1e7];
//     } else if (gpsRaw?.lat && gpsRaw?.lon) {
//       dronePosition = [gpsRaw.lat / 1e7, gpsRaw.lon / 1e7];
//     }
//   }

//   const handleMapClick = (lat, lng) => {
//     if (!isConnected) return;
//     // Open the interaction drawer containing altitude selection validation options
//     setTargetPoint({ lat, lon: lng });
//   };

//   // const executeGuidedFlight = () => {
//   //   if (!targetPoint || !isConnected) return;
//   //   const rawRelativeAlt =
//   //     globalPos?.relative_alt ?? globalPos?.relativeAlt ?? 0;
//   //   const relativeAltMeters = rawRelativeAlt / 1000;
//   //   const isAirborne = relativeAltMeters > 1.5;

//   //   window.electron?.flightCommand("GUIDED", {
//   //     lat: targetPoint.lat,
//   //     lon: targetPoint.lon,
//   //     alt: Number(targetAlt),
//   //     isAirborne: isAirborne,
//   //   });

//   //   // Clear target point state once sent down to the autopilot pipeline
//   //   setTargetPoint(null);
//   // };

//   const executeGuidedFlight = () => {
//     if (!targetPoint || !isConnected) return;

//     const rawRelativeAlt =
//       globalPos?.relative_alt ?? globalPos?.relativeAlt ?? 0;

//     const relativeAltMeters = rawRelativeAlt / 1000;
//     const isAirborne = relativeAltMeters > 1.5;

//     const target = {
//       lat: targetPoint.lat,
//       lon: targetPoint.lon,
//       alt: Number(targetAlt),
//     };

//     setActiveTarget(target);

//     window.electron?.flightCommand("GUIDED", {
//       lat: target.lat,
//       lon: target.lon,
//       alt: target.alt,
//       isAirborne,
//     });

//     // Close the selection drawer,
//     // but DON'T forget the target.
//     setTargetPoint(null);
//   };

//   const distanceSquared = (a, b) => {
//     const dLat = a[0] - b[0];
//     const dLon = a[1] - b[1];

//     return dLat * dLat + dLon * dLon;
//   };

//   useEffect(() => {
//     if (!dronePosition) return;

//     setFlightPath((previousPath) => {
//       const last = previousPath[previousPath.length - 1];

//       if (last && distanceSquared(last, dronePosition) < 0.00000001) {
//         return previousPath;
//       }

//       return [...previousPath, dronePosition];
//     });
//   }, [dronePosition?.[0], dronePosition?.[1]]);

//   const mapCenter = dronePosition ?? WORLD_CENTER;
//   // console.log("gloalPos :", globalPos);

//   return (
//     <Card className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
//       <div className="h-[70vh] w-full relative">
//         <MapContainer
//           center={mapCenter}
//           zoom={dronePosition ? 14 : 5}
//           minZoom={2}
//           maxZoom={18}
//           className="h-full w-full outline-none"
//           scrollWheelZoom={true}
//         >
//           <MapRecenter position={dronePosition} />

//           <MapTypeControl
//             activeLayer={activeLayer}
//             setActiveLayer={setActiveLayer}
//             layers={layers}
//           />

//           {/* Connect map clicking triggers directly into state handlers */}
//           <MapClickHandler onMapClick={handleMapClick} />

//           <TileLayer
//             key={activeLayer}
//             url={layer.url}
//             attribution={layer.attribution}
//           />

//           {flightPath.length > 1 && (
//             <Polyline
//               positions={flightPath}
//               pathOptions={{
//                 color: "#10b981",
//                 weight: 4,
//                 opacity: 0.9,
//               }}
//             />
//           )}

//           {dronePosition && (
//             <Marker position={dronePosition}>
//               <Popup>
//                 <div className="text-zinc-900 font-sans p-1">
//                   <p className="font-bold border-b pb-1 mb-1">
//                     Drone Telemetry
//                   </p>
//                   <p className="text-xs font-mono">
//                     Lat: {dronePosition[0].toFixed(6)}
//                   </p>
//                   <p className="text-xs font-mono">
//                     Lon: {dronePosition[1].toFixed(6)}
//                   </p>
//                 </div>
//               </Popup>
//             </Marker>
//           )}

//           {/* Visual Indicator of the user's clicked destination target position */}
//           {activeTarget && (
//             <Marker
//               position={[activeTarget.lat, activeTarget.lon]}
//               icon={L.icon({
//                 iconUrl: markerIcon,
//                 className: "hue-rotate-[140deg] saturate-200",
//               })}
//             >
//               <Popup>
//                 <div className="text-zinc-900">
//                   <strong>Guided Target</strong>
//                   <div>Lat: {activeTarget.lat.toFixed(6)}</div>
//                   <div>Lon: {activeTarget.lon.toFixed(6)}</div>
//                   <div>Alt: {activeTarget.alt} m</div>
//                 </div>
//               </Popup>
//             </Marker>
//           )}

//           {activeTarget && (
//             <Marker
//               position={[activeTarget.lat, activeTarget.lon]}
//               icon={L.icon({
//                 iconUrl: markerIcon,
//                 className: "hue-rotate-[140deg] saturate-200",
//               })}
//             >
//               <Popup>
//                 <div className="text-zinc-900">
//                   <strong>Guided Target</strong>
//                   <div>Lat: {activeTarget.lat.toFixed(6)}</div>
//                   <div>Lon: {activeTarget.lon.toFixed(6)}</div>
//                   <div>Alt: {activeTarget.alt} m</div>
//                 </div>
//               </Popup>
//             </Marker>
//           )}
//         </MapContainer>

//         {/* Dynamic Guided Interaction Drawer Overlaid on top of Map Canvas view */}
//         {targetPoint && (
//           <div className="absolute top-4 left-4 z-1000 bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-70 text-white backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
//             <div>
//               <h3 className="text-sm font-bold tracking-wide text-zinc-200 flex items-center gap-1.5">
//                 <Navigation size={14} className="text-emerald-400 rotate-45" />
//                 Guided Target Selected
//               </h3>
//               <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
//                 Lat: {targetPoint.lat.toFixed(6)} | Lon:{" "}
//                 {targetPoint.lon.toFixed(6)}
//               </p>
//             </div>

//             <div className="flex flex-col gap-1">
//               <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
//                 Target Hover Altitude (Meters):
//               </label>
//               <div className="flex items-center gap-2">
//                 <input
//                   type="number"
//                   min="1" // Changed from 2 to 1
//                   max="120"
//                   // Displays empty box instead of 0 so you can backspace cleanly
//                   value={targetAlt === 0 ? "" : targetAlt}
//                   // Allows typing any character/digit smoothly without instant blocking
//                   onChange={(e) => setTargetAlt(Number(e.target.value))}
//                   // Enforces the 1 to 120 limit ONLY when the user clicks away
//                   onBlur={(e) => {
//                     const val = Number(e.target.value);
//                     setTargetAlt(Math.min(120, Math.max(1, val))); // Changed min to 1 here too
//                   }}
//                   className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono w-24 text-emerald-400 font-bold focus:outline-none focus:border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
//                 />
//                 <span className="text-xs text-zinc-500">meters AGL</span>
//               </div>
//             </div>

//             <div className="flex gap-2 mt-1">
//               <Button
//                 size="sm"
//                 onClick={executeGuidedFlight}
//                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
//               >
//                 <Navigation2 size={13} fill="currentColor" />
//                 Fly To Target
//               </Button>
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={() => setTargetPoint(null)}
//                 className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-xs"
//               >
//                 Cancel
//               </Button>
//             </div>
//           </div>
//         )}
//       </div>
//     </Card>
//   );
// }

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTelemetryStore } from "@/store/telemetryStore";
import L from "leaflet";
import { Navigation, Navigation2 } from "lucide-react";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* -------------------------------------------------------------------------- */
/*                                MAP ICONS                                   */
/* -------------------------------------------------------------------------- */

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const TargetIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "guided-target-marker",
});

const ActiveTargetIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  className: "guided-active-target-marker",
});

L.Marker.prototype.options.icon = DefaultIcon;

/* -------------------------------------------------------------------------- */
/*                                  LAYERS                                    */
/* -------------------------------------------------------------------------- */

const layers = {
  street: {
    name: "Normal",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap",
  },

  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri",
  },
};

/* -------------------------------------------------------------------------- */
/*                               CONSTANTS                                    */
/* -------------------------------------------------------------------------- */

const WORLD_CENTER = [20.59, 78.96];

// Minimum movement before adding another point to the breadcrumb path.
const MIN_PATH_DISTANCE_METERS = 2;

/* -------------------------------------------------------------------------- */
/*                           GEOGRAPHIC HELPERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Calculate approximate distance between two [lat, lon] positions.
 * Result is returned in meters.
 */
function distanceMeters(a, b) {
  if (!a || !b) return Infinity;

  const lat1 = a[0];
  const lon1 = a[1];
  const lat2 = b[0];
  const lon2 = b[1];

  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const aValue =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(aValue), Math.sqrt(1 - aValue));

  return R * c;
}

/* -------------------------------------------------------------------------- */
/*                              MAP RECENTER                                  */
/* -------------------------------------------------------------------------- */

function MapRecenter({ position }) {
  const map = useMap();

  const hasCentered = useRef(false);

  useEffect(() => {
    if (position && !hasCentered.current) {
      map.flyTo(position, 14, {
        animate: true,
        duration: 1.5,
      });

      hasCentered.current = true;
    }

    if (!position) {
      hasCentered.current = false;

      map.flyTo(WORLD_CENTER, 5, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [position, map]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                            MAP TYPE CONTROL                                */
/* -------------------------------------------------------------------------- */

function MapTypeControl({ activeLayer, setActiveLayer, layers }) {
  return (
    <div className="leaflet-top leaflet-right m-4!">
      <div className="leaflet-control flex gap-2 bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-2xl pointer-events-auto">
        {Object.entries(layers).map(([key, layer]) => (
          <button
            key={key}
            onClick={(e) => {
              e.stopPropagation();
              setActiveLayer(key);
            }}
            className={`rounded-md px-3 py-1 text-sm font-mono border transition ${
              activeLayer === key
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
            }`}
          >
            {layer.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            MAP CLICK HANDLER                               */
/* -------------------------------------------------------------------------- */

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

/* -------------------------------------------------------------------------- */
/*                              FLIGHT MAP                                    */
/* -------------------------------------------------------------------------- */

export default function FlightMap() {
  /* ------------------------------------------------------------------------ */
  /*                              MAP STATE                                   */
  /* ------------------------------------------------------------------------ */

  const [activeLayer, setActiveLayer] = useState("street");

  const layer = layers[activeLayer];

  /* ------------------------------------------------------------------------ */
  /*                         GUIDED TARGET STATE                              */
  /* ------------------------------------------------------------------------ */

  /**
   * targetPoint
   *
   * Temporary target selected by clicking on the map.
   *
   * It exists only while the target configuration drawer is open.
   */
  const [targetPoint, setTargetPoint] = useState(null);

  /**
   * activeTarget
   *
   * The latest target currently commanded to the vehicle.
   */
  const [activeTarget, setActiveTarget] = useState(null);

  /**
   * targetHistory
   *
   * Stores every target that has been sent during this map session.
   *
   * This prevents the previous red markers from disappearing when
   * another destination is selected.
   */
  const [targetHistory, setTargetHistory] = useState([]);

  /**
   * Altitude is kept as a string while editing.
   *
   * This prevents NaN / controlled-input issues when the user
   * temporarily clears the input.
   */
  const [targetAlt, setTargetAlt] = useState("15");

  /* ------------------------------------------------------------------------ */
  /*                             FLIGHT PATH                                  */
  /* ------------------------------------------------------------------------ */

  /**
   * Actual GPS breadcrumb of the drone.
   *
   * IMPORTANT:
   * This contains only telemetry positions.
   * Target positions are NOT inserted here.
   */
  const [flightPath, setFlightPath] = useState([]);

  /* ------------------------------------------------------------------------ */
  /*                            TELEMETRY                                     */
  /* ------------------------------------------------------------------------ */

  const connectionState = useTelemetryStore((s) => s.connectionState);

  const gpsRaw = useTelemetryStore((s) => s.messages["GPS_RAW_INT"]?.data);

  const globalPos = useTelemetryStore(
    (s) => s.messages["GlobalPositionInt"]?.data,
  );

  const isConnected = connectionState === "CONNECTED";

  /* ------------------------------------------------------------------------ */
  /*                         DRONE POSITION                                   */
  /* ------------------------------------------------------------------------ */

  let dronePosition = null;

  if (isConnected) {
    const hasGlobalPosition =
      globalPos?.lat !== undefined &&
      globalPos?.lat !== null &&
      globalPos?.lon !== undefined &&
      globalPos?.lon !== null &&
      Number.isFinite(Number(globalPos.lat)) &&
      Number.isFinite(Number(globalPos.lon));

    const hasGpsPosition =
      gpsRaw?.lat !== undefined &&
      gpsRaw?.lat !== null &&
      gpsRaw?.lon !== undefined &&
      gpsRaw?.lon !== null &&
      Number.isFinite(Number(gpsRaw.lat)) &&
      Number.isFinite(Number(gpsRaw.lon));

    if (hasGlobalPosition) {
      dronePosition = [
        Number(globalPos.lat) / 1e7,
        Number(globalPos.lon) / 1e7,
      ];
    } else if (hasGpsPosition) {
      dronePosition = [Number(gpsRaw.lat) / 1e7, Number(gpsRaw.lon) / 1e7];
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                        OPTIONAL DEBUG LOG                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (dronePosition) {
      console.log(
        "[FlightMap] Drone position:",
        dronePosition[0],
        dronePosition[1],
      );
    } else if (isConnected) {
      console.warn(
        "[FlightMap] Connected, but no valid GPS position is available.",
      );
    }
  }, [dronePosition?.[0], dronePosition?.[1], isConnected]);

  /* ------------------------------------------------------------------------ */
  /*                          MAP CLICK                                       */
  /* ------------------------------------------------------------------------ */

  const handleMapClick = (lat, lng) => {
    if (!isConnected) return;

    setTargetPoint({
      lat,
      lon: lng,
    });
  };

  /* ------------------------------------------------------------------------ */
  /*                      EXECUTE GUIDED FLIGHT                               */
  /* ------------------------------------------------------------------------ */

  const executeGuidedFlight = () => {
    if (!targetPoint || !isConnected) {
      return;
    }

    /* ---------------------------------------------------------------------- */
    /*                         VALIDATE ALTITUDE                              */
    /* ---------------------------------------------------------------------- */

    const parsedAltitude = Number(targetAlt);

    if (
      !Number.isFinite(parsedAltitude) ||
      parsedAltitude < 1 ||
      parsedAltitude > 120
    ) {
      setTargetAlt("15");
      return;
    }

    /* ---------------------------------------------------------------------- */
    /*                         CURRENT ALTITUDE                               */
    /* ---------------------------------------------------------------------- */

    const rawRelativeAlt =
      globalPos?.relative_alt ?? globalPos?.relativeAlt ?? 0;

    const relativeAltMeters = Number(rawRelativeAlt) / 1000;

    const isAirborne =
      Number.isFinite(relativeAltMeters) && relativeAltMeters > 1.5;

    /* ---------------------------------------------------------------------- */
    /*                            CREATE TARGET                               */
    /* ---------------------------------------------------------------------- */

    const target = {
      id: `${Date.now()}-${targetPoint.lat}-${targetPoint.lon}`,

      lat: Number(targetPoint.lat),

      lon: Number(targetPoint.lon),

      alt: parsedAltitude,

      createdAt: Date.now(),
    };

    console.log("[FlightMap] Sending guided target:", target);

    /* ---------------------------------------------------------------------- */
    /*                    UPDATE TARGET VISUAL STATE                          */
    /* ---------------------------------------------------------------------- */

    // Latest commanded destination.
    setActiveTarget(target);

    // Preserve previous destinations on the map.
    setTargetHistory((previousTargets) => [...previousTargets, target]);

    /* ---------------------------------------------------------------------- */
    /*                         SEND TO BACKEND                                */
    /* ---------------------------------------------------------------------- */

    window.electron?.flightCommand("GUIDED", {
      lat: target.lat,
      lon: target.lon,
      alt: target.alt,
      isAirborne,
    });

    /* ---------------------------------------------------------------------- */
    /*                       CLOSE TARGET DRAWER                              */
    /* ---------------------------------------------------------------------- */

    setTargetPoint(null);
  };

  /* ------------------------------------------------------------------------ */
  /*                         FLIGHT PATH TRACKING                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!dronePosition) {
      return;
    }

    setFlightPath((previousPath) => {
      const lastPosition = previousPath[previousPath.length - 1];

      /*
       * Don't add another point when the drone has barely moved.
       *
       * This keeps the path from becoming thousands of points
       * long when telemetry arrives at a high frequency.
       */
      if (
        lastPosition &&
        distanceMeters(lastPosition, dronePosition) < MIN_PATH_DISTANCE_METERS
      ) {
        return previousPath;
      }

      return [...previousPath, [...dronePosition]];
    });
  }, [dronePosition?.[0], dronePosition?.[1]]);

  /* ------------------------------------------------------------------------ */
  /*                     CLEAR PATH WHEN DISCONNECTED                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!isConnected) {
      setFlightPath([]);
      setActiveTarget(null);
      setTargetHistory([]);
    }
  }, [isConnected]);

  /* ------------------------------------------------------------------------ */
  /*                            MAP CENTER                                    */
  /* ------------------------------------------------------------------------ */

  const mapCenter = dronePosition ?? WORLD_CENTER;

  /* ------------------------------------------------------------------------ */
  /*                               RENDER                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
      <div className="h-[70vh] w-full relative">
        <MapContainer
          center={mapCenter}
          zoom={dronePosition ? 14 : 5}
          minZoom={2}
          maxZoom={18}
          className="h-full w-full outline-none"
          scrollWheelZoom={true}
        >
          {/* ---------------------------------------------------------------- */}
          {/*                         MAP CONTROL                              */}
          {/* ---------------------------------------------------------------- */}

          <MapRecenter position={dronePosition} />

          <MapTypeControl
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            layers={layers}
          />

          <MapClickHandler onMapClick={handleMapClick} />

          {/* ---------------------------------------------------------------- */}
          {/*                          MAP TILE                                */}
          {/* ---------------------------------------------------------------- */}

          <TileLayer
            key={activeLayer}
            url={layer.url}
            attribution={layer.attribution}
          />

          {/* ---------------------------------------------------------------- */}
          {/*                       ACTUAL FLIGHT PATH                         */}
          {/* ---------------------------------------------------------------- */}

          {flightPath.length > 1 && (
            <Polyline
              positions={flightPath}
              pathOptions={{
                color: "#10b981",
                weight: 4,
                opacity: 0.9,
              }}
            />
          )}

          {/* ---------------------------------------------------------------- */}
          {/*                  PLANNED ROUTE TO ACTIVE TARGET                  */}
          {/* ---------------------------------------------------------------- */}

          {dronePosition && activeTarget && (
            <Polyline
              positions={[dronePosition, [activeTarget.lat, activeTarget.lon]]}
              pathOptions={{
                color: "#facc15",
                weight: 3,
                opacity: 0.8,
                dashArray: "8 8",
              }}
            />
          )}

          {/* ---------------------------------------------------------------- */}
          {/*                         DRONE MARKER                             */}
          {/* ---------------------------------------------------------------- */}

          {dronePosition && (
            <Marker
              position={dronePosition}
              icon={DefaultIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-zinc-900 font-sans p-1">
                  <p className="font-bold border-b pb-1 mb-1">
                    Drone Telemetry
                  </p>

                  <p className="text-xs font-mono">
                    Lat: {dronePosition[0].toFixed(6)}
                  </p>

                  <p className="text-xs font-mono">
                    Lon: {dronePosition[1].toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ---------------------------------------------------------------- */}
          {/*                    PREVIOUS TARGET MARKERS                       */}
          {/* ---------------------------------------------------------------- */}

          {targetHistory.map((target) => {
            const isCurrentTarget = activeTarget?.id === target.id;

            /*
             * The active target gets a larger marker.
             *
             * Previous targets stay on the map but are visually
             * less prominent.
             */
            if (isCurrentTarget) {
              return null;
            }

            return (
              <Marker
                key={target.id}
                position={[target.lat, target.lon]}
                icon={TargetIcon}
              >
                <Popup>
                  <div className="text-zinc-900">
                    <strong>Previous Guided Target</strong>

                    <div>Lat: {target.lat.toFixed(6)}</div>

                    <div>Lon: {target.lon.toFixed(6)}</div>

                    <div>Alt: {target.alt} m</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ---------------------------------------------------------------- */}
          {/*                     CURRENT TARGET MARKER                       */}
          {/* ---------------------------------------------------------------- */}

          {activeTarget && (
            <Marker
              position={[activeTarget.lat, activeTarget.lon]}
              icon={ActiveTargetIcon}
              zIndexOffset={500}
            >
              <Popup>
                <div className="text-zinc-900">
                  <strong>Active Guided Target</strong>

                  <div>Lat: {activeTarget.lat.toFixed(6)}</div>

                  <div>Lon: {activeTarget.lon.toFixed(6)}</div>

                  <div>Alt: {activeTarget.alt} m</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ---------------------------------------------------------------- */}
          {/*                       CURRENT SELECTION                          */}
          {/* ---------------------------------------------------------------- */}

          {targetPoint && (
            <Marker
              position={[targetPoint.lat, targetPoint.lon]}
              icon={TargetIcon}
              zIndexOffset={300}
            >
              <Popup>
                <div className="text-zinc-900">
                  <strong>Selected Target</strong>

                  <div>Lat: {targetPoint.lat.toFixed(6)}</div>

                  <div>Lon: {targetPoint.lon.toFixed(6)}</div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* ------------------------------------------------------------------ */}
        {/*                    GUIDED TARGET DRAWER                            */}
        {/* ------------------------------------------------------------------ */}

        {targetPoint && (
          <div className="absolute top-4 left-4 z-1000 bg-zinc-950/95 border border-zinc-800 p-4 rounded-xl shadow-2xl flex flex-col gap-3 min-w-70 text-white backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* -------------------------------------------------------------- */}
            {/*                         HEADER                                 */}
            {/* -------------------------------------------------------------- */}

            <div>
              <h3 className="text-sm font-bold tracking-wide text-zinc-200 flex items-center gap-1.5">
                <Navigation size={14} className="text-emerald-400 rotate-45" />
                Guided Target Selected
              </h3>

              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                Lat: {targetPoint.lat.toFixed(6)} | Lon:{" "}
                {targetPoint.lon.toFixed(6)}
              </p>
            </div>

            {/* -------------------------------------------------------------- */}
            {/*                         ALTITUDE                               */}
            {/* -------------------------------------------------------------- */}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wider">
                Target Hover Altitude (Meters):
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={targetAlt}
                  onChange={(e) => {
                    setTargetAlt(e.target.value);
                  }}
                  onBlur={() => {
                    const value = Number(targetAlt);

                    if (!Number.isFinite(value)) {
                      setTargetAlt("15");
                      return;
                    }

                    const clampedValue = Math.min(120, Math.max(1, value));

                    setTargetAlt(String(clampedValue));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeGuidedFlight();
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-sm font-mono w-24 text-emerald-400 font-bold focus:outline-none focus:border-zinc-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <span className="text-xs text-zinc-500">meters AGL</span>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/*                           BUTTONS                              */}
            {/* -------------------------------------------------------------- */}

            <div className="flex gap-2 mt-1">
              <Button
                size="sm"
                onClick={executeGuidedFlight}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
              >
                <Navigation2 size={13} fill="currentColor" />
                Fly To Target
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setTargetPoint(null)}
                className="border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                       DISCONNECTED MESSAGE                         */}
        {/* ------------------------------------------------------------------ */}

        {!isConnected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1000">
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-lg px-4 py-2 shadow-xl backdrop-blur-sm">
              <p className="text-xs font-mono text-zinc-400">
                Waiting for vehicle connection...
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
