import { MavLinkPacketSplitter, MavLinkPacketParser } from "node-mavlink";

import { REGISTRY } from "./registry.js";

export class MavlinkEngine {
  private splitter = new MavLinkPacketSplitter();
  private parser = new MavLinkPacketParser();

  start(connection: {
    on(event: "data", listener: (chunk: Buffer) => void): void;
  }) {
    this.splitter.pipe(this.parser);

    connection.on("data", (chunk) => {
      this.splitter.write(chunk);
    });

    this.parser.on("data", (packet) => {
      this.handlePacket(packet);
    });

    this.parser.on("error", (error) => {
      console.error("MAVLink parser error:", error);
    });

    console.log("MAVLink engine started");
  }

  private handlePacket(packet: any) {
    if (!packet?.header) {
      return;
    }

    const Clazz = REGISTRY[packet.header.msgid];

    if (!Clazz) {
      console.log(`Unknown MAVLink message: ${packet.header.msgid}`);
      return;
    }

    const message = packet.protocol.data(packet.payload, Clazz);

    console.log("────────────────────────────");
    console.log(`MAVLink: ${Clazz.name}`);
    console.log("Message ID:", packet.header.msgid);
    console.log("System ID:", packet.header.sysid);
    console.log("Component ID:", packet.header.compid);
    console.log("Data:", message);
  }
}
