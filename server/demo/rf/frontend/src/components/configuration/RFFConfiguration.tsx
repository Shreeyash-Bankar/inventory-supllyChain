import { useSimulationStore } from "../../store/simulationStore";

export default function RFConfiguration() {
  const {
    txPowerDbm,
    frequencyMHz,
    txCableLossDb,
    txConnectorLossDb,

    droneAntennaGainDbi,
    droneAntennaLengthMm,
    droneAntennaDiameterMm,

    groundAntennaGainDbi,
    groundAntennaLengthMm,
    groundAntennaDiameterMm,
    groundStationHeight,

    rxCableLossDb,
    rxConnectorLossDb,

    setTxPowerDbm,
    setFrequencyMHz,
    setTxCableLossDb,
    setTxConnectorLossDb,

    setDroneAntennaGainDbi,
    setDroneAntennaLengthMm,
    setDroneAntennaDiameterMm,

    setGroundAntennaGainDbi,
    setGroundAntennaLengthMm,
    setGroundAntennaDiameterMm,
    setGroundStationHeight,

    setRxCableLossDb,
    setRxConnectorLossDb,
  } = useSimulationStore();

  // Convert between milliwatts (UI) and dBm (internal RF calculation).
  const txPowerMw = Math.pow(10, txPowerDbm / 10);

  const updateNumber = (
    value: string,
    setter: (value: number) => void,
    minimum?: number,
  ) => {
    if (value.trim() === "") return;

    const parsed = Number(value);

    if (
      Number.isFinite(parsed) &&
      (minimum === undefined || parsed >= minimum)
    ) {
      setter(parsed);
    }
  };

  return (
    <div className="rf-config-panel">
      <h3>RF Configuration</h3>

      {/* TRANSMITTER */}
      <section className="rf-config-section">
        <h4>Drone Transmitter</h4>

        <div className="rf-config-grid">
          <div className="rf-config-field">
            <label>TX Power (mW)</label>
            <input
              type="number"
              min="15"
              step="1"
              value={Number(txPowerMw.toFixed(2))}
              onChange={(e) =>
                updateNumber(
                  e.target.value,
                  (mw) => {
                    setTxPowerDbm(10 * Math.log10(mw));
                  },
                  15,
                )
              }
            />
          </div>

          <div className="rf-config-field">
            <label>Frequency (MHz)</label>
            <input
              type="number"
              min="1"
              step="1"
              value={frequencyMHz}
              onChange={(e) => updateNumber(e.target.value, setFrequencyMHz, 1)}
            />
          </div>

          <div className="rf-config-field">
            <label>TX Cable Loss (dB)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={txCableLossDb}
              onChange={(e) =>
                updateNumber(e.target.value, setTxCableLossDb, 0)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>TX Connector Loss (dB)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={txConnectorLossDb}
              onChange={(e) =>
                updateNumber(e.target.value, setTxConnectorLossDb, 0)
              }
            />
          </div>
        </div>
      </section>

      {/* DRONE ANTENNA */}
      <section className="rf-config-section">
        <h4>Drone Antenna</h4>

        <div className="rf-config-grid">
          <div className="rf-config-field">
            <label>Antenna Gain (dBi)</label>
            <input
              type="number"
              step="0.1"
              value={droneAntennaGainDbi}
              onChange={(e) =>
                updateNumber(e.target.value, setDroneAntennaGainDbi)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>Antenna Length (mm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={droneAntennaLengthMm}
              onChange={(e) =>
                updateNumber(e.target.value, setDroneAntennaLengthMm, 0.1)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>Antenna Diameter (mm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={droneAntennaDiameterMm}
              onChange={(e) =>
                updateNumber(e.target.value, setDroneAntennaDiameterMm, 0.1)
              }
            />
          </div>
        </div>
      </section>

      {/* GROUND STATION RECEIVER */}
      <section className="rf-config-section">
        <h4>Ground Station Receiver</h4>

        <div className="rf-config-grid">
          <div className="rf-config-field">
            <label>RX Antenna Gain (dBi)</label>
            <input
              type="number"
              step="0.1"
              value={groundAntennaGainDbi}
              onChange={(e) =>
                updateNumber(e.target.value, setGroundAntennaGainDbi)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>RX Antenna Length (mm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={groundAntennaLengthMm}
              onChange={(e) =>
                updateNumber(e.target.value, setGroundAntennaLengthMm, 0.1)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>RX Antenna Diameter (mm)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={groundAntennaDiameterMm}
              onChange={(e) =>
                updateNumber(e.target.value, setGroundAntennaDiameterMm, 0.1)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>Ground Antenna Height (m)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={groundStationHeight}
              onChange={(e) =>
                updateNumber(e.target.value, setGroundStationHeight, 0)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>RX Cable Loss (dB)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rxCableLossDb}
              onChange={(e) =>
                updateNumber(e.target.value, setRxCableLossDb, 0)
              }
            />
          </div>

          <div className="rf-config-field">
            <label>RX Connector Loss (dB)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={rxConnectorLossDb}
              onChange={(e) =>
                updateNumber(e.target.value, setRxConnectorLossDb, 0)
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
