import { useMemo } from "react";
import { Html, OrbitControls, Grid, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { useSimulationStore } from "../store/simulationStore";
import { calculateAntennaGeometry } from "../physics/antennaGeometry";

import Drone from "../components/simulation/Drone";
import GroundStation from "../components/simulation/GroundStation";
import RFLink from "../components/simulation/RFLink";
import RadiationPattern from "../components/simulation/RadiationPattern";
import RFCoverage from "../components/simulation/RFCoverage";

import type { RadiationPatternType } from "../physics/radiationPatterns";

interface RFSceneProps {
  selectedPattern: RadiationPatternType;
}

function formatDistance(distance: number): string {
  return distance >= 1000
    ? `${(distance / 1000).toFixed(2)} km`
    : `${distance.toFixed(1)} m`;
}

function DistanceLabel({
  from,
  to,
  distance,
}: {
  from: [number, number, number];
  to: [number, number, number];
  distance: number;
}) {
  const midpoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    (from[1] + to[1]) / 2 + 0.8,
    (from[2] + to[2]) / 2,
  ];

  return (
    <Html
      position={midpoint}
      center
      distanceFactor={12}
      style={{
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          background: "rgba(8, 18, 32, 0.92)",
          border: "1px solid #64748b",
          borderRadius: "7px",
          padding: "6px 10px",
          color: "white",
          fontSize: "12px",
        }}
      >
        Link distance: <strong>{formatDistance(distance)}</strong>
      </div>
    </Html>
  );
}

export default function RFScene({ selectedPattern }: RFSceneProps) {
  const {
    distance,
    altitude,
    groundStationHeight,
    droneAntennaHeightOffset,
    droneAntennaLengthMm,
    yaw,
    pitch,
    roll,
    frequencyMHz,
    setDistance,
    setAltitude,
    setYaw,
    setPitch,
    setRoll,
  } = useSimulationStore();

  const orientation: [number, number, number] = [
    THREE.MathUtils.degToRad(pitch),
    THREE.MathUtils.degToRad(yaw),
    THREE.MathUtils.degToRad(roll),
  ];

  const geometry = calculateAntennaGeometry({
    distanceMeters: distance,
    droneAltitudeMeters: altitude,
    droneAntennaHeightOffsetMeters: droneAntennaHeightOffset,
    groundAntennaHeightMeters: groundStationHeight,
    droneOrientationRadians: orientation,
  });

  const radiationParameters = useMemo(
    () => ({
      lengthMeters: droneAntennaLengthMm / 1000,
      frequencyHz: frequencyMHz * 1_000_000,
    }),
    [droneAntennaLengthMm, frequencyMHz],
  );

  return (
    <div className="rf-scene-container">
      <Canvas camera={{ position: [9, 7, 12], fov: 45 }}>
        <color attach="background" args={["#0c131d"]} />

        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 10, 5]} intensity={2} />

        <Stars radius={80} depth={40} count={700} factor={2} fade />

        <Drone position={geometry.dronePosition} orientation={orientation} />

        <GroundStation
          position={geometry.groundStationPosition}
          antennaHeightMeters={groundStationHeight}
        />

        <RFLink
          from={geometry.droneAntennaPosition}
          to={geometry.groundAntennaPosition}
        />

        <DistanceLabel
          from={geometry.droneAntennaPosition}
          to={geometry.groundAntennaPosition}
          distance={geometry.antennaSeparationMeters}
        />

        <RFCoverage
          pattern={selectedPattern}
          position={geometry.droneAntennaPosition}
          orientation={orientation}
          radiationParameters={radiationParameters}
        />

        <RadiationPattern
          pattern={selectedPattern}
          position={geometry.droneAntennaPosition}
          radius={2.5}
          orientation={orientation}
          radiationParameters={radiationParameters}
        />

        <Grid
          args={[100, 100]}
          position={[0, -0.1, 0]}
          cellSize={1}
          cellThickness={0.6}
          sectionSize={5}
          sectionThickness={1.2}
          fadeDistance={60}
          cellColor="#26394f"
          sectionColor="#38536e"
        />

        <OrbitControls makeDefault />
      </Canvas>

      <div
        className="scene-controls"
        onPointerDown={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="scene-control-header">
          <span>DRONE POSITION</span>
          <span className="live-indicator">LIVE</span>
        </div>

        <label>
          <span>Distance</span>
          <strong>{distance} m</strong>
        </label>
        <input
          type="range"
          min="2"
          max="30"
          step="1"
          value={distance}
          onChange={(event) => setDistance(Number(event.target.value))}
        />

        <label>
          <span>Altitude</span>
          <strong>{altitude} m</strong>
        </label>
        <input
          type="range"
          min="2"
          max="30"
          step="1"
          value={altitude}
          onChange={(event) => setAltitude(Number(event.target.value))}
        />

        <label>
          <span>Yaw</span>
          <strong>{yaw}°</strong>
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          step="5"
          value={yaw}
          onChange={(event) => setYaw(Number(event.target.value))}
        />

        <label>
          <span>Pitch</span>
          <strong>{pitch}°</strong>
        </label>
        <input
          type="range"
          min="-90"
          max="90"
          step="5"
          value={pitch}
          onChange={(event) => setPitch(Number(event.target.value))}
        />

        <label>
          <span>Roll</span>
          <strong>{roll}°</strong>
        </label>
        <input
          type="range"
          min="-90"
          max="90"
          step="5"
          value={roll}
          onChange={(event) => setRoll(Number(event.target.value))}
        />
      </div>
    </div>
  );
}
