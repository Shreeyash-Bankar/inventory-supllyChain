// modules/firmware/crc32.js

const TABLE = new Uint32Array(256);

function buildTable() {
  const polynomial = 0xedb88320;

  for (let i = 0; i < 256; i++) {
    let crc = i;

    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = polynomial ^ (crc >>> 1);
      } else {
        crc >>>= 1;
      }
    }

    TABLE[i] = crc >>> 0;
  }
}

buildTable();

/**
 * ArduPilot/PX4 bootloader CRC32.
 *
 * IMPORTANT:
 * This starts with state = 0.
 * It is intentionally not the same as the common zlib CRC32 API.
 */
export function crc32(data, initialState = 0) {
  if (!Buffer.isBuffer(data) && !(data instanceof Uint8Array)) {
    data = Buffer.from(data);
  }

  let state = initialState >>> 0;

  for (const byte of data) {
    const index = (state ^ byte) & 0xff;

    state = (TABLE[index] ^ (state >>> 8)) >>> 0;
  }

  return state >>> 0;
}

/**
 * Calculate CRC of firmware while treating the rest of flash
 * as 0xFF padding.
 */
export function crc32Padded(data, flashSize, initialState = 0) {
  let state = crc32(data, initialState);

  if (flashSize > data.length) {
    const chunk = Buffer.alloc(4096, 0xff);

    let remaining = flashSize - data.length;

    while (remaining > 0) {
      const amount = Math.min(remaining, chunk.length);

      state = crc32(chunk.subarray(0, amount), state);

      remaining -= amount;
    }
  }

  return state >>> 0;
}

export function uint32LE(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0, 0);
  return buffer;
}

export function readUInt32LE(buffer, offset = 0) {
  return buffer.readUInt32LE(offset) >>> 0;
}
