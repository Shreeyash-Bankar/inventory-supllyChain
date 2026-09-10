import dgram from "node:dgram";
import { Writable } from "node:stream";

export class UdpConnection extends Writable {
  private socket = dgram.createSocket("udp4");

  private remoteHost: string | null = null;
  private remotePort: number | null = null;

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

        this.remoteHost = remote.address;
        this.remotePort = remote.port;

        this.emit("data", message);
      });

      this.socket.bind(this.port, this.host, () => {
        console.log(`UDP socket listening on ${this.host}:${this.port}`);
        resolve();
      });
    });
  }

  override _write(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    if (this.remoteHost === null || this.remotePort === null) {
      callback(new Error("No remote MAVLink endpoint known"));
      return;
    }

    console.log(
      `Sending ${chunk.length} bytes to ${this.remoteHost}:${this.remotePort}`,
    );

    this.socket.send(chunk, this.remotePort, this.remoteHost, callback);
  }

  close(): void {
    this.socket.close();
  }
}
