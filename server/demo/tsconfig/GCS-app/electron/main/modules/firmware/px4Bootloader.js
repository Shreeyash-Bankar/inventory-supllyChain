// modules/firmware/px4Bootloader.js

import { SerialPort } from "serialport";

import { readUInt32LE } from "./crc32.js";

const CMD = Object.freeze({
  NOP: 0x00,

  GET_SYNC: 0x21,
  GET_DEVICE: 0x22,
  CHIP_ERASE: 0x23,

  PROG_MULTI: 0x27,
  READ_MULTI: 0x28,

  GET_CRC: 0x29,

  GET_OTP: 0x2a,
  GET_SN: 0x2b,
  GET_CHIP: 0x2c,

  GET_CHIP_DES: 0x2e,
  GET_VERSION: 0x2f,

  REBOOT: 0x30,

  CHIP_FULL_ERASE: 0x40,
});

const RESPONSE = Object.freeze({
  INSYNC: 0x12,
  EOC: 0x20,

  OK: 0x10,
  FAILED: 0x11,
  INVALID: 0x13,
  BAD_SILICON_REV: 0x14,
});

const DEVICE_INFO = Object.freeze({
  BL_REV: 0x01,
  BOARD_ID: 0x02,
  BOARD_REV: 0x03,
  FLASH_SIZE: 0x04,
});

const PROG_MULTI_MAX = 252;

const MAX_DES_LENGTH = 20;

