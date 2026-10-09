import { common, send, MavLinkProtocolV2 } from "node-mavlink";

const gcsProtocolEngine = new MavLinkProtocolV2();
gcsProtocolEngine.sysid = 255;
gcsProtocolEngine.compid = 190;

export class ParamService {
  constructor(port, win) {
    this.port = port;
    this.win = win;
    this.params = {};
    this.pendingSets = new Map();
    this.targetSystem = 1;
    this.targetComponent = 1;
  }

  async requestAll() {
    console.log(" Requesting all parameters...");

    this.params = {};
    this.totalParams = 0;
    this.receivedCount = 0;

    const message = new common.ParamRequestList();

    message.targetSystem = this.targetSystem;
    message.targetComponent = this.targetComponent;

    try {
      await send(this.port, message, gcsProtocolEngine);
      console.log("PARAM_REQUEST_LIST sent");
    } catch (err) {
      console.error(" Send failed:", err);
    }
  }

  async setParam({ id, value, type }) {
    console.log(" Setting param:", id, value);

    const msg = new common.ParamSet();

    msg.targetSystem = this.targetSystem;
    msg.targetComponent = this.targetComponent;

    msg.paramId = id;
    msg.paramValue = value;
    msg.paramType = type;

    //  TRACK PENDING WRITE
    setTimeout(() => {
      if (this.pendingSets.has(id)) {
        this.win.webContents.send("param-set-result", {
          id,
          success: false,
          error: "timeout",
        });

        this.pendingSets.delete(id);
        console.log(" PARAM SET TIMEOUT:", id);
      }
    }, 3000);

    try {
      await send(this.port, msg, gcsProtocolEngine);
      console.log("PARAM_SET sent");
    } catch (err) {
      console.error(" PARAM_SET failed:", err);
      this.pendingSets.delete(id);
    }
  }

  handle(msg) {
    if (!msg?.paramId) return;

    const id = msg.paramId;

    // store latest value
    this.params[id] = {
      value: msg.paramValue,
      type: msg.paramType,
      index: msg.paramIndex,
    };

    if (this.pendingSets?.has(id)) {
      const pending = this.pendingSets.get(id);

      const isConfirmed =
        msg.paramId === id &&
        Math.abs(Number(msg.paramValue) - Number(pending.value)) < 0.0001;

      if (isConfirmed) {
        this.win.webContents.send("param-set-result", {
          id,
          success: true,
          value: msg.paramValue,
        });

        console.log(" PARAM CONFIRMED:", id);

        this.pendingSets.delete(id);
      }
    }

    // normal UI update
    this.win.webContents.send("param", {
      id: msg.paramId,
      value: msg.paramValue,
      type: msg.paramType,
      index: msg.paramIndex,
    });

    clearTimeout(this.completeTimer);

    this.completeTimer = setTimeout(() => {
      this.win.webContents.send("param-complete", {
        total: Object.keys(this.params).length,
        params: this.params,
      });
    }, 1000);
  }
}
