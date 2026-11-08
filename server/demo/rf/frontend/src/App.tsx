import { useState } from "react";
import {
  Radio,
  RadioTower,
  Activity,
  Antenna,
  LayoutDashboard,
  Box,
  Settings,
  BookOpen,
  Wifi,
  Menu,
  Signal,
  ChevronDown,
} from "lucide-react";

import * as THREE from "three";
import { calculateAntennaGeometry } from "./physics/antennaGeometry";

import AntennaExplorer from "./pages/AntennaExplorer";
import type { ReactNode } from "react";
import RFConfiguration from "./components/configuration/RFFConfiguration";

import { useSimulationStore } from "./store/simulationStore";
import { antennas } from "./data/antennas";

import {
  calculateDirectionalGain,
  calculateFspl,
  calculateReceivedPower,
  calculateLinkMargin,
} from "./physics/linkBudget";

import RFScene from "./scenes/RFScene";

import "./App.css";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Antenna Explorer", icon: Antenna },
  { label: "RF Link Simulator", icon: RadioTower },
  { label: "3D Environment", icon: Box },
  { label: "RF Monitoring", icon: Activity },
];

function App() {
  const [activePage, setActivePage] = useState<
    "Dashboard" | "Antenna Explorer"
  >("Dashboard");

  // ------------------------------------------------
  // 1. Read simulation configuration from Zustand
  // ------------------------------------------------

  const distance = useSimulationStore((state) => state.distance);
  const altitude = useSimulationStore((state) => state.altitude);

  const groundStationHeight = useSimulationStore(
    (state) => state.groundStationHeight,
  );

  const droneAntennaHeightOffset = useSimulationStore(
    (state) => state.droneAntennaHeightOffset,
  );

  const yaw = useSimulationStore((state) => state.yaw);
  const pitch = useSimulationStore((state) => state.pitch);
  const roll = useSimulationStore((state) => state.roll);

  // Transmitter
  const txPowerDbm = useSimulationStore((state) => state.txPowerDbm);

  const frequencyMHz = useSimulationStore((state) => state.frequencyMHz);

  const txCableLossDb = useSimulationStore((state) => state.txCableLossDb);

  const txConnectorLossDb = useSimulationStore(
    (state) => state.txConnectorLossDb,
  );

  // Receiver
  const rxCableLossDb = useSimulationStore((state) => state.rxCableLossDb);

  const rxConnectorLossDb = useSimulationStore(
    (state) => state.rxConnectorLossDb,
  );

  const receiverSensitivityDbm = useSimulationStore(
    (state) => state.receiverSensitivityDbm,
  );

  const additionalLossesDb = useSimulationStore(
    (state) => state.additionalLossesDb,
  );

  // Drone antenna
  const selectedAntennaId = useSimulationStore(
    (state) => state.selectedAntennaId,
  );

  const setSelectedAntennaId = useSimulationStore(
    (state) => state.setSelectedAntennaId,
  );

  const droneAntennaGainDbi = useSimulationStore(
    (state) => state.droneAntennaGainDbi,
  );

  // Ground station antenna
  const selectedGroundAntennaId = useSimulationStore(
    (state) => state.selectedGroundAntennaId,
  );

  const setSelectedGroundAntennaId = useSimulationStore(
    (state) => state.setSelectedGroundAntennaId,
  );

  const groundAntennaGainDbi = useSimulationStore(
    (state) => state.groundAntennaGainDbi,
  );

  const droneAntennaLengthMm = useSimulationStore(
    (state) => state.droneAntennaLengthMm,
  );

  const groundAntennaLengthMm = useSimulationStore(
    (state) => state.groundAntennaLengthMm,
  );

  // ------------------------------------------------
  // 2. Find selected antenna profiles
  // ------------------------------------------------

  const selectedAntenna = antennas.find(
    (antenna) => antenna.id === selectedAntennaId,
  );

  const selectedGroundAntenna = antennas.find(
    (antenna) => antenna.id === selectedGroundAntennaId,
  );

  if (!selectedAntenna || !selectedGroundAntenna) {
    return <div>Selected antenna configuration is unavailable.</div>;
  }

  // ------------------------------------------------
  // 3. Calculate antenna positions
  // ------------------------------------------------
  const droneOrientation: [number, number, number] = [
    THREE.MathUtils.degToRad(pitch),
    THREE.MathUtils.degToRad(yaw),
    THREE.MathUtils.degToRad(roll),
  ];

  const geometry = calculateAntennaGeometry({
    distanceMeters: distance,
    droneAltitudeMeters: altitude,
    droneAntennaHeightOffsetMeters: droneAntennaHeightOffset,
    groundAntennaHeightMeters: groundStationHeight,
    droneOrientationRadians: droneOrientation,
  });

  const droneAntenna = geometry.droneAntennaPosition;
  const groundAntenna = geometry.groundAntennaPosition;
  const actualDistance = geometry.antennaSeparationMeters;

  // ------------------------------------------------
  // 4. Calculate antenna orientations
  // ------------------------------------------------

  const groundOrientation: [number, number, number] = [0, 0, 0];

  // ------------------------------------------------
  // 5. Calculate directional antenna gains
  // ------------------------------------------------

  const droneGain = calculateDirectionalGain({
    pattern: selectedAntenna.pattern,
    peakGainDbi: droneAntennaGainDbi,
    antennaPosition: droneAntenna,
    targetPosition: groundAntenna,
    orientation: droneOrientation,
    radiationParameters: {
      lengthMeters: droneAntennaLengthMm / 1000,
      frequencyHz: frequencyMHz * 1_000_000,
    },
  });

  const groundGain = calculateDirectionalGain({
    pattern: selectedGroundAntenna.pattern,
    peakGainDbi: groundAntennaGainDbi,
    antennaPosition: groundAntenna,
    targetPosition: droneAntenna,
    orientation: groundOrientation,
    radiationParameters: {
      lengthMeters: groundAntennaLengthMm / 1000,
      frequencyHz: frequencyMHz * 1_000_000,
    },
  });

  // ------------------------------------------------
  // 6. Frequency compatibility
  // ------------------------------------------------

  const frequencyCompatible =
    selectedAntenna.frequency === selectedGroundAntenna.frequency;

  // ------------------------------------------------
  // 7. Calculate RF link budget
  // ------------------------------------------------

  const pathLoss = calculateFspl(actualDistance, frequencyMHz);

  const totalSystemLosses =
    txCableLossDb +
    txConnectorLossDb +
    rxCableLossDb +
    rxConnectorLossDb +
    additionalLossesDb;

  const receivedPower = calculateReceivedPower(
    txPowerDbm,
    droneGain,
    groundGain,
    pathLoss,
    totalSystemLosses,
  );

  const linkMargin = calculateLinkMargin(receivedPower, receiverSensitivityDbm);

  const linkAvailable = frequencyCompatible && linkMargin >= 0;

  // ------------------------------------------------
  // 8. Application UI
  // ------------------------------------------------

  return (
    <div className="app-layout">
      {/* Sidebar */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Radio size={23} />
          </div>

          <div>
            <h1>RF LAB</h1>
            <span>DRONE RF PLATFORM</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
                onClick={() => {
                  if (
                    item.label === "Dashboard" ||
                    item.label === "Antenna Explorer"
                  ) {
                    setActivePage(item.label);
                  }
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <BookOpen size={19} />
            <span>RF Learning Center</span>
          </button>

          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="version">
            RF LAB <span>v0.1.0</span>
          </div>
        </div>
      </aside>

      {/* Main application */}

      <main className="main-content">
        {/* Top bar */}

        <header className="topbar">
          <button className="mobile-menu">
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-right">
            <div className="connection-status">
              <span className="status-dot" />
              Offline simulation
            </div>

            <button className="profile-button">
              <div className="avatar">RF</div>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        {/* Dashboard / Antenna Explorer */}

        {activePage === "Dashboard" ? (
          <div className="dashboard">
            <section className="welcome-section">
              <div>
                <div className="eyebrow">DRONE COMMUNICATION SYSTEMS</div>

                <h2>RF Dashboard</h2>

                <p>
                  Understand, visualize and analyze your drone's radio frequency
                  communication.
                </p>
              </div>

              <button className="primary-button">
                <RadioTower size={17} />
                New simulation
              </button>
            </section>

            {/* RF Metrics */}

            <section className="metrics-grid">
              <MetricCard
                label="RF LINK STATUS"
                value={
                  !frequencyCompatible
                    ? "Frequency mismatch"
                    : linkAvailable
                      ? "Above sensitivity"
                      : "Below sensitivity"
                }
                description={
                  !frequencyCompatible
                    ? "Selected antennas have different frequencies"
                    : `Received power: ${receivedPower.toFixed(2)} dBm`
                }
                icon={<Wifi size={20} />}
                status={linkAvailable ? "blue" : "neutral"}
              />

              <MetricCard
                label="FREQUENCY"
                value={`${frequencyMHz} MHz`}
                description="Configured operating frequency"
                icon={<Radio size={20} />}
                status="blue"
              />

              <MetricCard
                label="TRANSMIT POWER"
                value={`${txPowerDbm.toFixed(2)} dBm`}
                description="Internal transmitter power"
                icon={<Signal size={20} />}
                status="blue"
              />

              <MetricCard
                label="LINK MARGIN"
                value={`${linkMargin.toFixed(2)} dB`}
                description={`Receiver sensitivity: ${receiverSensitivityDbm} dBm`}
                icon={<Activity size={20} />}
                status={linkAvailable ? "blue" : "neutral"}
              />
            </section>

            {/* Main workspace */}

            <section className="content-grid">
              {/* 3D Environment */}

              <div className="panel simulation-panel">
                <div className="panel-header">
                  <div>
                    <h3>3D RF Environment</h3>
                    <p>Drone and ground station workspace</p>
                  </div>

                  <button className="secondary-button">
                    <Box size={16} />
                    3D View
                  </button>
                </div>

                <div className="simulation-view">
                  <RFScene selectedPattern={selectedAntenna.pattern} />
                </div>
              </div>

              {/* Right configuration panel */}

              <div className="right-column">
                <RFConfiguration />

                {/* Active antenna configuration */}

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Active configuration</h3>
                      <p>Current simulation setup</p>
                    </div>
                  </div>

                  <div className="configuration-list">
                    {/* Drone antenna */}

                    <div className="configuration-row antenna-selector-row">
                      <span>Drone antenna</span>

                      <select
                        value={selectedAntennaId}
                        onChange={(event) =>
                          setSelectedAntennaId(event.target.value)
                        }
                      >
                        {antennas.map((antenna) => (
                          <option key={antenna.id} value={antenna.id}>
                            {antenna.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="antenna-details">
                      <div>
                        <span>Configured gain</span>
                        <strong>{droneAntennaGainDbi} dBi</strong>
                      </div>

                      <div>
                        <span>Polarization</span>
                        <strong>{selectedAntenna.polarization}</strong>
                      </div>

                      <div>
                        <span>Profile frequency</span>
                        <strong>{selectedAntenna.frequency} MHz</strong>
                      </div>

                      <p>{selectedAntenna.description}</p>
                    </div>

                    {/* Ground antenna */}

                    <div className="configuration-row antenna-selector-row">
                      <span>Ground antenna</span>

                      <select
                        value={selectedGroundAntennaId}
                        onChange={(event) =>
                          setSelectedGroundAntennaId(event.target.value)
                        }
                      >
                        {antennas.map((antenna) => (
                          <option key={antenna.id} value={antenna.id}>
                            {antenna.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="antenna-details">
                      <div>
                        <span>Configured gain</span>
                        <strong>{groundAntennaGainDbi} dBi</strong>
                      </div>

                      <div>
                        <span>Polarization</span>
                        <strong>{selectedGroundAntenna.polarization}</strong>
                      </div>

                      <div>
                        <span>Profile frequency</span>
                        <strong>{selectedGroundAntenna.frequency} MHz</strong>
                      </div>

                      <p>{selectedGroundAntenna.description}</p>
                    </div>
                  </div>
                </div>

                {/* Learning panel */}

                <div className="panel learning-panel">
                  <div className="learning-icon">
                    <Activity size={21} />
                  </div>

                  <h3>Understanding RF</h3>

                  <p>
                    Learn how antenna orientation, distance, obstacles and
                    interference affect drone communication.
                  </p>

                  <button className="text-button">Explore RF concepts →</button>
                </div>
              </div>
            </section>

            <footer className="footer">
              <span>RF LAB · Drone RF Visualization Platform</span>
              <span>Simulation values are calculated, not fabricated.</span>
            </footer>
          </div>
        ) : (
          <AntennaExplorer />
        )}
      </main>
    </div>
  );
}

// ------------------------------------------------
// Reusable metric card
// ------------------------------------------------

function MetricCard({
  label,
  value,
  description,
  icon,
  status,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  status: string;
}) {
  return (
    <div className="panel metric-card">
      <div className="metric-top">
        <span>{label}</span>

        <div className={`metric-icon ${status}`}>{icon}</div>
      </div>

      <h3>{value}</h3>
      <p>{description}</p>
    </div>
  );
}

export default App;