function hex(value) {
  return `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;
}

export class PX4Bootloader {
  constructor({ path, baudRate = 115200, timeout = 1000 }) {
    this.path = path;
    this.baudRate = baudRate;
    this.timeout = timeout;

    this.port = null;

    this.info = null;
  }

  async open() {
    if (this.port?.isOpen) {
      return;
    }

    this.port = new SerialPort({
      path: this.path,
      baudRate: this.baudRate,
      autoOpen: false,
    });

    await new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log(`[BOOTLOADER] Opened ${this.path} @ ${this.baudRate}`);

    await this.flushInput();
  }

  async close() {
    if (!this.port) {
      return;
    }

    if (!this.port.isOpen) {
      this.port = null;
      return;
    }

    await new Promise((resolve) => {
      this.port.close(() => resolve());
    });

    this.port = null;
  }

  async flushInput() {
    if (!this.port?.isOpen) {
      return;
    }

    await new Promise((resolve, reject) => {
      this.port.flush((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async write(buffer) {
    if (!this.port?.isOpen) {
      throw new Error("Bootloader serial port is not open");
    }

    await new Promise((resolve, reject) => {
      this.port.write(buffer, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.port.drain((drainErr) => {
          if (drainErr) {
            reject(drainErr);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async readExact(length, timeout = this.timeout) {
    const deadline = Date.now() + timeout;

    const chunks = [];
    let total = 0;

    while (total < length) {
      const remainingTime = deadline - Date.now();

      if (remainingTime <= 0) {
        throw new Error(
          `Bootloader timeout waiting for ${length} bytes; received ${total}`,
        );
      }

      const chunk = await this.readSome(length - total, remainingTime);

      chunks.push(chunk);
      total += chunk.length;
    }

    return Buffer.concat(chunks, total);
  }

  readSome(maxBytes, timeout) {
    return new Promise((resolve, reject) => {
      let done = false;

      const cleanup = () => {
        clearTimeout(timer);

        this.port.removeListener("data", onData);

        this.port.removeListener("error", onError);
      };

      const finish = (fn, value) => {
        if (done) return;

        done = true;

        cleanup();

        fn(value);
      };

      const onData = (data) => {
        finish(resolve, Buffer.from(data.subarray(0, maxBytes)));
      };

      const onError = (err) => {
        finish(reject, err);
      };

      const timer = setTimeout(() => {
        finish(reject, new Error("Serial read timeout"));
      }, timeout);

      this.port.on("data", onData);

      this.port.once("error", onError);
    });
  }

  async command(command, payload = Buffer.alloc(0)) {
    const packet = Buffer.concat([
      Buffer.from([command]),
      payload,
      Buffer.from([RESPONSE.EOC]),
    ]);

    console.debug("[BOOT TX]", packet.toString("hex"));

    await this.write(packet);
  }

  async getSync() {
    const response = await this.readExact(2, this.timeout);

    if (response[0] !== RESPONSE.INSYNC) {
      throw new Error(
        `Expected INSYNC ${hex(RESPONSE.INSYNC)}, received ${hex(response[0])}`,
      );
    }

    const status = response[1];

    if (status === RESPONSE.BAD_SILICON_REV) {
      throw new Error("Bootloader reports unsupported silicon revision");
    }

    if (status === RESPONSE.FAILED) {
      throw new Error("Bootloader reports operation FAILED");
    }

    if (status === RESPONSE.INVALID) {
      throw new Error("Bootloader reports INVALID operation");
    }

    if (status !== RESPONSE.OK) {
      throw new Error(`Unexpected bootloader status ${hex(status)}`);
    }

    return true;
  }

  async sync() {
    await this.flushInput();

    await this.command(CMD.GET_SYNC);

    await this.getSync();

    return true;
  }

  async getDeviceInfo(parameter) {
    await this.command(CMD.GET_DEVICE, Buffer.from([parameter]));

    const raw = await this.readExact(4);

    const value = readUInt32LE(raw);

    await this.getSync();

    return value;
  }

  async getBootloaderVersion() {
    try {
      await this.command(CMD.GET_VERSION);

      const length = readUInt32LE(await this.readExact(4));

      if (length <= 0 || length > 256) {
        throw new Error(`Invalid version length ${length}`);
      }

      const raw = await this.readExact(length);

      await this.getSync();

      return raw.toString("utf8");
    } catch {
      return "unknown";
    }
  }

  async getChip() {
    await this.command(CMD.GET_CHIP);

    const raw = await this.readExact(4);

    const value = readUInt32LE(raw);

    await this.getSync();

    return value;
  }

  async getChipDescription() {
    await this.command(CMD.GET_CHIP_DES);

    const length = readUInt32LE(await this.readExact(4));

    if (length <= 0 || length > MAX_DES_LENGTH) {
      throw new Error(`Invalid chip description length: ${length}`);
    }

    const raw = await this.readExact(length);

    await this.getSync();

    const text = raw.toString("latin1");

    const parts = text.split(",");

    return {
      raw: text,
      family: parts[0] ?? "unknown",
      revision: parts[1] ?? "unknown",
    };
  }

  async getOTP(address) {
    const addressBuffer = Buffer.alloc(4);

    addressBuffer.writeUInt32LE(address >>> 0, 0);

    await this.command(CMD.GET_OTP, addressBuffer);

    const data = await this.readExact(4);

    await this.getSync();

    return data;
  }

  async getSerialNumberWord(address) {
    const addressBuffer = Buffer.alloc(4);

    addressBuffer.writeUInt32LE(address >>> 0, 0);

    await this.command(CMD.GET_SN, addressBuffer);

    const data = await this.readExact(4);

    await this.getSync();

    return data;
  }

  async readOTP() {
    const result = Buffer.alloc(32 * 6);

    for (let address = 0; address < result.length; address += 4) {
      const word = await this.getOTP(address);

      word.copy(result, address);
    }

    return result;
  }

  async readSerialNumber() {
    const result = Buffer.alloc(12);

    for (let address = 0; address < 12; address += 4) {
      const word = await this.getSerialNumberWord(address);

      // PX4 uploader reverses each SN word.
      Buffer.from(word).reverse().copy(result, address);
    }

    return result;
  }

  async identify() {
    console.log("\n==========================================");

    console.log("       BOOTLOADER IDENTIFICATION");

    console.log("==========================================");

    await this.sync();

    const bootloaderRevision = await this.getDeviceInfo(DEVICE_INFO.BL_REV);

    const boardId = await this.getDeviceInfo(DEVICE_INFO.BOARD_ID);

    const boardRevision = await this.getDeviceInfo(DEVICE_INFO.BOARD_REV);

    const flashSize = await this.getDeviceInfo(DEVICE_INFO.FLASH_SIZE);

    const info = {
      path: this.path,

      bootloaderProtocol: bootloaderRevision,

      boardId,

      boardRevision,

      flashSize,

      bootloaderVersion: "unknown",

      chipId: null,

      chipDescription: null,

      otp: null,

      serialNumber: null,
    };

    if (bootloaderRevision >= 5) {
      info.bootloaderVersion = await this.getBootloaderVersion();

      try {
        info.chipId = await this.getChip();
      } catch (err) {
        console.warn("[BOOTLOADER] Could not read chip ID:", err.message);
      }

      try {
        info.chipDescription = await this.getChipDescription();
      } catch (err) {
        console.warn(
          "[BOOTLOADER] Could not read chip description:",
          err.message,
        );
      }
    }

    if (bootloaderRevision >= 4) {
      try {
        info.otp = await this.readOTP();

        info.serialNumber = await this.readSerialNumber();
      } catch (err) {
        console.warn("[BOOTLOADER] OTP/SN unavailable:", err.message);
      }
    }

    this.info = info;

    console.log("\n========== TARGET ==========");

    console.log("Port:", info.path);

    console.log("Bootloader protocol:", info.bootloaderProtocol);

    console.log("Board ID:", info.boardId);

    console.log("Board revision:", info.boardRevision);

    console.log("Flash size:", info.flashSize);

    console.log("Bootloader version:", info.bootloaderVersion);

    console.log(
      "Chip ID:",
      info.chipId !== null
        ? `0x${info.chipId.toString(16).padStart(8, "0").toUpperCase()}`
        : "unavailable",
    );

    console.log("Chip description:", info.chipDescription);

    if (info.serialNumber) {
      console.log("Bootloader serial:", info.serialNumber.toString("hex"));
    }

    console.log("============================\n");

    return info;
  }

  async erase({ full = false } = {}) {
    console.log("[FLASH] Starting flash erase...");

    if (full && this.info?.bootloaderProtocol >= 6) {
      await this.command(CMD.CHIP_FULL_ERASE);
    } else {
      await this.command(CMD.CHIP_ERASE);
    }

    // Erase may take considerably longer
    // than normal commands.
    await this.getSync();

    console.log("[FLASH] Erase complete.");
  }

  async program(
    image,
    { chunkSize = PROG_MULTI_MAX, onProgress = () => {} } = {},
  ) {
    if (image.length % 4 !== 0) {
      throw new Error("Firmware image must be 4-byte aligned");
    }

    let offset = 0;

    while (offset < image.length) {
      const remaining = image.length - offset;

      const size = Math.min(chunkSize, remaining);

      let chunk = image.subarray(offset, offset + size);

      // PROG_MULTI is required to
      // receive multiples of four.
      if (chunk.length % 4 !== 0) {
        const padded = Buffer.alloc(Math.ceil(chunk.length / 4) * 4, 0xff);

        chunk.copy(padded);

        chunk = padded;
      }

      const payload = Buffer.concat([Buffer.from([chunk.length]), chunk]);

      await this.command(CMD.PROG_MULTI, payload);

      await this.getSync();

      offset += chunk.length;

      const progress = Math.min(100, (offset / image.length) * 100);

      onProgress(progress, offset, image.length);
    }

    console.log("[FLASH] Programming complete.");
  }

  async getCRC() {
    await this.command(CMD.GET_CRC);

    const raw = await this.readExact(4, 10000);

    const crc = readUInt32LE(raw);

    await this.getSync();

    return crc;
  }

  async reboot() {
    console.log("[BOOTLOADER] Rebooting target...");

    await this.command(CMD.REBOOT);

    // The USB device normally disappears
    // immediately, so don't wait for a normal
    // INSYNC response.
  }
}

export {
  CMD as BOOTLOADER_COMMANDS,
  RESPONSE as BOOTLOADER_RESPONSES,
  DEVICE_INFO,
};
