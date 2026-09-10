import { EventEmitter } from "node:events";
import { MavlinkEngine } from "../mavlink/MavlinkEngine";

import { Telemetry } from "./telemetry.js";
// import { CommandManager } from "../command/commandManager";
import { CommandManager } from "../command/commandManager.js";
import { Messages } from "./messages";
import { COPTER_MODES, getCopterModeNumber } from "./mode.js";

export interface MavlinkMessage {
  name: string;
  messageId: number;
  systemId: number;
  componentId: number;
  data: any;
}

export class Vehicle extends EventEmitter {
  private systemId: number | null = null;
  private componentId: number | null = null;

  public readonly messages = new Messages();

  private readonly commands: CommandManager;

  private connected = false;
  private armed = false;

  private mode: string | null = null;

  private lastHeartbeat = 0;

  private heartbeatTimeout: NodeJS.Timeout | null = null;
  public readonly telemetry = new Telemetry();

  constructor(private readonly mavlink: MavlinkEngine) {
    super();

    this.commands = new CommandManager(mavlink);

    console.log("VEHICLE CREATED");

    this.handleMessage = this.handleMessage.bind(this);

    console.log("VEHICLE SUBSCRIBING TO MAVLINK");

    this.mavlink.on("message", this.handleMessage);

    console.log("VEHICLE SUBSCRIBED");
  }

  waitUntilConnected(): Promise<void> {
    if (this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.once("connected", resolve);
    });
  }

  private handleMessage(packet: MavlinkMessage): void {
    if (!packet) {
      return;
    }

    this.messages.update(packet);

    /*
     * HEARTBEAT
     *
     * MAVLink message ID 0
     */
    if (packet.messageId === 0) {
      this.handleHeartbeat(packet);
    }

    if (packet.messageId === 30) {
      this.telemetry.updateAttitude(packet.data);
    }
  }

  private handleHeartbeat(packet: MavlinkMessage): void {
    this.systemId = packet.systemId;
    this.componentId = packet.componentId;

    this.lastHeartbeat = Date.now();

    /*
     * MAVLink HEARTBEAT base_mode contains
     * the armed flag.
     *
     * MAV_MODE_FLAG_SAFETY_ARMED = 128
     */

    const baseMode = packet.data.baseMode;

    this.armed = (baseMode & 128) !== 0;

    /*
     * HEARTBEAT also contains customMode.
     *
     * We won't translate it into a readable
     * ArduPilot mode yet.
     */

    const customMode = Number(packet.data.customMode);

    this.mode = COPTER_MODES[customMode] ?? `UNKNOWN(${customMode})`;

    if (!this.connected) {
      this.connected = true;

      console.log(
        `Vehicle connected: system=${this.systemId}, component=${this.componentId}`,
      );

      this.emit("connected");
    }

    this.emit("heartbeat", packet.data);

    this.startHeartbeatMonitor();
  }

  private startHeartbeatMonitor(): void {
    if (this.heartbeatTimeout) {
      return;
    }

    this.heartbeatTimeout = setInterval(() => {
      const elapsed = Date.now() - this.lastHeartbeat;

      /*
       * If we haven't received a heartbeat for
       * 3 seconds, consider the vehicle disconnected.
       */
      if (elapsed > 3000 && this.connected) {
        this.connected = false;

        console.log("Vehicle disconnected");

        this.emit("disconnected");
      }
    }, 1000);
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get isArmed(): boolean {
    return this.armed;
  }

  get system(): number | null {
    return this.systemId;
  }

  get component(): number | null {
    return this.componentId;
  }

  get flightMode(): string | null {
    return this.mode;
  }

  get lastHeartbeatTime(): number {
    return this.lastHeartbeat;
  }

  async arm(): Promise<void> {
    if (this.systemId === null || this.componentId === null) {
      throw new Error("Vehicle is not connected");
    }

    await this.commands.arm(this.systemId, this.componentId);
  }

  async disarm(): Promise<void> {
    if (this.systemId === null || this.componentId === null) {
      throw new Error("Vehicle is not connected");
    }

    await this.commands.disarm(this.systemId, this.componentId);
  }

  getMode(): string | null {
    return this.mode;
  }

  async setMode(mode: string): Promise<void> {
    if (this.systemId === null || this.componentId === null) {
      throw new Error("Vehicle is not connected");
    }

    const customMode = getCopterModeNumber(mode);

    await this.commands.setMode(this.systemId, this.componentId, customMode);
  }

  destroy(): void {
    this.mavlink.off("message", this.handleMessage);

    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    this.removeAllListeners();
  }
}
