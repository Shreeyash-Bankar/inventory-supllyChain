// import { UdpConnection } from "./connection/UdpConnection.js";
// import { MavlinkEngine } from "./mavlink/MavlinkEngine.js";
// import { Vehicle } from "./vehical/vehical.js";
// import { connect } from "./connect.js";

// async function main() {
//   console.log("Starting TypeScript DroneKit...");

//   // --------------------------------
//   // 1. Create UDP connection
//   // --------------------------------

//   // const connection = new UdpConnection("127.0.0.1", 14552);
//   const connection = new UdpConnection("127.0.0.1", 14553);

//   // --------------------------------
//   // 2. Create MAVLink engine
//   // --------------------------------

//   const mavlink = new MavlinkEngine();

//   // --------------------------------
//   // 3. Create Vehicle
//   // --------------------------------

//   const vehicle = new Vehicle(mavlink);

//   // --------------------------------
//   // 4. Vehicle events
//   // --------------------------------

//   vehicle.on("connected", () => {
//     console.log("Vehicle is connected");
//   });

//   vehicle.on("disconnected", () => {
//     console.log("Vehicle disconnected");
//   });

//   vehicle.on("heartbeat", (heartbeat) => {
//     console.log("Heartbeat received");
//   });

//   // --------------------------------
//   // 5. Message subscriptions
//   // --------------------------------

//   vehicle.messages.on("EkfStatusReport", (message) => {
//     console.log("EKF STATUS:");
//     console.log(message);
//   });

//   // --------------------------------
//   // 6. Start MAVLink
//   // --------------------------------

//   mavlink.start(connection);

//   // --------------------------------
//   // 7. Connect UDP
//   // --------------------------------

//   await connection.connect();

//   console.log("UDP connection established");

//   // --------------------------------
//   // 8. Wait for the vehicle
//   // --------------------------------

//   console.log("Waiting for vehicle heartbeat...");

//   await vehicle.waitUntilConnected();

//   console.log("Vehicle is ready");

//   // --------------------------------
//   // 9. Vehicle information
//   // --------------------------------

//   console.log("System ID:", vehicle.system);
//   console.log("Component ID:", vehicle.component);
//   console.log("Current mode:", vehicle.getMode());
//   console.log("Armed:", vehicle.isArmed);

//   // --------------------------------
//   // 10. Set mode
//   // --------------------------------

//   console.log("Sending GUIDED mode command...");

//   await vehicle.setMode("GUIDED");

//   console.log("GUIDED mode command sent");

//   // --------------------------------
//   // 11. Arm
//   // --------------------------------

//   console.log("Sending ARM command...");

//   await vehicle.arm();

//   console.log("ARM command sent");

//   // --------------------------------
//   // 12. Continuously observe state
//   // --------------------------------

//   setInterval(() => {
//     console.log("============== VEHICLE STATE ==============");

//     console.log("Connected:", vehicle.isConnected);
//     console.log("System ID:", vehicle.system);
//     console.log("Component ID:", vehicle.component);
//     console.log("Armed:", vehicle.isArmed);
//     console.log("Flight Mode:", vehicle.getMode());
//   }, 3000);
// }

// main().catch((error) => {
//   console.error("Application error:", error);
// });

import { connect } from "./connect.js";
import { JoystickManager } from "./joystick/joystickManager.js";
import { defaultJoystickMapping } from "./joystick/joystickMapping.js";

console.log("into the index.ts");

async function main() {
  try {
    const vehicle = await connect({
      connection: "udp://127.0.0.1:14554",
    });

    const joystick = new JoystickManager(defaultJoystickMapping);
    // -----------------------------
    // Listen to joystick buttons
    // -----------------------------

    joystick.on("button", async (event) => {
      console.log(
        `[BUTTON] ${event.action}: ${event.pressed ? "PRESSED" : "RELEASED"}`,
      );

      if (event.mode) {
        console.log(`Mode: ${event.mode}`);
      }

      try {
        if (event.action === "arm") {
          console.log("vehical requesting arm");
          await vehicle.arm();
          console.log("vehicle armed");
        }

        if (event.action === "disarm") {
          console.log("vehicle requesting disarm");
          await vehicle.disarm();
          console.log("vehicle disarmed");
        }
      } catch (error) {}
    });

    // -----------------------------
    // Start joystick
    // -----------------------------

    joystick.start();

    console.log("Joystick started");

    await vehicle.setMode("GUIDED");
    // await vehicle.arm();
    // await vehicle.takeOff(50);
    // await vehicle.navigateToWaypoint();
    // async function asyncNavigate() {
    //   await vehicle.navigateToWaypoint(23.56, 33.25, 5);
    // }
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