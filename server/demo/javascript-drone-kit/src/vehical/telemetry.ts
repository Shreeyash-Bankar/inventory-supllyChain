import { EventEmitter } from "node:events";

export interface Attitude {
  roll: number;
  pitch: number;
  yaw: number;
  rollSpeed: number;
  pitchSpeed: number;
  yawSpeed: number;
}

export class Telemetry extends EventEmitter {
  private _attitude: Attitude | null = null;

  get attitude(): Attitude | null {
    return this._attitude;
  }

  updateAttitude(message: any): void {
    this._attitude = {
      roll: Number(message.roll),
      pitch: Number(message.pitch),
      yaw: Number(message.yaw),
      rollSpeed: Number(message.rollspeed),
      pitchSpeed: Number(message.pitchspeed),
      yawSpeed: Number(message.yawspeed),
    };

    this.emit("attitude", this._attitude);
  }
}
