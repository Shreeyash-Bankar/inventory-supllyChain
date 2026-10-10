// modules/firmware/apjFirmware.js

import fs from "node:fs/promises";
import zlib from "node:zlib";
import path from "node:path";

export class APJFirmware {
  constructor({ filePath, metadata, image, originalImageSize }) {
    this.filePath = filePath;
    this.metadata = metadata;
    this.image = image;
    this.originalImageSize = originalImageSize;
  }

  static async load(filePath) {
    if (!filePath) {
      throw new Error("No firmware file supplied");
    }

    const absolutePath = path.resolve(filePath);

    const raw = await fs.readFile(absolutePath, "utf8");

    let json;

    try {
      json = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid APJ JSON: ${err.message}`);
    }

    if (!json.image) {
      throw new Error("APJ firmware does not contain an image field");
    }

    if (json.board_id === undefined) {
      throw new Error("APJ firmware does not contain board_id");
    }

    const boardId = Number(json.board_id);

    if (!Number.isInteger(boardId)) {
      throw new Error(`Invalid APJ board_id: ${json.board_id}`);
    }

    let compressed;

    try {
      compressed = Buffer.from(json.image, "base64");
    } catch (err) {
      throw new Error(`Invalid APJ base64 image: ${err.message}`);
    }

    let image;

    try {
      image = zlib.inflateSync(compressed);
    } catch (err) {
      throw new Error(`Could not decompress APJ image: ${err.message}`);
    }

    const originalImageSize = image.length;

    // Bootloader programming is performed in multiples of 4.
    const padding = (4 - (image.length % 4)) % 4;

    if (padding > 0) {
      image = Buffer.concat([image, Buffer.alloc(padding, 0xff)]);
    }

    const firmware = new APJFirmware({
      filePath: absolutePath,
      metadata: json,
      image,
      originalImageSize,
    });

    console.log("\n========== APJ FIRMWARE ==========");

    console.log("File:", absolutePath);

    console.log("Board ID:", firmware.boardId);

    console.log("Board revision:", firmware.boardRevision);

    console.log("Image size:", firmware.originalImageSize);

    console.log("Padded image size:", firmware.image.length);

    console.log("Image max size:", firmware.imageMaxSize);

    console.log("Firmware version:", firmware.firmwareVersion);

    console.log("Git hash:", firmware.gitHash);

    console.log("===================================\n");

    return firmware;
  }

  get boardId() {
    return Number(this.metadata.board_id);
  }

  get boardRevision() {
    return Number(this.metadata.board_revision ?? 0);
  }

  get imageMaxSize() {
    return Number(this.metadata.image_maxsize ?? this.metadata.image_size ?? 0);
  }

  get imageSize() {
    return this.image.length;
  }

  get firmwareVersion() {
    return this.metadata.version ?? this.metadata.firmware_version ?? "unknown";
  }

  get gitHash() {
    return this.metadata.git_hash ?? this.metadata.git_sha ?? "unknown";
  }

  get vehicleType() {
    return this.metadata.mav_type ?? this.metadata.mav_type_name ?? "unknown";
  }

  get rawMetadata() {
    return this.metadata;
  }

  /**
   * Verify that image can physically fit.
   */
  validateAgainstFlashSize(flashSize) {
    if (!flashSize) {
      return true;
    }

    if (this.image.length > flashSize) {
      throw new Error(
        [
          "Firmware is larger than target flash.",
          `firmware=${this.image.length}`,
          `flash=${flashSize}`,
        ].join(" "),
      );
    }

    return true;
  }
}
