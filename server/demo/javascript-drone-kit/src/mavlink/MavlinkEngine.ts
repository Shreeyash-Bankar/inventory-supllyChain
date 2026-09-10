// import { MavLinkPacketSplitter, MavLinkPacketParser } from "node-mavlink";

// import { REGISTRY } from "./registry.js";

// export class MavlinkEngine {
//   private splitter = new MavLinkPacketSplitter();
//   private parser = new MavLinkPacketParser();

//   start(connection: {
//     on(event: "data", listener: (chunk: Buffer) => void): void;
//   }) {
//     this.splitter.pipe(this.parser);

//     connection.on("data", (chunk) => {
//       this.splitter.write(chunk);
//     });

//     this.parser.on("data", (packet) => {
//       this.handlePacket(packet);
//     });

//     this.parser.on("error", (error) => {
//       console.error("MAVLink parser error:", error);
//     });

//     console.log("MAVLink engine started");
//   }

//   private handlePacket(packet: any) {
//     if (!packet?.header) {
//       return;
//     }

//     const Clazz = REGISTRY[packet.header.msgid];

//     if (!Clazz) {
//       console.log(`Unknown MAVLink message: ${packet.header.msgid}`);
//       return;
//     }

//     const message = packet.protocol.data(packet.payload, Clazz);

//     console.log("────────────────────────────");
//     console.log(`MAVLink: ${Clazz.name}`);
//     console.log("Message ID:", packet.header.msgid);
//     console.log("System ID:", packet.header.sysid);
//     console.log("Component ID:", packet.header.compid);
//     console.log("Data:", message);
//   }
// }

/////////////////////////
//////////////////////////
/////////////////////////

// import { MavLinkPacketSplitter, MavLinkPacketParser } from "node-mavlink";
// import { MavlinkMessage } from "./MavlinkMessage.js";
// import { EventEmitter } from "node:events";

// import { REGISTRY } from "./registry.js";

// export class MavlinkEngine extends EventEmitter {
//   private splitter = new MavLinkPacketSplitter();
//   private parser = new MavLinkPacketParser();

//   start(connection: {
//     on(event: "data", listener: (chunk: Buffer) => void): void;
//   }): void {
//     this.splitter.pipe(this.parser);

//     connection.on("data", (chunk) => {
//       this.splitter.write(chunk);
//     });

//     this.parser.on("data", (packet) => {
//       this.handlePacket(packet);
//     });

//     this.parser.on("error", (error) => {
//       console.error("MAVLink parser error:", error);
//     });

//     console.log("MAVLink engine started");
//   }

//   // private handlePacket(packet: any): void {
//   //   if (!packet?.header) {
//   //     return;
//   //   }

//   //   const messageId = packet.header.msgid;

//   //   const Clazz = REGISTRY[messageId];

//   //   if (!Clazz) {
//   //     console.log(`Unknown MAVLink message: ${messageId}`);
//   //     return;
//   //   }

//   //   const message = packet.protocol.data(packet.payload, Clazz);

//   //   this.emit("message", {
//   //     name: Clazz.name,
//   //     messageId,
//   //     systemId: packet.header.sysid,
//   //     componentId: packet.header.compid,
//   //     data: message,
//   //   });
//   // }

//   private handlePacket(packet: any): void {
//     if (!packet?.header) {
//       return;
//     }

//     const messageId = packet.header.msgid;

//     const Clazz = REGISTRY[messageId];

//     if (!Clazz) {
//       console.log(`Unknown MAVLink message: ${messageId}`);
//       return;
//     }

//     const message = packet.protocol.data(packet.payload, Clazz);

//     const output: MavlinkMessage = {
//       name: Clazz.name,
//       messageId,
//       systemId: packet.header.sysid,
//       componentId: packet.header.compid,
//       data: message,
//     };

//     // console.log("ENGINE EMITTING:", output.name, output.messageId);

//     this.emit("message", output);
//   }
// }

// ///////////////////////////
// /////////////////////////
// ////////////////////////

// import {
//   MavLinkPacketSplitter,
//   MavLinkPacketParser,
//   MavLinkProtocolV2,
// } from "node-mavlink";

// import { EventEmitter } from "node:events";

// import { REGISTRY } from "./registry.js";

// export class MavlinkEngine extends EventEmitter {
//   private splitter = new MavLinkPacketSplitter();
//   private parser = new MavLinkPacketParser();

//   private connection: {
//     on(event: "data", listener: (chunk: Buffer) => void): void;
//     send(data: Buffer): Promise<void>;
//   } | null = null;

//   start(connection: {
//     on(event: "data", listener: (chunk: Buffer) => void): void;
//     send(data: Buffer): Promise<void>;
//   }): void {
//     this.connection = connection;

//     this.splitter.pipe(this.parser);

//     connection.on("data", (chunk) => {
//       this.splitter.write(chunk);
//     });

//     this.parser.on("data", (packet) => {
//       this.handlePacket(packet);
//     });

//     this.parser.on("error", (error) => {
//       console.error("MAVLink parser error:", error);
//     });

//     console.log("MAVLink engine started");
//   }

//   async send(message: any): Promise<void> {
//     if (!this.connection) {
//       throw new Error("MAVLink engine is not started");
//     }

//     const protocol = new MavLinkProtocolV2();

//     const buffer = protocol.pack(message);

//     await this.connection.send(buffer);
//   }

//   private handlePacket(packet: any): void {
//     if (!packet?.header) {
//       return;
//     }

//     const messageId = packet.header.msgid;

//     const Clazz = REGISTRY[messageId];

//     if (!Clazz) {
//       console.log(`Unknown MAVLink message: ${messageId}`);
//       return;
//     }

//     const message = packet.protocol.data(packet.payload, Clazz);

//     const output = {
//       name: Clazz.name,
//       messageId,
//       systemId: packet.header.sysid,
//       componentId: packet.header.compid,
//       data: message,
//     };

//     this.emit("message", output);
//   }
// }

//////////////////
////////////////////
///////////////////
//////////////////
import {
  MavLinkPacketSplitter,
  MavLinkPacketParser,
  MavLinkProtocolV2,
  send,
} from "node-mavlink";

import { EventEmitter } from "node:events";

import { REGISTRY } from "./registry.js";
import { UdpConnection } from "../connection/UdpConnection.js";

export class MavlinkEngine extends EventEmitter {
  private splitter = new MavLinkPacketSplitter();
  private parser = new MavLinkPacketParser();

  private connection: UdpConnection | null = null;

  start(connection: UdpConnection): void {
    this.connection = connection;

    this.splitter.pipe(this.parser);

    connection.on("data", (chunk: Buffer) => {
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

  async send(message: any): Promise<void> {
    if (!this.connection) {
      throw new Error("MAVLink engine is not started");
    }

    const protocol = new MavLinkProtocolV2();

    await send(this.connection, message, protocol);
  }

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

    this.emit("message", output);
  }
}