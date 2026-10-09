export class JoystickMapper {
  constructor(calibration, profile) {
    this.cal = calibration;

    this.profile = profile;
  }

  map(raw) {
    let output = {};

    for (let control of ["roll", "pitch", "yaw", "throttle"]) {
      let cfg = this.profile[control];

      let value = this.cal.normalize(cfg.axis, raw[cfg.axis]);

      if (cfg.invert) value = -value;

      output[control] = value;
    }

    return output;
  }
}
