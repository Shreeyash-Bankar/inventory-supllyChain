import { spawn } from "node:child_process";
import path from "node:path";
import { app } from "electron";

export class FirmwareService {
  constructor({ win }) {
    this.win = win;
    this.process = null;
    this.cancelRequested = false;
  }

  // ============================================================
  // SEND EVENT TO REACT
  // ============================================================

  emit(event) {
    if (!this.win || this.win.isDestroyed()) {
      return;
    }

    this.win.webContents.send("firmware-event", event);
  }

  // ============================================================
  // PYTHON / UPLOADER PATH
  // ============================================================

  // getUploaderPath() {
  //   if (app.isPackaged) {
  //     return path.join(process.resourcesPath, "python", "uploader.py");
  //   }

  //   return path.join(app.getAppPath(), "electron", "python", "uploader.py");
  // }

  // getPythonCommand() {
  //   if (process.platform === "win32") {
  //     return "python";
  //   }

  //   return "python3";
  // }

  getUploaderPath() {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, "python", "uploader.exe");
    }

    return path.join(app.getAppPath(), "electron", "python", "uploader.exe");
  }

  // ============================================================
  // LIST SERIAL DEVICES
  // ============================================================

  async listDevices() {
    const { SerialPort } = await import("serialport");

    const ports = await SerialPort.list();

    return ports.map((p) => ({
      path: p.path,
      name: p.friendlyName || p.manufacturer || p.product || "Unknown device",

      manufacturer: p.manufacturer || null,
      serialNumber: p.serialNumber || null,
      vendorId: p.vendorId || null,
      productId: p.productId || null,
    }));
  }

  // ============================================================
  // IDENTIFY AUTOPILOT
  // ============================================================

  async identify(port, baudRate = 115200) {
    if (this.process) {
      throw new Error("Firmware operation already running.");
    }

    if (!port) {
      throw new Error("Serial port is required.");
    }

    const uploaderPath = this.getUploaderPath();

    // const args = [
    //   uploaderPath,

    //   "--port",
    //   port,

    //   "--baud-bootloader",
    //   String(baudRate),

    //   "--identify",
    // ];

    const args = [
      "--port",
      port,
      "--baud-bootloader",
      String(baudRate),
      "--identify",
    ];

    this.emit({
      type: "started",
      operation: "identify",
      port,
      baudRate,
    });

    return this.runPython(args);
  }

  // ============================================================
  // FLASH FIRMWARE
  // ============================================================

  async flash({
    path: port,
    firmwarePath,
    baudRate = 115200,
    flashBaudRate = null,
    force = false,
    fullErase = false,
  }) {
    if (this.process) {
      throw new Error("Firmware flashing is already running.");
    }

    if (!port) {
      throw new Error("Serial port is required.");
    }

    if (!firmwarePath) {
      throw new Error("Firmware file is required.");
    }

    const uploaderPath = this.getUploaderPath();

    // const args = [
    //   uploaderPath,

    //   "--port",
    //   port,

    //   "--baud-bootloader",
    //   String(baudRate),
    // ];

    const args = ["--port", port, "--baud-bootloader", String(baudRate)];

    if (flashBaudRate) {
      args.push("--baud-bootloader-flash", String(flashBaudRate));
    }

    if (force) {
      args.push("--force");
    }

    if (fullErase) {
      args.push("--force-erase");
    }

    // IMPORTANT:
    // firmware path must be the LAST positional argument.
    args.push(firmwarePath);

    // console.log("[FIRMWARE] Starting uploader:", this.getPythonCommand(), args);
    console.log("[FIRMWARE] Starting uploader:", uploaderPath, args);

    this.emit({
      type: "started",
      operation: "flash",
      port,
      firmwarePath,
      baudRate,
      flashBaudRate,
      force,
      fullErase,
    });

    return this.runPython(args);
  }

  // ============================================================
  // RUN PYTHON PROCESS
  // ============================================================

  runPython(args) {
    return new Promise((resolve, reject) => {
      let stdoutBuffer = "";
      let stderrBuffer = "";

      this.cancelRequested = false;

      // const pythonCommand = this.getPythonCommand();

      // this.process = spawn(pythonCommand, args, {
      //   windowsHide: true,

      //   stdio: ["ignore", "pipe", "pipe"],
      // });

      const uploaderPath = this.getUploaderPath();

      console.log("[FIRMWARE] Starting uploader:", uploaderPath, args);

      this.process = spawn(uploaderPath, args, {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      // --------------------------------------------------------
      // PROCESS START
      // --------------------------------------------------------

      this.emit({
        type: "process-started",
        message: "Firmware uploader process started.",
      });

      // --------------------------------------------------------
      // STDOUT
      // --------------------------------------------------------

      this.process.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();

        /*
         * uploader.py uses both:
         *
         *   \n
         *
         * and
         *
         *   \r
         *
         * for progress bars.
         *
         * Therefore split on BOTH.
         */

        const lines = stdoutBuffer.split(/[\r\n]+/);

        stdoutBuffer = lines.pop() || "";

        for (const line of lines) {
          this.handlePythonOutput(line);
        }
      });

      // --------------------------------------------------------
      // STDERR
      // --------------------------------------------------------

      this.process.stdout.on("data", (data) => {
        stdoutBuffer += data.toString();

        // ------------------------------------------------------------
        // Extract structured FIRMWARE_EVENT messages immediately.
        //
        // Do NOT depend on \n or \r because the uploader's visual
        // progress bar also uses carriage returns.
        // ------------------------------------------------------------

        const prefix = "FIRMWARE_EVENT:";

        while (true) {
          const start = stdoutBuffer.indexOf(prefix);

          if (start === -1) {
            break;
          }

          // Anything before FIRMWARE_EVENT is normal uploader output.
          const normalOutput = stdoutBuffer.slice(0, start);

          if (normalOutput.trim()) {
            const cleaned = normalOutput.replace(/[\r\n]+/g, " ").trim();

            if (cleaned) {
              this.handlePythonOutput(cleaned);
            }
          }

          // Remove everything before FIRMWARE_EVENT.
          stdoutBuffer = stdoutBuffer.slice(start + prefix.length);

          // Find the end of the JSON object.
          //
          // Events are emitted as one JSON object, so find the matching
          // closing brace instead of waiting for a newline.
          let depth = 0;
          let inString = false;
          let escaped = false;
          let end = -1;

          for (let i = 0; i < stdoutBuffer.length; i++) {
            const char = stdoutBuffer[i];

            if (escaped) {
              escaped = false;
              continue;
            }

            if (char === "\\") {
              escaped = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (inString) {
              continue;
            }

            if (char === "{") {
              depth++;
            } else if (char === "}") {
              depth--;

              if (depth === 0) {
                end = i;
                break;
              }
            }
          }

          // JSON object is incomplete. Wait for the next stdout chunk.
          if (end === -1) {
            stdoutBuffer = prefix + stdoutBuffer;
            break;
          }

          const jsonText = stdoutBuffer.slice(0, end + 1);

          stdoutBuffer = stdoutBuffer.slice(end + 1);

          try {
            const event = JSON.parse(jsonText);

            console.log("[FIRMWARE EVENT]", event);

            this.emit(event);
          } catch (error) {
            console.error(
              "[FIRMWARE] Failed to parse structured event:",
              jsonText,
              error,
            );
          }
        }

        // Keep only a small amount of normal stdout until the next
        // chunk arrives.
        //
        // This prevents a large progress-bar output from accumulating.
        if (stdoutBuffer.length > 10000) {
          const lastNewline = Math.max(
            stdoutBuffer.lastIndexOf("\n"),
            stdoutBuffer.lastIndexOf("\r"),
          );

          if (lastNewline >= 0) {
            const remaining = stdoutBuffer.slice(lastNewline + 1);

            if (remaining.trim()) {
              this.handlePythonOutput(remaining.trim());
            }

            stdoutBuffer = "";
          }
        }
      });

      // --------------------------------------------------------
      // PROCESS ERROR
      // --------------------------------------------------------

      this.process.on("error", (error) => {
        console.error("[FIRMWARE] Python process error:", error);

        this.emit({
          type: "error",
          message: error.message,
        });

        this.process = null;

        reject(error);
      });

      // --------------------------------------------------------
      // PROCESS FINISHED
      // --------------------------------------------------------

      this.process.on("close", (code) => {
        if (this.cancelRequested) {
          this.cancelRequested = false;
          this.process = null;

          console.log("[FIRMWARE] Firmware operation cancelled.");

          resolve({
            success: false,
            cancelled: true,
            code,
          });

          return;
        }
        // Process may have emitted a final partial line.
        // if (stdoutBuffer.trim()) {
        //   this.handlePythonOutput(stdoutBuffer);
        // }

        if (stdoutBuffer.trim()) {
          const remaining = stdoutBuffer.trim();

          // If something was left over, treat it as normal uploader output.
          if (!remaining.startsWith("FIRMWARE_EVENT:")) {
            this.handlePythonOutput(remaining);
          }
        }

        this.process = null;

        console.log("[FIRMWARE] Python process exited with code:", code);

        if (code === 0) {
          this.emit({
            type: "complete",
            success: true,
            code,
            message: "Firmware operation completed successfully.",
          });

          resolve({
            success: true,
            code,
          });

          return;
        }

        this.emit({
          type: "complete",
          success: false,
          code,
          message: stderrBuffer || "Firmware operation failed.",
        });

        resolve({
          success: false,
          code,
          message: stderrBuffer || "Firmware operation failed.",
        });
      });
    });
  }

  // ============================================================
  // HANDLE PYTHON OUTPUT
  // ============================================================

  handlePythonOutput(line) {
    if (!line) {
      return;
    }

    const prefix = "FIRMWARE_EVENT:";

    // ----------------------------------------------------------
    // STRUCTURED EVENT
    // ----------------------------------------------------------

    if (line.startsWith(prefix)) {
      const json = line.substring(prefix.length);

      try {
        const event = JSON.parse(json);

        console.log("[FIRMWARE EVENT]", event);

        this.emit(event);

        return;
      } catch (error) {
        console.error("[FIRMWARE] Failed to parse event:", json, error);
      }
    }

    // ----------------------------------------------------------
    // NORMAL PYTHON OUTPUT
    // ----------------------------------------------------------

    console.log("[FIRMWARE PYTHON]", line);

    this.emit({
      type: "log",
      stream: "stdout",
      message: line,
    });
  }

  // ============================================================
  // CANCEL
  // ============================================================

  async cancel() {
    if (!this.process) {
      return false;
    }

    this.cancelRequested = true;

    console.log("[FIRMWARE] Cancelling firmware operation.");

    this.process.kill();

    return true;
  }
}
