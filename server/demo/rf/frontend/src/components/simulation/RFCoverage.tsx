import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

import { useSimulationStore } from "../../store/simulationStore";
import { calculateDirectionalGain } from "../../physics/linkBudget";

import type {
  RadiationPatternType,
  RadiationParameters,
} from "../../physics/radiationPatterns";

interface RFCoverageProps {
  pattern: RadiationPatternType;
  position: [number, number, number];
  orientation: [number, number, number];
  radiationParameters: RadiationParameters;
}

// Free-space path loss constant for MHz and kilometres.
const FSPL_CONSTANT = 32.44;

// Keep the visible coverage surface inside the current 3D scene.
// The actual calculated range is NOT capped.
const MAX_VISUAL_RADIUS = 30;

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }

  return `${distanceMeters.toFixed(1)} m`;
}

export default function RFCoverage({
  pattern,
  position,
  orientation,
  radiationParameters,
}: RFCoverageProps) {
  const {
    txPowerDbm,
    frequencyMHz,
    droneAntennaGainDbi,
    groundAntennaGainDbi,
    receiverSensitivityDbm,
    txCableLossDb,
    txConnectorLossDb,
    rxCableLossDb,
    rxConnectorLossDb,
    additionalLossesDb,
  } = useSimulationStore();

  const result = useMemo(() => {
    if (
      !Number.isFinite(frequencyMHz) ||
      frequencyMHz <= 0 ||
      !Number.isFinite(receiverSensitivityDbm)
    ) {
      return null;
    }

    const geometry = new THREE.BufferGeometry();

    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const thetaSegments = 36;
    const phiSegments = 72;

    const rotation = new THREE.Euler(
      orientation[0],
      orientation[1],
      orientation[2],
      "XYZ",
    );

    const totalLosses =
      txCableLossDb +
      txConnectorLossDb +
      rxCableLossDb +
      rxConnectorLossDb +
      additionalLossesDb;

    let maximumRangeMeters = 0;
    let maximumVisualRadius = 0;

    const ranges: number[] = [];

    for (let i = 0; i <= thetaSegments; i++) {
      const theta = (i / thetaSegments) * Math.PI;

      for (let j = 0; j <= phiSegments; j++) {
        const phi = (j / phiSegments) * Math.PI * 2;

        // Direction in the antenna's local coordinate system.
        const localDirection = new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi),
        );

        // Convert that direction into world coordinates.
        const worldDirection = localDirection
          .clone()
          .applyEuler(rotation)
          .normalize();

        const targetPosition = new THREE.Vector3(...position).add(
          worldDirection,
        );

        const droneGain = calculateDirectionalGain({
          pattern,
          peakGainDbi: droneAntennaGainDbi,
          antennaPosition: position,
          targetPosition: [
            targetPosition.x,
            targetPosition.y,
            targetPosition.z,
          ],
          orientation,
          radiationParameters,
        });

        // First version assumes the ground antenna receives
        // with its peak gain in every direction.
        const groundGain = groundAntennaGainDbi;

        // Maximum path loss allowed before received power
        // drops below receiver sensitivity.
        const maximumAllowedPathLoss =
          txPowerDbm +
          droneGain +
          groundGain -
          totalLosses -
          receiverSensitivityDbm;

        // Invert the free-space path loss equation.
        const rangeKm = Math.pow(
          10,
          (maximumAllowedPathLoss -
            FSPL_CONSTANT -
            20 * Math.log10(frequencyMHz)) /
            20,
        );

        const rangeMeters = Number.isFinite(rangeKm)
          ? Math.max(0, rangeKm * 1000)
          : 0;

        ranges.push(rangeMeters);

        maximumRangeMeters = Math.max(maximumRangeMeters, rangeMeters);

        // Compress only the displayed geometry, not the calculated range.
        const visualRadius = Math.min(rangeMeters, MAX_VISUAL_RADIUS);

        maximumVisualRadius = Math.max(maximumVisualRadius, visualRadius);

        const vertex = localDirection.multiplyScalar(visualRadius);

        vertices.push(vertex.x, vertex.y, vertex.z);
      }
    }

    // Colour the surface according to its relative coverage distance.
    const maxRange = Math.max(maximumRangeMeters, 1);

    for (const range of ranges) {
      const normalized = THREE.MathUtils.clamp(range / maxRange, 0, 1);

      const color = new THREE.Color().setHSL(
        0.02 + normalized * 0.3,
        0.95,
        0.48,
      );

      colors.push(color.r, color.g, color.b);
    }

    for (let i = 0; i < thetaSegments; i++) {
      for (let j = 0; j < phiSegments; j++) {
        const a = i * (phiSegments + 1) + j;
        const b = a + phiSegments + 1;

        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return {
      geometry,
      maximumRangeMeters,
      maximumVisualRadius,
    };
  }, [
    pattern,
    position,
    orientation,
    radiationParameters,
    txPowerDbm,
    frequencyMHz,
    droneAntennaGainDbi,
    groundAntennaGainDbi,
    receiverSensitivityDbm,
    txCableLossDb,
    txConnectorLossDb,
    rxCableLossDb,
    rxConnectorLossDb,
    additionalLossesDb,
  ]);

  if (!result) {
    return null;
  }

  return (
    <group position={position}>
      <mesh geometry={result.geometry} renderOrder={1}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.5}
        />
      </mesh>

      <Html
        position={[0, result.maximumVisualRadius + 1, 0]}
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
            border: "1px solid #38bdf8",
            borderRadius: "8px",
            padding: "7px 11px",
            color: "white",
            fontSize: "12px",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#7dd3fc", fontSize: "10px" }}>
            MAX RF COVERAGE
          </div>
          <strong>{formatDistance(result.maximumRangeMeters)}</strong>
        </div>
      </Html>
    </group>
  );
}
