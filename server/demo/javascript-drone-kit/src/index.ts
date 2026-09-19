
import { connect } from "./connect.js";

console.log("into the index.ts");

async function main() {
  try {
    const vehicle = await connect({
      connection: "udp://127.0.0.1:14554",
    });

    await vehicle.setMode("GUIDED");
    await vehicle.arm();
    await vehicle.takeOff(50);
    // await vehicle.navigateToWaypoint();
    async function asyncNavigate() {
      await vehicle.navigateToWaypoint(23.56, 33.25, 5);
    }
    // setTimeout(() => {
    //   console.log("Timeout Called");
    //   asyncNavigate();
    // }, 10000);

    console.log("vehicle object created");
    console.log("Connected:", vehicle.isConnected);
    console.log("System ID:", vehicle.system);
    console.log("Component ID:", vehicle.component);
    console.log("Flight Mode:", vehicle.flightMode);
    console.log("Armed:", vehicle.isArmed);
  } catch (error) {
    console.log("Error in establishing connection", error);
  }
}

main().catch((error) => {
  console.error("Application error:", error);
});