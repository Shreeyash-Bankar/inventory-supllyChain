// modules/firmware/firmwareDetector.js

import { listUSBDevices } from "./usbDiscovery.js";

import { PX4Bootloader } from "./px4Bootloader.js";

export async function scanUSBDevices() {
  const devices = await listUSBDevices();

  console.log("\n========== HARDWARE DISCOVERY ==========");

  for (const device of devices) {
    console.log({
      path: device.path,
      manufacturer: device.manufacturer,
      friendlyName: device.friendlyName,
      serialNumber: device.serialNumber,
      VID: device.vendorId,
      PID: device.productId,
      pnpId: device.pnpId,
      locationId: device.locationId,
    });
  }

  console.log("=========================================\n");

  return devices;
}

/**
 * Try to identify the bootloader on one serial device.
 */
export async function identifyBootloader(device, options = {}) {
  const bootloader = new PX4Bootloader({
    path: device.path,
    baudRate: options.baudRate ?? 115200,
    timeout: options.timeout ?? 1000,
  });

  try {
    await bootloader.open();

    const info = await bootloader.identify();

    return {
      usb: device,
      bootloader: info,
    };
  } finally {
    await bootloader.close();
  }
}

/**
 * Scan every serial device and attempt to detect
 * an ArduPilot/PX4 compatible bootloader.
 */
export async function detectFirmwareTargets({
  baudRate = 115200,
  timeout = 750,
} = {}) {
  const devices = await listUSBDevices();

  const results = [];

  for (const device of devices) {
    console.log(`\n[DETECT] Probing ${device.path}`);

    try {
      const result = await identifyBootloader(device, {
        baudRate,
        timeout,
      });

      console.log("[DETECT] BOOTLOADER FOUND");

      console.log(JSON.stringify(result, null, 2));

      results.push(result);
    } catch (err) {
      console.log(
        `[DETECT] ${device.path} is not responding as PX4/ArduPilot bootloader:`,
        err.message,
      );
    }
  }

  return results;
}
