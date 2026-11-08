import { create } from "zustand";

interface SimulationState {
  // Drone and environment
  distance: number;
  altitude: number;
  groundStationHeight: number;
  droneAntennaHeightOffset: number;

  // Antenna selection
  selectedAntennaId: string;
  selectedGroundAntennaId: string;

  // Drone antenna configuration
  droneAntennaGainDbi: number;
  droneAntennaLengthMm: number;
  droneAntennaDiameterMm: number;

  // Ground station antenna configuration
  groundAntennaGainDbi: number;
  groundAntennaLengthMm: number;
  groundAntennaDiameterMm: number;

  // Antenna orientation
  yaw: number;
  pitch: number;
  roll: number;

  // Transmitter configuration
  txPowerDbm: number;
  frequencyMHz: number;
  txCableLossDb: number;
  txConnectorLossDb: number;

  // Receiver configuration
  receiverSensitivityDbm: number;
  bandwidthMHz: number;
  noiseFigureDb: number;
  requiredSnrDb: number;
  sensitivityMode: "manual" | "calculated";
  rxCableLossDb: number;
  rxConnectorLossDb: number;

  // Additional propagation losses
  additionalLossesDb: number;

  // Environment and propagation
  propagationModel: "free-space";

  // Setters: drone and environment
  setDistance: (value: number) => void;
  setAltitude: (value: number) => void;
  setGroundStationHeight: (value: number) => void;
  setDroneAntennaHeightOffset: (value: number) => void;

  // Setters: antenna selection
  setSelectedAntennaId: (value: string) => void;
  setSelectedGroundAntennaId: (value: string) => void;

  // Setters: drone antenna
  setDroneAntennaGainDbi: (value: number) => void;
  setDroneAntennaLengthMm: (value: number) => void;
  setDroneAntennaDiameterMm: (value: number) => void;

  // Setters: ground antenna
  setGroundAntennaGainDbi: (value: number) => void;
  setGroundAntennaLengthMm: (value: number) => void;
  setGroundAntennaDiameterMm: (value: number) => void;

  // Setters: orientation
  setYaw: (value: number) => void;
  setPitch: (value: number) => void;
  setRoll: (value: number) => void;

  // Setters: transmitter
  setTxPowerDbm: (value: number) => void;
  setFrequencyMHz: (value: number) => void;
  setTxCableLossDb: (value: number) => void;
  setTxConnectorLossDb: (value: number) => void;

  // Setters: receiver
  setReceiverSensitivityDbm: (value: number) => void;
  setBandwidthMHz: (value: number) => void;
  setNoiseFigureDb: (value: number) => void;
  setRequiredSnrDb: (value: number) => void;
  setSensitivityMode: (value: "manual" | "calculated") => void;
  setRxCableLossDb: (value: number) => void;
  setRxConnectorLossDb: (value: number) => void;

  // Setters: propagation
  setAdditionalLossesDb: (value: number) => void;
  setPropagationModel: (value: "free-space") => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Drone and environment
  distance: 7,
  altitude: 2,
  groundStationHeight: 2.1,
  droneAntennaHeightOffset: 0.36,

  // Antenna selection
  selectedAntennaId: "dipole",
  selectedGroundAntennaId: "dipole",

  // Drone antenna
  droneAntennaGainDbi: 2.15,
  droneAntennaLengthMm: 330,
  droneAntennaDiameterMm: 2,

  // Ground station antenna
  groundAntennaGainDbi: 2.15,
  groundAntennaLengthMm: 330,
  groundAntennaDiameterMm: 2,

  // Orientation
  yaw: 0,
  pitch: 0,
  roll: 0,

  // Transmitter
  txPowerDbm: 20,
  frequencyMHz: 433,
  txCableLossDb: 1,
  txConnectorLossDb: 0,

  // Receiver
  receiverSensitivityDbm: -110,
  bandwidthMHz: 1,
  noiseFigureDb: 5,
  requiredSnrDb: 10,
  sensitivityMode: "manual",
  rxCableLossDb: 1,
  rxConnectorLossDb: 0,

  // Propagation
  additionalLossesDb: 0,
  propagationModel: "free-space",

  // Drone and environment setters
  setDistance: (value) => set({ distance: value }),
  setAltitude: (value) => set({ altitude: value }),
  setGroundStationHeight: (value) => set({ groundStationHeight: value }),
  setDroneAntennaHeightOffset: (value) =>
    set({ droneAntennaHeightOffset: value }),

  // Antenna selection setters
  setSelectedAntennaId: (value) => set({ selectedAntennaId: value }),
  setSelectedGroundAntennaId: (value) =>
    set({ selectedGroundAntennaId: value }),

  // Drone antenna setters
  setDroneAntennaGainDbi: (value) => set({ droneAntennaGainDbi: value }),
  setDroneAntennaLengthMm: (value) => set({ droneAntennaLengthMm: value }),
  setDroneAntennaDiameterMm: (value) => set({ droneAntennaDiameterMm: value }),

  // Ground antenna setters
  setGroundAntennaGainDbi: (value) => set({ groundAntennaGainDbi: value }),
  setGroundAntennaLengthMm: (value) => set({ groundAntennaLengthMm: value }),
  setGroundAntennaDiameterMm: (value) =>
    set({ groundAntennaDiameterMm: value }),

  // Orientation setters
  setYaw: (value) => set({ yaw: value }),
  setPitch: (value) => set({ pitch: value }),
  setRoll: (value) => set({ roll: value }),

  // Transmitter setters
  setTxPowerDbm: (value) => set({ txPowerDbm: value }),
  setFrequencyMHz: (value) => set({ frequencyMHz: value }),
  setTxCableLossDb: (value) => set({ txCableLossDb: value }),
  setTxConnectorLossDb: (value) => set({ txConnectorLossDb: value }),

  // Receiver setters
  setReceiverSensitivityDbm: (value) => set({ receiverSensitivityDbm: value }),
  setBandwidthMHz: (value) => set({ bandwidthMHz: value }),
  setNoiseFigureDb: (value) => set({ noiseFigureDb: value }),
  setRequiredSnrDb: (value) => set({ requiredSnrDb: value }),
  setSensitivityMode: (value) => set({ sensitivityMode: value }),
  setRxCableLossDb: (value) => set({ rxCableLossDb: value }),
  setRxConnectorLossDb: (value) => set({ rxConnectorLossDb: value }),

  // Propagation setters
  setAdditionalLossesDb: (value) => set({ additionalLossesDb: value }),
  setPropagationModel: (value) => set({ propagationModel: value }),
}));
