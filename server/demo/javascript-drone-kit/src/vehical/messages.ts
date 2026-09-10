import { EventEmitter } from "node:events";
import { MavlinkMessage } from "../mavlink/MavlinkMessage.js";

export class Messages extends EventEmitter {
  private readonly latest = new Map<string, MavlinkMessage>();

  update(message: MavlinkMessage): void {
    this.latest.set(message.name, message);

    this.emit(message.name, message);
  }

  get(name: string): MavlinkMessage | undefined {
    return this.latest.get(name);
  }
}
