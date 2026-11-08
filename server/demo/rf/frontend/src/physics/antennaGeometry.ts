import * as THREE from "three";

export type Position3 = [number, number, number];
export type Rotation3 = [number, number, number];

export interface AntennaGeometryInput {
  distanceMeters: number;
  droneAltitudeMeters: number;
  droneAntennaHeightOffsetMeters: number;
  groundAntennaHeightMeters: number;
  droneOrientationRadians: Rotation3;
}

export interface AntennaGeometry {
  dronePosition: Position3;
  groundStationPosition: Position3;
  droneAntennaPosition: Position3;
  groundAntennaPosition: Position3;
  antennaSeparationMeters: number;
}

// The ground station is the reference point of the scene.
export const GROUND_STATION_POSITION: Position3 = [0, 0, -7];

export function calculateAntennaGeometry(
  input: AntennaGeometryInput,
): AntennaGeometry {
  const {
    distanceMeters,
    droneAltitudeMeters,
    droneAntennaHeightOffsetMeters,
    groundAntennaHeightMeters,
    droneOrientationRadians,
  } = input;

  const values = [
    distanceMeters,
    droneAltitudeMeters,
    droneAntennaHeightOffsetMeters,
    groundAntennaHeightMeters,
    ...droneOrientationRadians,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error("Antenna geometry inputs must be finite numbers.");
  }

  if (
    distanceMeters < 0 ||
    droneAltitudeMeters < 0 ||
    droneAntennaHeightOffsetMeters < 0 ||
    groundAntennaHeightMeters < 0
  ) {
    throw new Error("Distance and antenna heights cannot be negative.");
  }

  const groundStationPosition: Position3 = [...GROUND_STATION_POSITION];

  const dronePosition: Position3 = [
    0,
    droneAltitudeMeters,
    GROUND_STATION_POSITION[2] + distanceMeters,
  ];

  // Rotate the antenna's local offset along with the drone.
  const droneRotation = new THREE.Euler(
    droneOrientationRadians[0],
    droneOrientationRadians[1],
    droneOrientationRadians[2],
    "XYZ",
  );

  const rotatedAntennaOffset = new THREE.Vector3(
    0,
    droneAntennaHeightOffsetMeters,
    0,
  ).applyEuler(droneRotation);

  const droneAntennaPosition: Position3 = [
    dronePosition[0] + rotatedAntennaOffset.x,
    dronePosition[1] + rotatedAntennaOffset.y,
    dronePosition[2] + rotatedAntennaOffset.z,
  ];

  const groundAntennaPosition: Position3 = [
    groundStationPosition[0],
    groundStationPosition[1] + groundAntennaHeightMeters,
    groundStationPosition[2],
  ];

  const dx = droneAntennaPosition[0] - groundAntennaPosition[0];
  const dy = droneAntennaPosition[1] - groundAntennaPosition[1];
  const dz = droneAntennaPosition[2] - groundAntennaPosition[2];

  const antennaSeparationMeters = Math.hypot(dx, dy, dz);

  if (antennaSeparationMeters === 0) {
    throw new Error(
      "Drone and ground antennas cannot occupy the same position.",
    );
  }

  return {
    dronePosition,
    groundStationPosition,
    droneAntennaPosition,
    groundAntennaPosition,
    antennaSeparationMeters,
  };
}
