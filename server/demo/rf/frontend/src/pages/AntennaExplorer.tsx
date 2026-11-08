import { useMemo, useState } from "react";
import { antennas } from "../data/antennas";
import { useSimulationStore } from "../store/simulationStore";

import RadiationPattern from "../components/simulation/RadiationPattern";
import PolarPattern from "../components/simulation/PolarPattern";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";

function getPatternAnalysis(pattern: string) {
  switch (pattern) {
    case "dipole":
      return {
        radiationType: "Omnidirectional",
        maximumRadiation: "Perpendicular to antenna axis",
        minimumRadiation: "Along antenna axis",
        patternShape: "Doughnut-shaped",
        application: "Drone telemetry and general RF communication",
        explanation:
          "A dipole radiates most strongly perpendicular to its length. Signal strength decreases toward the ends of the antenna.",
      };

    case "monopole":
      return {
        radiationType: "Omnidirectional",
        maximumRadiation: "Perpendicular to antenna axis",
        minimumRadiation: "Along antenna axis",
        patternShape: "Doughnut-shaped above ground plane",
        application: "Compact drone communication systems",
        explanation:
          "A monopole mounted above a suitable ground plane radiates around the antenna horizontally, making it useful when the drone changes direction.",
      };

    case "directional":
      return {
        radiationType: "Directional",
        maximumRadiation: "Along the forward direction",
        minimumRadiation: "Opposite the main lobe",
        patternShape: "Focused forward lobe",
        application: "Ground station long-range communication",
        explanation:
          "A directional antenna concentrates more energy in a particular direction. Correctly pointing it toward the drone is important.",
      };

    case "circular":
      return {
        radiationType: "Omnidirectional (illustrative model)",
        maximumRadiation: "Perpendicular to antenna axis",
        minimumRadiation: "Along antenna axis",
        patternShape: "Doughnut-shaped (illustrative)",
        application: "FPV video transmission",
        explanation:
          "Circular polarization describes the rotation of the electric field. It does not determine the radiation shape by itself. This visualization uses a simplified omnidirectional pattern.",
      };

    default:
      return {
        radiationType: "Unknown",
        maximumRadiation: "Not defined",
        minimumRadiation: "Not defined",
        patternShape: "Not available",
        application: "Not available",
        explanation: "No radiation pattern information is available.",
      };
  }
}

export default function AntennaExplorer() {
  const [selectedId, setSelectedId] = useState("dipole");

  const droneAntennaLengthMm = useSimulationStore(
    (state) => state.droneAntennaLengthMm,
  );

  const frequencyMHz = useSimulationStore((state) => state.frequencyMHz);

  const selectedAntenna =
    antennas.find((antenna) => antenna.id === selectedId) ?? antennas[0];

  const patternAnalysis = getPatternAnalysis(selectedAntenna.pattern);

  const radiationParameters = useMemo(
    () => ({
      lengthMeters: droneAntennaLengthMm / 1000,
      frequencyHz: frequencyMHz * 1_000_000,
    }),
    [droneAntennaLengthMm, frequencyMHz],
  );

  return (
    <div className="dashboard antenna-explorer">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">RF KNOWLEDGE CENTER</div>
          <h2>Antenna Explorer</h2>
          <p>
            Explore antenna characteristics, radiation patterns and wireless
            communication fundamentals.
          </p>
        </div>
      </section>

      <section className="antenna-explorer-layout">
        <div className="panel antenna-library">
          <div className="panel-header">
            <div>
              <h3>Antenna Library</h3>
              <p>Select an antenna to explore</p>
            </div>
          </div>

          <div className="antenna-library-list">
            {antennas.map((antenna) => (
              <button
                key={antenna.id}
                className={`antenna-library-item ${
                  selectedId === antenna.id ? "active" : ""
                }`}
                onClick={() => setSelectedId(antenna.id)}
              >
                <span>{antenna.name}</span>
                <span>{antenna.gain} dBi</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel antenna-viewer">
          <div className="panel-header">
            <div>
              <h3>{selectedAntenna.name} Radiation Pattern</h3>
              <p>
                Interactive 3D visualization ·
                {(droneAntennaLengthMm / 1000).toFixed(3)} m · {frequencyMHz}{" "}
                MHz
              </p>
            </div>
          </div>

          <div className="antenna-pattern-canvas">
            <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
              <color attach="background" args={["#0c131d"]} />

              <ambientLight intensity={1.2} />
              <directionalLight position={[5, 10, 5]} intensity={2} />

              <RadiationPattern
                pattern={selectedAntenna.pattern}
                position={[0, 0, 0]}
                radius={2.5}
                orientation={[0, 0, 0]}
                radiationParameters={radiationParameters}
              />

              <Grid
                args={[20, 20]}
                cellColor="#26394f"
                sectionColor="#38536e"
              />

              <OrbitControls makeDefault />
            </Canvas>
          </div>

          <div className="polar-pattern-section">
            <div className="panel-header">
              <div>
                <h3>2D Polar Radiation Pattern</h3>
                <p>Directional radiation distribution</p>
              </div>
            </div>

            <div className="polar-pattern-canvas">
              <PolarPattern
                pattern={selectedAntenna.pattern}
                radiationParameters={radiationParameters}
              />
            </div>
          </div>

          <div className="antenna-information">
            <h3>{selectedAntenna.name}</h3>
            <p>{selectedAntenna.description}</p>

            <div className="antenna-details">
              <div>
                <span>Gain</span>
                <strong>{selectedAntenna.gain} dBi</strong>
              </div>

              <div>
                <span>Frequency</span>
                <strong>{selectedAntenna.frequency} MHz</strong>
              </div>

              <div>
                <span>Polarization</span>
                <strong>{selectedAntenna.polarization}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{selectedAntenna.category}</strong>
              </div>
            </div>
          </div>

          <div className="panel antenna-analysis">
            <div className="panel-header">
              <div>
                <h3>Radiation Pattern Analysis</h3>
                <p>Understanding how this antenna distributes RF energy</p>
              </div>
            </div>

            <div className="antenna-analysis-content">
              <div className="analysis-description">
                <span className="analysis-label">RADIATION BEHAVIOUR</span>
                <h3>{patternAnalysis.radiationType}</h3>
                <p>{patternAnalysis.explanation}</p>
              </div>

              <div className="analysis-grid">
                <div>
                  <span>Maximum radiation</span>
                  <strong>{patternAnalysis.maximumRadiation}</strong>
                </div>

                <div>
                  <span>Minimum radiation</span>
                  <strong>{patternAnalysis.minimumRadiation}</strong>
                </div>

                <div>
                  <span>Pattern shape</span>
                  <strong>{patternAnalysis.patternShape}</strong>
                </div>

                <div>
                  <span>Typical application</span>
                  <strong>{patternAnalysis.application}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
