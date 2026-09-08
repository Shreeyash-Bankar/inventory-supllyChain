
import { MavLinkPacketSplitter, MavLinkPacketParser } from "node-mavlink";

import { EventEmitter } from "node:events";

import { REGISTRY } from "./registry.js";

export class MavlinkEngine extends EventEmitter {
  private splitter = new MavLinkPacketSplitter();
  private parser = new MavLinkPacketParser();

  start(connection: {
    on(event: "data", listener: (chunk: Buffer) => void): void;
  }): void {
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

  // private handlePacket(packet: any): void {
  //   if (!packet?.header) {
  //     return;
  //   }

  //   const messageId = packet.header.msgid;

  //   const Clazz = REGISTRY[messageId];

  //   if (!Clazz) {
  //     console.log(`Unknown MAVLink message: ${messageId}`);
  //     return;
  //   }

  //   const message = packet.protocol.data(packet.payload, Clazz);

  //   this.emit("message", {
  //     name: Clazz.name,
  //     messageId,
  //     systemId: packet.header.sysid,
  //     componentId: packet.header.compid,
  //     data: message,
  //   });
  // }

  private handlePacket(packet: any): void {
    if (!packet?.header) {
      return;
    }

    const messageId = packet.header.msgid;

    const Clazz = REGISTRY[messageId];

    if (!Clazz) {
      console.log(`Unknown MAVLink message: ${messageId}`);
      return;
    }

    const message = packet.protocol.data(packet.payload, Clazz);

    const output = {
      name: Clazz.name,
      messageId,
      systemId: packet.header.sysid,
      componentId: packet.header.compid,
      data: message,
    };

    // console.log("ENGINE EMITTING:", output.name, output.messageId);

    this.emit("message", output);
  }
}