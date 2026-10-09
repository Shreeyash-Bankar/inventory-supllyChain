import dgram from "node:dgram";
import { EventEmitter } from "node:events";

export class UdpTransport extends EventEmitter {
  constructor({ localPort }) {
    super();
    this.localPort = parseInt(localPort, 10) || 14552;
    this.socket = null;
    this.isOpen = false;

    this.remoteIp = null;
    this.remotePort = null;
  }

  open(callback) {
    try {
      // console.log(
      //   `[UDP-TRANSPORT]  Attempting to bind socket to local port: ${this.localPort}`,
      // );
      this.socket = dgram.createSocket("udp4");

      this.socket.on("listening", () => {
        this.isOpen = true;
        const address = this.socket.address();
        // console.log(
        //   `[UDP-TRANSPORT]  Socket listening on ${address.address}:${address.port}`,
        // );
        this.emit("open");
        if (callback) callback(null);
      });

      // this.socket.on("message", (msg, rinfo) => {
      //   // Log raw metrics for incoming packets
      //   // console.log(
      //   //   `[UDP-TRANSPORT]  Received ${msg.length} bytes from remote source ${rinfo.address}:${rinfo.port}`,
      //   // );

      //   // Track changes to target routing
      //   if (this.remoteIp !== rinfo.address || this.remotePort !== rinfo.port) {
      //     // console.log(
      //     //   `[UDP-TRANSPORT]  Target Drone Discovered/Changed! Target: ${rinfo.address}:${rinfo.port}`,
      //     // );
      //     this.remoteIp = rinfo.address;
      //     this.remotePort = rinfo.port;
      //   }

      //   // Print sample bytes to see if it resembles MAVLink (0xFE = 254, 0xFD = 253)
      //   // if (msg.length > 0) {
      //   //   console.log(
      //   //     `[UDP-TRANSPORT]  First 3 raw packet bytes: [${msg[0]}, ${msg[1] || 0}, ${msg[2] || 0}]`,
      //   //   );
      //   // }

      //   this.emit("data", msg);
      // });

      this.socket.on("message", (msg, rinfo) => {
        console.log(
          `[UDP-TRANSPORT] RECEIVED ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`,
        );

        // if (msg.length > 0) {
        //   console.log(`[UDP-TRANSPORT] First bytes:`, [...msg.subarray(0, 10)]);
        // }

        if (this.remoteIp !== rinfo.address || this.remotePort !== rinfo.port) {
          this.remoteIp = rinfo.address;
          this.remotePort = rinfo.port;

          // console.log(
          //   `[UDP-TRANSPORT] Remote discovered: ${this.remoteIp}:${this.remotePort}`,
          // );
        }

        this.emit("data", msg);
      });
      this.socket.on("error", (err) => {
        console.error(`[UDP-TRANSPORT]  Socket error encountered:`, err);
        this.emit("error", err);
      });

      this.socket.on("close", () => {
        console.log("[UDP-TRANSPORT]  Socket closed cleanly.");
        this.isOpen = false;
        this.emit("close");
      });

      this.socket.bind(this.localPort, "0.0.0.0");
    } catch (err) {
      console.error("[UDP-TRANSPORT]  Synchronous opening failure:", err);
      if (callback) callback(err);
    }
  }

  write(buffer, callback) {
    if (!this.isOpen || !this.socket) {
      console.error(
        "[UDP-TRANSPORT]  Drop outgoing packet: Socket is not open.",
      );
      if (callback) callback(new Error("UDP Socket is closed"));
      return;
    }

    // CRITICAL WARN: If routing hasn't locked onto a drone yet
    if (!this.remoteIp || !this.remotePort) {
      console.warn(
        `[UDP-TRANSPORT]  Drop outgoing write (${buffer.length} bytes): No drone target discovered yet via incoming packets.`,
      );
      if (callback)
        callback(new Error("No drone target discovered yet via UDP"));
      return;
    }

    // console.log(
    //   `[UDP-TRANSPORT]  Sending ${buffer.length} bytes outbound to target ${this.remoteIp}:${this.remotePort}`,
    // );

    this.socket.send(
      buffer,
      0,
      buffer.length,
      this.remotePort,
      this.remoteIp,
      (err) => {
        if (err) {
          console.error(
            `[UDP-TRANSPORT]  Outbound write transmission failed:`,
            err,
          );
        }
        if (callback) callback(err);
      },
    );
  }

  close(callback) {
    console.log("[UDP-TRANSPORT] Explicitly executing close command...");
    if (this.socket) {
      this.socket.close();
    }
    if (callback) callback();
  }

  drain() {
    console.log("[UDP-TRANSPORT]  Drain invoked (No-op for UDP).");
  }
}
