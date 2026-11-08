
import { useMemo } from "react";
import * as THREE from "three";

import {
  calculateRadiation,
  type RadiationPatternType,
  type RadiationParameters,
} from "../../physics/radiationPatterns";

interface RadiationPatternProps {
  pattern: RadiationPatternType;
  position: [number, number, number];
  radius?: number;
  orientation: [number, number, number];
  radiationParameters?: RadiationParameters;
}

function getRadiationColor(
  strength: number,
  maxStrength: number,
): THREE.Color {
  const normalizedPower =
    maxStrength > 0 ? strength / maxStrength : 0;

  const db =
    normalizedPower > 0
      ? 10 * Math.log10(normalizedPower)
      : -30;

  const clippedDb = THREE.MathUtils.clamp(db, -30, 0);
  const intensity = (clippedDb + 30) / 30;
  const hue = 0.66 * (1 - intensity);

  return new THREE.Color().setHSL(hue, 1, 0.5);
}

export default function RadiationPattern({
  pattern,
  position,
  radius = 2.5,
  orientation,
  radiationParameters,
}: RadiationPatternProps) {
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const thetaSegments = 72;
    const phiSegments = 96;

    const radiationValues: {
      theta: number;
      phi: number;
      power: number;
    }[] = [];

    let maxPower = 0;

    for (let i = 0; i <= thetaSegments; i++) {
      const theta = (i / thetaSegments) * Math.PI;

      for (let j = 0; j <= phiSegments; j++) {
        const phi = (j / phiSegments) * Math.PI * 2;

        const power = Math.max(
          0,
          calculateRadiation(
            pattern,
            theta,
            phi,
            radiationParameters,
          ),
        );

        radiationValues.push({ theta, phi, power });
        maxPower = Math.max(maxPower, power);
      }
    }

    for (const { theta, phi, power } of radiationValues) {
      const normalizedPower =
        maxPower > 0 ? power / maxPower : 0;

      // Radius represents normalized electric-field amplitude.
      const fieldAmplitude = Math.sqrt(normalizedPower);
      const r = radius * fieldAmplitude;

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.cos(theta);
      const z = r * Math.sin(theta) * Math.sin(phi);

      vertices.push(x, y, z);

      const color = getRadiationColor(power, maxPower);
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

    const result = new THREE.BufferGeometry();

    result.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );

    result.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );

    result.setIndex(indices);
    result.computeVertexNormals();

    return result;
  }, [pattern, radius, radiationParameters]);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={orientation}
      renderOrder={2}
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.9}
        side={THREE.DoubleSide}
        roughness={0.4}
        metalness={0.05}
        emissive="#ffffff"
        emissiveIntensity={0.12}
        depthWrite={false}
      />
    </mesh>
  );
}
