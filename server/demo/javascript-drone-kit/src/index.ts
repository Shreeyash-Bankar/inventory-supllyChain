import { UdpConnection } from "./connection/UdpConnection.js";
import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";

async function main() {
  console.log("Starting TypeScript DroneKit...");

  // 1. Create network connection
  const connection = new UdpConnection("127.0.0.1", 14552);

  // 2. Create MAVLink engine
  const mavlink = new MavlinkEngine();

  // 3. Start listening for MAVLink
  mavlink.start(connection);

  // 4. Connect UDP
  await connection.connect();
}

main();
