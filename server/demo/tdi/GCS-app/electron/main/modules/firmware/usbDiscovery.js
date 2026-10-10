// modules/firmware/usbDiscovery.js

import { SerialPort } from "serialport";

function normalizeHex(value) {
  if (!value) return null;

  const string = String(value).replace(/^0x/i, "").trim();

  if (!string) return null;

  return `0x${string.padStart(4, "0").toUpperCase()}`;
}

function normalizePort(port) {
  return {
    path: port.path ?? null,

    manufacturer: port.manufacturer ?? null,

    serialNumber: port.serialNumber ?? null,

    pnpId: port.pnpId ?? null,

    locationId: port.locationId ?? null,

    friendlyName: port.friendlyName ?? null,

    vendorId: normalizeHex(port.vendorId),

    productId: normalizeHex(port.productId),

    vendorIdDecimal: port.vendorId ? parseInt(port.vendorId, 16) : null,

    productIdDecimal: port.productId ? parseInt(port.productId, 16) : null,

    raw: port,
  };
}

export async function listUSBDevices() {
  const ports = await SerialPort.list();

  return ports.map(normalizePort);
}

export async function logUSBDevices() {
  const devices = await listUSBDevices();

  console.log("\n==============================================");

  console.log("          USB / SERIAL DEVICE SCAN");

  console.log("==============================================");

  if (devices.length === 0) {
    console.log("No serial USB devices detected.");
  }

  devices.forEach((device, index) => {
    console.log(`\n---------- DEVICE ${index + 1} ----------`);

    console.log("Path:", device.path);
    console.log("Manufacturer:", device.manufacturer);

    console.log("Friendly name:", device.friendlyName);

    console.log("Serial number:", device.serialNumber);

    console.log("VID:", device.vendorId);

    console.log("PID:", device.productId);

    console.log("PnP ID:", device.pnpId);

    console.log("Location:", device.locationId);

    console.log("Raw descriptor:", device.raw);
  });

  console.log("\n==============================================\n");

  return devices;
}

export async function findPort(path) {
  const devices = await listUSBDevices();

  return devices.find((device) => device.path === path) ?? null;
}

export async function waitForUSBDevice({
  timeout = 15000,
  interval = 250,
  previousPaths = new Set(),
  predicate = null,
} = {}) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const devices = await listUSBDevices();

    const candidate = devices.find((device) => {
      if (predicate && !predicate(device)) {
        return false;
      }

      if (previousPaths.size > 0 && previousPaths.has(device.path)) {
        return false;
      }

      return true;
    });

    if (candidate) {
      return candidate;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return null;
}
