
import { UdpConnection } from "./connection/UdpConnection.js";
import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";
import { Vehicle } from "./vehical/vehical.js";

import { connect } from "./connect.js";


async function main() {
  console.log("Starting TypeScript DroneKit...");

  const connection = new UdpConnection("127.0.0.1", 14552);

  const mavlink = new MavlinkEngine();

  const vehicle = new Vehicle(mavlink);

  vehicle.on("connected", () => {
    console.log(" Vehicle is connected");
  });

  vehicle.on("disconnected", () => {
    console.log(" Vehicle disconnected");
  });

  vehicle.on("heartbeat", (heartbeat) => {
    console.log(" Heartbeat received");
  });

  mavlink.on("message", (packet) => {
    console.log(`MAVLink message: ${packet.name}`);

    console.log("Message ID:", packet.messageId);
    console.log("System ID:", packet.systemId);
    console.log("Component ID:", packet.componentId);
    console.log("Data:", packet.data);
  });

  mavlink.start(connection);

  await connection.connect();
  setInterval(() => {
    console.log("============== VEHICLE STATE ==============");
    console.log("Connected:", vehicle.isConnected);
    console.log("System ID:", vehicle.system);
    console.log("Component ID:", vehicle.component);
    console.log("Armed:", vehicle.isArmed);
    console.log("Flight Mode:", vehicle.flightMode);
    console.log("Attitude:", vehicle.telemetry.attitude);
  }, 3000);
}

main().catch((error) => {
  console.error("Application error:", error);
});