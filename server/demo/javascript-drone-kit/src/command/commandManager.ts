import { common } from "node-mavlink";
import { MavlinkEngine } from "../mavlink/MavlinkEngine.js";

export class CommandManager {
  constructor(private readonly mavlink: MavlinkEngine) {}

  async arm(systemId: number, componentId: number): Promise<void> {
    console.log("========== ARM COMMAND ==========");
    console.log("Target system:", systemId);
    console.log("Target component:", componentId);

    const command = new common.CommandLong();

    command.targetSystem = systemId;
    command.targetComponent = componentId;

    command.command = 400;

    command.confirmation = 0;

    command._param1 = 1;

    console.log("COMMAND_LONG:");
    console.log(command);

    await this.mavlink.send(command);

    console.log("ARM MAVLink packet sent");
  }

  async disarm(systemId: number, componentId: number): Promise<void> {
    const command = new common.CommandLong();

    command.targetSystem = systemId;
    command.targetComponent = componentId;

    command.command = common.MavCmd.COMPONENT_ARM_DISARM;

    command.confirmation = 0;

    // 0 = DISARM
    command._param1 = 0;

    await this.mavlink.send(command);
  }

  async setMode(
    systemId: number,
    componentId: number,
    customMode: number,
  ): Promise<void> {
    const command = new common.CommandLong();

    command.targetSystem = systemId;
    command.targetComponent = componentId;

    command.command = common.MavCmd.DO_SET_MODE;

    command.confirmation = 0;

    // MAV_MODE_FLAG_CUSTOM_MODE_ENABLED
    command._param1 = 1;

    // ArduPilot custom mode
    command._param2 = customMode;

    command._param3 = 0;

    await this.mavlink.send(command);
  }
}
