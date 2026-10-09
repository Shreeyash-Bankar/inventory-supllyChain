// modules/flightActionService.js
const MODE_MAP = {
  GUIDED: 4,
  AUTO: 3,
  RTL: 6,
  LOITER: 5,
  STABILIZE: 0,
};

const MODE_MAP_REVERSE = {
  4: "GUIDED",
  3: "AUTO",
  6: "RTL",
  5: "LOITER",
};
export class FlightActionService {
  constructor(commandService, paramService, flightState, telemetry) {
    this.commandLock = false;
    this.lastCommand = null;
    this.command = commandService;
    this.params = paramService;
    // this.telemetry = telemetry;
    this.flightState = flightState;
    const SAFE = false;
    this.lastAck = null;
  }

  onAck(command, status) {
    console.log(" ACK:", command, status);

    this.lastAck = { command, status };

    if (command === 400) {
      console.log("ARM command result:", status);
    }
  }

  async runExclusive(commandName, fn) {
    if (this.commandLock) {
      console.log(" Command blocked (busy):", commandName);
      return;
    }

    this.commandLock = true;
    this.lastCommand = commandName;

    try {
      await fn();
    } finally {
      setTimeout(() => {
        this.commandLock = false;
      }, 300); // small debounce window
    }
  }

  // -----------------------------
  // STATE UPDATE (from telemetry)
  // -----------------------------

  async flyTo(lat, lon, alt = 10) {
    const state = this.flightState.get();

    if (state.mode !== 4) {
      await this.guided();
      await this.delay(300);
    }

    await this.command.setGuidedPosition(lat, lon, alt);
  }

  // -----------------------------
  // SAFE ARM FLOW
  // -----------------------------
  async arm() {
    const state = this.flightState.get();
    if (state.armed) return;

    console.log(" Sending ARM command...");
    await this.command.arm();
    await this.waitForAck(400, 3000);
    console.log(" ARM sent (bypass mode)");
  }

  async disarm() {
    const state = this.flightState.get();

    if (!state.armed) return;

    // if (state.inAir) {
    //   console.log(" Cannot disarm in air");
    //   return;
    // }

    await this.command.disarm();
  }

  // -----------------------------
  // MODE CONTROL
  // -----------------------------
  async setMode(modeName) {
    const modeId = MODE_MAP[modeName];

    if (!modeId) {
      console.log(" Invalid mode:", modeName);
      return;
    }

    await this.command.setMode(modeId);

    console.log(" Mode command sent:", modeName);
  }

  async rtl() {
    const state = this.flightState.get();

    if (!state.armed) {
      console.log(" Not armed → arming first...");
      await this.arm();
      await this.delay(1000);
    }

    console.log(" Sending RTL...");
    await this.command.rtl();
  }

  async waitUntil(condition, timeout = 3000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (condition()) return true;
      await new Promise((r) => setTimeout(r, 100));
    }

    throw new Error("Timeout waiting");
  }

  async land() {
    console.log(" LAND command bypass mode");

    // direct command bypass mode system
    await this.command.land();
  }

  async loiter() {
    return this.setMode("LOITER");
  }

  async guided() {
    return this.setMode("GUIDED");
  }

  // -----------------------------
  // TAKEOFF FLOW (IMPORTANT)
  // -----------------------------
  async takeoff(altitude = 5) {
    const state = this.flightState.get();

    if (!state.armed) {
      console.log(" Not armed → arming...");
      await this.arm();
      await this.delay(1000);
    }

    if (state.mode !== 4) {
      // GUIDED
      console.log(" Not in GUIDED → switching...");
      await this.guided();
      await this.delay(500);
    }

    console.log(" Taking off...");
    await this.command.takeoff(altitude);
  }

  delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  waitForAck(commandName, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const interval = setInterval(() => {
        const ack = this.lastAck;

        if (ack?.command === commandName) {
          clearInterval(interval);
          resolve(ack.status);
        }

        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject("ACK timeout");
        }
      }, 100);
    });
  }
}
