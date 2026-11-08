import * as THREE from "three";

import {
  calculateRadiation,
  type RadiationPatternType,
  type RadiationParameters,
} from "./radiationPatterns";

type Position3 = [number, number, number];

interface DirectionalGainInput {
  pattern: RadiationPatternType;
  peakGainDbi: number;
  antennaPosition: Position3;
  targetPosition: Position3;
  orientation: [number, number, number];
  radiationParameters?: RadiationParameters;
}

export function calculateDirectionalGain(input: DirectionalGainInput): number {
  const {
    pattern,
    peakGainDbi,
    antennaPosition,
    targetPosition,
    orientation,
    radiationParameters = {},
  } = input;

  const direction = new THREE.Vector3(
    targetPosition[0] - antennaPosition[0],
    targetPosition[1] - antennaPosition[1],
    targetPosition[2] - antennaPosition[2],
  );

  if (direction.lengthSq() === 0) {
    throw new Error("Antenna and target positions cannot be identical.");
  }

  direction.normalize();

  const rotation = new THREE.Euler(
    orientation[0],
    orientation[1],
    orientation[2],
    "XYZ",
  );

  const inverseRotation = new THREE.Quaternion()
    .setFromEuler(rotation)
    .invert();

  direction.applyQuaternion(inverseRotation);

  const theta = Math.acos(THREE.MathUtils.clamp(direction.y, -1, 1));

  const phi = Math.atan2(direction.z, direction.x);

  const powerRatio = calculateRadiation(
    pattern,
    theta,
    phi,
    radiationParameters,
  );

  return peakGainDbi + 10 * Math.log10(Math.max(powerRatio, 1e-12));
}

export function calculateFspl(
  distanceMeters: number,
  frequencyMHz: number,
): number {
  if (
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(frequencyMHz) ||
    distanceMeters <= 0 ||
    frequencyMHz <= 0
  ) {
    throw new Error("Distance and frequency must be positive finite numbers.");
  }

  const distanceKm = distanceMeters / 1000;

  return 32.44 + 20 * Math.log10(distanceKm) + 20 * Math.log10(frequencyMHz);
}

export function calculateReceivedPower(
  txPowerDbm: number,
  txGainDbi: number,
  rxGainDbi: number,
  pathLossDb: number,
  otherLossesDb = 0,
): number {
  return txPowerDbm + txGainDbi + rxGainDbi - pathLossDb - otherLossesDb;
}

export function calculateLinkMargin(
  receivedPowerDbm: number,
  receiverSensitivityDbm: number,
): number {
  return receivedPowerDbm - receiverSensitivityDbm;
}
