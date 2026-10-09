export class JoystickCalibration {
  constructor() {
    this.axes = {};
  }

  setAxis(name, min, max, center) {
    this.axes[name] = {
      min,
      max,
      center,
    };
  }

  normalize(name, value) {
    let a = this.axes[name];

    if (!a) return 0;

    let result;

    if (value > a.center) {
      result = (value - a.center) / (a.max - a.center);
    } else {
      result = (value - a.center) / (a.center - a.min);
    }

    return Math.max(-1, Math.min(1, result));
  }
}
