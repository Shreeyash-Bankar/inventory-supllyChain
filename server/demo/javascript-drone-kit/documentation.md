# Installation Guide

```bash
npm install javascript-drone-kit
```

## Dependencies packages

```bash
npm install gamepad-node
```

```bash
npm install node-mavlink
```

## Quick Start

For connecting the Drone / SITL import the connect

The connect return a vehicle and accept the object with the property of connection

```typescript
async function main() {
  try {
    //creating the vehicle object
    const vehicle = await connect({
      connection: "udp://0.0.0.0:14550",
    });
  } catch (error) {
    console.log("Error in establishing connection", error);
  }
}

main().catch(error){
    console.log("Error in executing main fucntion :" , error)
}
```

**_Once the object is formed you can acess the properties on it like_**

```typescript
(vehicle.isConnnected,
  vehicle.isArmed,
  vehicle.flightMode,
  vehicle.isArmable,
  vehicle.airspeed,
  vehicle.groundspeed,
  vehicle.system,
  vehicle.component);
```

**The fucntions on vehicle objects are**

```typescript
(vehicle.arm(),
  vehicle.disarm(),
  vehicle.setMode(),
  vehicle.getMode(),
  vehicle.takeOff(),
  vehicle.navigateToWaypoint());
```

**The setters are :**

```typescript
(vehicle.groundspeed, vehicle.airspeed);
```

**Logging The Telemetry**

Code snipped for one time and Continous Logging as stream arries for that value

```typescript
async function main() {
  try {
    //creating the vehicle object
    const vehicle = await connect({
      connection: "udp://0.0.0.0:14550",
    });

    //logging the telemetry
    // one time listning
    vehicle.message.get("Vibration")

    //listening to continous stream of a message and performing desired action on receivingWS

    vehicle.message.on("EkfStatusReport", (message) => {
        console.log("message")
    })
    vehicle.message.on("Vibration")
  } catch (error) {
    console.log("Error in establishing connection", error);
  }
}

main().catch(error){
    console.log("Error in executing main fucntion :" , error)
}

```
