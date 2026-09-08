import { UdpConnection } from "./connection/UdpConnection.js";
import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";
import { Vehicle } from "./vehical/vehical.js";

export interface ConnectOptions {
  connection: string;
}

export async function connect(options: ConnectOptions): Promise<Vehicle> {
  const url = new URL(options.connection);

  if (url.protocol !== "udp:") {
    throw new Error(`Unsupported connection type: ${url.protocol}`);
  }

  const host = url.hostname;
  const port = Number(url.port);

  if (!host || !port) {
    throw new Error("Invalid UDP connection URL");
  }

  const connection = new UdpConnection(host, port);

  const mavlink = new MavlinkEngine();

  const vehicle = new Vehicle(mavlink);

  mavlink.start(connection);

  await connection.connect();

  await vehicle.waitUntilConnected();

  return vehicle;
}
