export const MAV_TYPE = {
  0: "GENERIC",
  1: "FIXED_WING",
  2: "QUADROTOR",
  3: "COAXIAL",
  4: "HELICOPTER",
  5: "ANTENNA_TRACKER",
  6: "GCS",
  7: "AIRSHIP",
  8: "FREE_BALLOON",
  9: "ROCKET",
  10: "GROUND_ROVER",
  11: "SURFACE_BOAT",
  12: "SUBMARINE",
  13: "HEXAROTOR",
  14: "OCTOROTOR",
  15: "TRICOPTER",
  16: "FLAPPING_WING",
  17: "KITE",
};

export const MAV_AUTOPILOT = {
  0: "GENERIC",
  1: "RESERVED",
  2: "SLUGS",
  3: "ARDUPILOTMEGA",
  4: "OPENPILOT",
  5: "GENERIC_WAYPOINTS",
  6: "GENERIC_WAYPOINTS_AND_SIMPLE_NAVIGATION",
  7: "GENERIC_MISSION_FULL",
  8: "INVALID",
  9: "PPZ",
  10: "UDB",
  11: "FP",
  12: "PX4",
};

export const MAV_STATE = {
  0: "UNINIT",
  1: "BOOT",
  2: "CALIBRATING",
  3: "STANDBY",
  4: "ACTIVE",
  5: "CRITICAL",
  6: "EMERGENCY",
  7: "POWEROFF",
  8: "FLIGHT_TERMINATION",
};

export const COPTER_MODES = {
  0: "STABILIZE",
  1: "ACRO",
  2: "ALT_HOLD",
  3: "AUTO",
  4: "GUIDED",
  5: "LOITER",
  6: "RTL",
  7: "CIRCLE",
  9: "LAND",
  11: "DRIFT",
  13: "SPORT",
  14: "FLIP",
  15: "AUTOTUNE",
  16: "POSHOLD",
  17: "BRAKE",
  18: "THROW",
  19: "AVOID_ADSB",
  20: "GUIDED_NOGPS",
  21: "SMART_RTL",
  22: "FLOWHOLD",
  23: "FOLLOW",
  24: "ZIGZAG",
  25: "SYSTEMID",
  26: "AUTOROTATE",
};

export function decodeBaseMode(baseMode) {
  return {
    armed: !!(baseMode & 128),
    guided: !!(baseMode & 8),
    auto: !!(baseMode & 4),
    stabilize: !!(baseMode & 16),
    manual: !!(baseMode & 64),
  };
}

export function decodeCustomMode(customMode) {
  return COPTER_MODES[customMode] || `MODE ${customMode}`;
}
