// import { UdpConnection } from "./connection/UdpConnection.js";
// import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";
// import { Vehicle } from "./vehical/vehical.js";
// import { CommandManager } from "./command/commandManager.js";

// export interface ConnectOptions {
//   connection: string;
// }

// export async function connect(options: ConnectOptions): Promise<Vehicle> {
//   const url = new URL(options.connection);

//   if (url.protocol !== "udp:") {
//     throw new Error(`Unsupported connection type: ${url.protocol}`);
//   }

//   const host = url.hostname;
//   const port = Number(url.port);

//   if (!host || !port) {
//     throw new Error("Invalid UDP connection URL");
//   }

//   const connection = new UdpConnection(host, port);

//   const mavlink = new MavlinkEngine();

//   const vehicle = new Vehicle(mavlink);

//   const commands = new CommandManager(mavlink);

//   mavlink.start(connection);

//   await connection.connect();

//   await vehicle.waitUntilConnected();

//   return vehicle;
// }

import { UdpConnection } from "./connection/UdpConnection.js";
import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";
import { Vehicle } from "./vehical/vehical.js";

export interface ConnectOptions {
  connection: string;
}

export async function connect(options: ConnectOptions): Promise<Vehicle> {
  // --------------------------------
  // 1. Parse connection URL
  // --------------------------------

  const url = new URL(options.connection);

  if (url.protocol !== "udp:") {
    throw new Error(`Unsupported connection type: ${url.protocol}`);
  }

  const host = url.hostname;
  const port = Number(url.port);

  if (!host || !port) {
    throw new Error("Invalid UDP connection URL");
  }

  // --------------------------------
  // 2. Create UDP connection
  // --------------------------------

  const connection = new UdpConnection(host, port);

  // --------------------------------
  // 3. Create MAVLink engine
  // --------------------------------

  const mavlink = new MavlinkEngine();

  // --------------------------------
  // 4. Create Vehicle
  // --------------------------------

  const vehicle = new Vehicle(mavlink);

  // --------------------------------
  // 5. Start MAVLink processing
  // --------------------------------

  mavlink.start(connection);

  // --------------------------------
  // 6. Open UDP socket
  // --------------------------------

  await connection.connect();

  // --------------------------------
  // 7. Wait for actual vehicle
  // --------------------------------

  await vehicle.waitUntilConnected();

  // --------------------------------
  // 8. Return ready Vehicle
  // --------------------------------

  return vehicle;
}
