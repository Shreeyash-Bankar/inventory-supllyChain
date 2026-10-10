import EkfStatus from "@/components/other/EkfStatus";
import Vibration from "@/components/other/Vibration";
import { useEffect, useState } from "react";

export default function FirmwareFlasher() {
  // ============================================================
  // STATE
  // ============================================================

  const [ports, setPorts] = useState([]);

  const [selectedPort, setSelectedPort] = useState("");

  const [firmwarePath, setFirmwarePath] = useState("");

  const [baudRate, setBaudRate] = useState("115200");

  const [flashBaudRate, setFlashBaudRate] = useState("");

  const [progress, setProgress] = useState(0);

  const [stage, setStage] = useState("Idle");

  const [status, setStatus] = useState("Select firmware and COM port.");

  const [logs, setLogs] = useState([]);

  const [board, setBoard] = useState(null);

  const [flashing, setFlashing] = useState(false);

  const [firmwareReadyToReconnect, setFirmwareReadyToReconnect] =
    useState(false);

  const [reconnecting, setReconnecting] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // LOAD PORTS
  // ============================================================

  async function loadPorts() {
    try {
      const result = await window.electron.firmware.listPorts();

      setPorts(result || []);

      if (result?.length > 0 && !selectedPort) {
        setSelectedPort(result[0].path);
      }
    } catch (err) {
      console.error("Failed to load ports:", err);

      setError(err.message || "Failed to load serial ports.");
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadPorts();
  }, []);

  // ============================================================
  // FIRMWARE EVENTS
  // ============================================================

  useEffect(() => {
    const unsubscribe = window.electron.firmware.onEvent((event) => {
      console.log("[UI FIRMWARE EVENT]", event);

      // ----------------------------------------------------
      // STARTED
      // ----------------------------------------------------

      // if (event.type === "started") {
      //   setFlashing(event.operation === "flash");

      //   setProgress(0);

      //   setStage(event.operation === "identify" ? "Identifying" : "Starting");

      //   setStatus("Firmware operation started.");

      //   return;
      // }

      if (event.type === "started") {
        setFlashing(event.operation === "flash");

        if (event.operation === "flash") {
          setFirmwareReadyToReconnect(false);
          setReconnecting(false);
        }

        setProgress(0);

        setStage(event.operation === "identify" ? "Identifying" : "Starting");

        setStatus("Firmware operation started.");

        return;
      }

      // ----------------------------------------------------
      // BOARD
      // ----------------------------------------------------

      if (event.type === "board") {
        setBoard(event);

        setStatus("Autopilot identified.");

        setStage("Board detected");

        return;
      }

      // ----------------------------------------------------
      // STAGE
      // ----------------------------------------------------

      if (event.type === "stage") {
        setStage(event.stage || "Working");

        setStatus(event.message || "Working...");

        return;
      }

      // ----------------------------------------------------
      // PROGRESS
      // ----------------------------------------------------

      if (event.type === "progress") {
        setProgress(Number(event.percent || 0));

        setStage(event.stage || "Working");

        setStatus(
          `${event.stage || "Working"} ${Number(event.percent || 0).toFixed(1)}%`,
        );

        return;
      }

      // ----------------------------------------------------
      // LOG
      // ----------------------------------------------------

      if (event.type === "log") {
        setLogs((previous) => [...previous, event.message]);

        return;
      }

      // ----------------------------------------------------
      // ERROR
      // ----------------------------------------------------

      if (event.type === "error") {
        setError(event.message || "Firmware error.");

        setStatus(event.message || "Firmware operation failed.");

        setFlashing(false);

        return;
      }

      // ----------------------------------------------------
      // CANCELLED
      // ----------------------------------------------------

      if (event.type === "cancelled") {
        setStatus("Firmware operation cancelled.");

        setStage("Cancelled");

        setFlashing(false);

        return;
      }

      // ----------------------------------------------------
      // COMPLETE
      // ----------------------------------------------------

      // if (event.type === "complete") {
      //   setFlashing(false);

      //   if (event.success) {
      //     setProgress(100);

      //     setStage("Complete");

      //     setStatus("Firmware flashed successfully.");
      //   } else {
      //     setStage("Failed");

      //     setStatus(event.message || "Firmware flashing failed.");
      //   }

      //   return;
      // }

      if (event.type === "complete") {
        setFlashing(false);

        if (event.success) {
          setProgress(100);

          setStage("Complete");

          setStatus("Firmware flashed successfully. Reconnect when ready.");

          setFirmwareReadyToReconnect(true);
        } else {
          setStage("Failed");

          setStatus(event.message || "Firmware flashing failed.");

          setFirmwareReadyToReconnect(false);
        }

        return;
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  // ============================================================
  // SELECT FIRMWARE
  // ============================================================

  async function handleSelectFirmware() {
    try {
      setError("");

      const file = await window.electron.firmware.selectFile();

      if (file) {
        setFirmwarePath(file);
      }
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to select firmware.");
    }
  }

  // ============================================================
  // IDENTIFY
  // ============================================================

  async function handleIdentify() {
    if (!selectedPort) {
      setError("Select a COM port first.");
      return;
    }

    setError("");

    setLogs([]);

    setBoard(null);

    try {
      await window.electron.firmware.identify(selectedPort, Number(baudRate));
    } catch (err) {
      console.error(err);

      setError(err.message || "Failed to identify autopilot.");
    }
  }

  // ============================================================
  // FLASH
  // ============================================================

  async function handleFlash() {
    if (!selectedPort) {
      setError("Select a COM port.");
      return;
    }

    if (!firmwarePath) {
      setError("Select a firmware file.");
      return;
    }

    setError("");

    setLogs([]);

    setProgress(0);

    setStage("Starting");

    setStatus("Starting firmware flash...");

    setFlashing(true);

    try {
      const result = await window.electron.firmware.flash({
        path: selectedPort,

        firmwarePath,

        baudRate: Number(baudRate),

        flashBaudRate: flashBaudRate ? Number(flashBaudRate) : null,

        force: false,

        fullErase: false,
      });

      console.log("Flash result:", result);
    } catch (err) {
      console.error("Flash error:", err);

      setError(err.message || "Firmware flashing failed.");

      setFlashing(false);
    }
  }

  //////////

  async function handleReconnect() {
    if (!selectedPort) {
      setError("No COM port is available for reconnect.");
      return;
    }

    setError("");
    setReconnecting(true);
    setStatus("Reconnecting to autopilot...");
    setStage("Reconnecting");

    try {
      const result = await window.electron.firmware.reconnect(
        selectedPort,
        Number(baudRate),
      );

      console.log("[UI] Reconnect result:", result);

      if (!result?.success) {
        throw new Error("Could not reconnect to the autopilot.");
      }

      setFirmwareReadyToReconnect(false);
      setReconnecting(false);

      setStage("Connected");
      setStatus("Autopilot reconnected successfully.");
    } catch (err) {
      console.error("[UI] Reconnect error:", err);

      setReconnecting(false);

      setError(err.message || "Failed to reconnect to autopilot.");

      setStatus("Reconnect failed.");
    }
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async function handleCancel() {
    try {
      await window.electron.firmware.cancel();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Firmware Flasher</h1>

      {/* ------------------------------------------------------ */}
      {/* FIRMWARE FILE */}
      {/* ------------------------------------------------------ */}

      <div className="mb-5">
        <label className="block mb-2">Firmware</label>

        <div className="flex gap-2">
          <input
            value={firmwarePath}
            readOnly
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
            placeholder="Select firmware file"
          />

          <button
            onClick={handleSelectFirmware}
            disabled={flashing}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Browse
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* COM PORT */}
      {/* ------------------------------------------------------ */}

      <div className="mb-5">
        <label className="block mb-2">COM Port</label>

        <div className="flex gap-2">
          <select
            value={selectedPort}
            onChange={(e) => setSelectedPort(e.target.value)}
            disabled={flashing}
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="">Select COM port</option>

            {ports.map((port) => (
              <option key={port.path} value={port.path}>
                {port.path}
                {port.name ? ` - ${port.name}` : ""}
              </option>
            ))}
          </select>

          <button
            onClick={loadPorts}
            disabled={flashing}
            className="px-4 py-2 bg-gray-700 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* BAUDRATE */}
      {/* ------------------------------------------------------ */}

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block mb-2">Bootloader Baudrate</label>

          <select
            value={baudRate}
            onChange={(e) => setBaudRate(e.target.value)}
            disabled={flashing}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="115200">115200</option>

            <option value="57600">57600</option>

            <option value="230400">230400</option>

            <option value="460800">460800</option>

            <option value="921600">921600</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Flash Baudrate</label>

          <select
            value={flashBaudRate}
            onChange={(e) => setFlashBaudRate(e.target.value)}
            disabled={flashing}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
          >
            <option value="">Same as bootloader</option>

            <option value="115200">115200</option>

            <option value="230400">230400</option>

            <option value="460800">460800</option>

            <option value="921600">921600</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* BOARD INFORMATION */}
      {/* ------------------------------------------------------ */}

      {board && (
        <div className="mb-5 bg-gray-900 border border-gray-700 rounded p-4">
          <h2 className="font-bold mb-3">Autopilot</h2>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Board ID</div>

            <div>{board.boardId}</div>

            <div>Board Revision</div>

            <div>{board.boardRevision}</div>

            <div>Bootloader</div>

            <div>{board.bootloaderRevision}</div>

            <div>Flash Size</div>

            <div>{board.flashSize} bytes</div>

            <div>External Flash</div>

            <div>{board.externalFlashSize} bytes</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ */}
      {/* PROGRESS */}
      {/* ------------------------------------------------------ */}

      <div className="mb-5">
        <div className="flex justify-between mb-2">
          <span>{stage}</span>

          <span>{progress.toFixed(1)}%</span>
        </div>

        <div className="w-full h-4 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="mt-2 text-gray-400">{status}</p>
      </div>

      {/* ------------------------------------------------------ */}
      {/* ERROR */}
      {/* ------------------------------------------------------ */}

      {error && (
        <div className="mb-5 p-3 bg-red-900/40 border border-red-700 rounded">
          {error}
        </div>
      )}

      {/* ------------------------------------------------------ */}
      {/* BUTTONS */}
      {/* ------------------------------------------------------ */}

      <div className="flex gap-3 mb-6">
        <button
          onClick={handleIdentify}
          disabled={flashing || !selectedPort}
          className="px-5 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Identify Board
        </button>

        {!flashing ? (
          <button
            onClick={handleFlash}
            disabled={!selectedPort || !firmwarePath}
            className="px-5 py-2 bg-green-600 rounded disabled:opacity-50"
          >
            Flash Firmware
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="px-5 py-2 bg-red-600 rounded"
          >
            Cancel
          </button>
        )}

        {firmwareReadyToReconnect && (
          <button
            onClick={handleReconnect}
            disabled={reconnecting}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-semibold"
          >
            {reconnecting ? "Reconnecting..." : "Reconnect"}
          </button>
        )}
      </div>

      {/* ------------------------------------------------------ */}
      {/* LOG */}
      {/* ------------------------------------------------------ */}

      <div>
        <h2 className="font-bold mb-2">Uploader Output</h2>

        <div className="bg-black border border-gray-800 rounded p-3 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-gray-500">No output yet.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
