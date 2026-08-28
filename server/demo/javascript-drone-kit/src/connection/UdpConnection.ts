// import dgram from "node:dgram";

// export class UdpConnection {
//   private socket = dgram.createSocket("udp4");

//   constructor(
//     private readonly host: string,
//     private readonly port: number,
//   ) {}

//   connect(): Promise<void> {
//     return new Promise((resolve, reject) => {
//       this.socket.on("error", (error) => {
//         console.error("UDP socket error:", error);
//         reject(error);
//       });

//       this.socket.on("message", (message, remote) => {
//         console.log(
//           `Received ${message.length} bytes from ${remote.address}:${remote.port}`,
//         );

//         // console.log(message);
//         console.log(message.toString("hex"));
//       });

//       this.socket.bind(this.port, this.host, () => {
//         const address = this.socket.address();

//         console.log("UDP socket successfully bound:");
//         console.log(address);

//         resolve();
//       });
//     });
//   }

//   close(): void {
//     this.socket.close();
//   }
// }
import dgram from "node:dgram";
import { EventEmitter } from "node:events";

export class UdpConnection extends EventEmitter {
  private socket = dgram.createSocket("udp4");

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.on("error", (error) => {
        console.error("UDP error:", error);
        reject(error);
      });

      this.socket.on("message", (message, remote) => {
        console.log(
          `Received ${message.length} bytes from ${remote.address}:${remote.port}`,
        );

        // Give the raw data to whoever is interested
        this.emit("data", message);
      });

      this.socket.bind(this.port, this.host, () => {
        console.log(`UDP socket listening on ${this.host}:${this.port}`);

        resolve();
      });
    });
  }

  close(): void {
    this.socket.close();
  }
}
