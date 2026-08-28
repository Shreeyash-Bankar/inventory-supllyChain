import net from "node:net";

export class TcpConnection {
  private socket = new net.Socket();

  constructor(
    private readonly host: string,
    private readonly port: number,
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.on("error", reject);

      this.socket.on("data", (data) => {
        console.log(`Received ${data.length} bytes`);
        console.log(data);
      });

      this.socket.connect(this.port, this.host, () => {
        console.log(`TCP connected to ${this.host}:${this.port}`);

        resolve();
      });
    });
  }

  close(): void {
    this.socket.destroy();
  }
}
