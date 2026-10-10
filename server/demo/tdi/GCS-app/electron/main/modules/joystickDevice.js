import HID from "node-hid";

export class JoystickDevice {
  constructor() {
    this.device = null;
    this.callback = null;
  }

  start(vendorId, productId) {
    this.device = new HID.HID(vendorId, productId);

    this.device.on("data", (data) => {
      if (this.callback) this.callback(data);
    });

    this.device.on("error", (err) => {
      console.log("Joystick error", err);
    });
  }

  onData(cb) {
    this.callback = cb;
  }

  stop() {
    if (this.device) {
      this.device.close();
    }
  }
}
