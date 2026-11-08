export type RadiationPatternType =
  | "dipole"
  | "monopole"
  | "directional"
  | "circular";

export interface RadiationParameters {
  lengthMeters?: number;
  frequencyHz?: number;
}

const SPEED_OF_LIGHT = 299_792_458;

export function calculateRadiation(
  pattern: RadiationPatternType,
  theta: number,
  phi: number,
  parameters: RadiationParameters = {},
): number {
  const frequencyHz = parameters.frequencyHz ?? 433e6;

  if (!Number.isFinite(frequencyHz) || frequencyHz <= 0) {
    throw new Error("Frequency must be a positive finite number.");
  }

  if (!Number.isFinite(theta) || !Number.isFinite(phi)) {
    throw new Error("Radiation angles must be finite numbers.");
  }

  const wavelength = SPEED_OF_LIGHT / frequencyHz;

  switch (pattern) {
    case "dipole": {
      const lengthMeters = parameters.lengthMeters ?? 0.48 * wavelength;

      if (!Number.isFinite(lengthMeters) || lengthMeters <= 0) {
        throw new Error("Dipole length must be a positive finite number.");
      }

      const electricalHalfLength = (Math.PI * lengthMeters) / wavelength;

      const sinTheta = Math.sin(theta);

      if (Math.abs(sinTheta) < 1e-10) {
        return 0;
      }

      const field =
        (Math.cos(electricalHalfLength * Math.cos(theta)) -
          Math.cos(electricalHalfLength)) /
        sinTheta;

      const maximumField = 1 - Math.cos(electricalHalfLength);

      if (Math.abs(maximumField) < 1e-12) {
        return 0;
      }

      const normalizedField = field / maximumField;

      return normalizedField * normalizedField;
    }

    case "monopole":
      return Math.pow(Math.sin(theta), 2);

    case "directional":
      return Math.pow(Math.max(0, Math.cos(theta)), 8);

    case "circular":
      return Math.pow(Math.sin(theta), 2);

    default:
      return 0;
  }
}
