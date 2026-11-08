export interface Antenna {
  id: string;
  name: string;
  category: "omnidirectional" | "directional";
  polarization: "linear" | "circular";
  gain: number; // dBi
  frequency: number; // MHz (illustrative center frequency)
  pattern: "dipole" | "monopole" | "directional" | "circular";
  description: string;
}

export const antennas: Antenna[] = [
  {
    id: "dipole",
    name: "Dipole",
    category: "omnidirectional",
    polarization: "linear",
    gain: 2.15,
    frequency: 433,
    pattern: "dipole",
    description: "A balanced antenna commonly used as an RF reference.",
  },
  {
    id: "monopole",
    name: "Monopole",
    category: "omnidirectional",
    polarization: "linear",
    gain: 2.15,
    frequency: 433,
    pattern: "monopole",
    description: "A compact antenna commonly used on drone platforms.",
  },
  {
    id: "yagi",
    name: "Yagi-Uda",
    category: "directional",
    polarization: "linear",
    gain: 10,
    frequency: 433,
    pattern: "directional",
    description:
      "A directional antenna designed to focus energy in one direction.",
  },
  {
    id: "cloverleaf",
    name: "Cloverleaf",
    category: "omnidirectional",
    polarization: "circular",
    gain: 1.5,
    frequency: 5800,
    pattern: "circular",
    description: "A circularly polarized antenna commonly used in FPV systems.",
  },
];
