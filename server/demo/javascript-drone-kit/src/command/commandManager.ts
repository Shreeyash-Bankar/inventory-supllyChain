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

  async simpleGoTo(
    systemId: number,
    componentId: number,
    lat: number,
    lon: number,
    alt: number = 10,
  ): Promise<void> {
    const msg = new common.SetPositionTargetGlobalInt();
    const demoMsg = new common.NavWaypointCommand();

    msg.timeBootMs = Date.now() & 0xffffffff;
    msg.targetSystem = systemId;
    msg.targetComponent = componentId;

    msg.coordinateFrame = 3;

    msg.latInt = Math.round(lat * 1e7);
    msg.lonInt = Math.round(lon * 1e7);

    msg.alt = alt;

    msg.typeMask =
      0b0000111111000111 as unknown as common.PositionTargetTypemask;

    // Initialize unmapped mandatory MAVLink float payload parameters
    msg.vx = 0;
    msg.vy = 0;
    msg.vz = 0;
    msg.afx = 0;
    msg.afy = 0;
    msg.afz = 0;
    msg.yaw = 0;
    msg.yawRate = 0;

    await this.mavlink.send(msg);
  }

  async navigateToWayPoint(
    systemId: number,
    componentId: number,
    lat: number,
    lon: number,
    alt: number = 10,
  ): Promise<void> {
    const command = new common.CommandLong();

    command.targetSystem = systemId;
    command.targetComponent = componentId;

    // MAV_CMD_NAV_WAYPOINT = 16
    command.command = common.MavCmd.NAV_WAYPOINT ?? 16;
    command.confirmation = 0;

    // Param 1: Hold time (0s = proceed immediately upon reaching)
    command._param1 = 0;

    // Param 2: Acceptance radius (e.g., 2 meters)
    command._param2 = 2;

    // Param 3: Pass Radius (0 = fly directly through the center)
    command._param3 = 0;

    // Param 4: Yaw (NaN options default to vehicle's auto-heading setting)
    command._param4 = Number.NaN;

    // Param 5, 6, 7: Coordinates (CommandLong takes regular floats, not scaled 1E7 integers)
    command._param5 = lat;
    command._param6 = lon;
    command._param7 = alt;

    console.log(
      `Sending NAV_WAYPOINT Command to [Lat: ${lat}, Lon: ${lon}, Alt: ${alt}]`,
    );
    await this.mavlink.send(command);
  }

  async takeOff(systemId: number, componentId: number, alt: number) {
    const command = new common.CommandLong();

    command.targetSystem = systemId;
    command.targetComponent = componentId;
    command.command = 22;
    command._param1 = 0;
    command._param2 = 0;
    command._param3 = 0;
    command._param4 = 0;
    command._param5 = 0;
    command._param6 = 0;
    command._param7 = alt;

    await this.mavlink.send(command);
  }

  async repostionTo(
    systemId: number,
    componentId: number,
    alt: number,
    lat: number,
    lon: number,
  ) {
    const command = new common.CommandInt();
    command.targetSystem = systemId;
    command.targetComponent = componentId;
    command.frame = 6;
    command.command = 192;
    command.autocontinue = 0;
    command._param1 = -1;
    command._param2 = 1;
    command._param3 = 0;
    command._param4 = NaN;
    command._param5 = Math.round(lat * 1e7);
    command._param6 = Math.round(lon * 1e7);
    command._param7 = alt;

    await this.mavlink.send(command);
  }

  async setGuidedPosition(
    systemId: number,
    componentId: number,
    lat: number,
    lon: number,
    alt: number = 10,
  ): Promise<void> {
    console.log(`Target: ${lat}, ${lon}, ${alt}m`);

    const msg = new common.SetPositionTargetGlobalInt();

    msg.timeBootMs = 0;

    msg.targetSystem = systemId;
    msg.targetComponent = componentId;

    // MAV_FRAME_GLOBAL_RELATIVE_ALT_INT
    // lat/lon = global GPS coordinates
    // alt = meters relative to HOME
    msg.coordinateFrame = 6;

    msg.latInt = Math.round(lat * 1e7);
    msg.lonInt = Math.round(lon * 1e7);
    msg.alt = alt;

    /*
     * POSITION-ONLY target
     *
     * bit 0  X       = 0 → USE
     * bit 1  Y       = 0 → USE
     * bit 2  Z       = 0 → USE
     *
     * bit 3  VX      = 1 → IGNORE
     * bit 4  VY      = 1 → IGNORE
     * bit 5  VZ      = 1 → IGNORE
     *
     * bit 6  AX      = 1 → IGNORE
     * bit 7  AY      = 1 → IGNORE
     * bit 8  AZ      = 1 → IGNORE
     *
     * bit 9  force   = 0
     *
     * bit 10 yaw     = 1 → IGNORE
     * bit 11 yawRate = 1 → IGNORE
     *
     * = 0b110111111000
     * = 3576
     */
    msg.typeMask = 3576 as unknown as common.PositionTargetTypemask;

    // node-mavlink requires these payload fields even though
    // ArduPilot will ignore them according to typeMask.
    msg.vx = 0;
    msg.vy = 0;
    msg.vz = 0;

    msg.afx = 0;
    msg.afy = 0;
    msg.afz = 0;

    msg.yaw = 0;
    msg.yawRate = 0;

    await this.mavlink.send(msg);

    console.log(
      `[GUIDED GOTO] Sent Lat=${lat}, Lon=${lon}, RelativeAlt=${alt}m`,
    );
  }
}
