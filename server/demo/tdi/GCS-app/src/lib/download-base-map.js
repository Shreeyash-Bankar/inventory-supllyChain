import fs from "node:fs";
import path from "node:path";

// --- CONFIGURATION ---
const MAX_ZOOM = 5; // Zoom 0 to 5 downloads roughly 1,024 tiles (~5MB total)

// 🌍 Use a developer-friendly OpenStreetMap CDN mirror (CartoDB Light/Raster)
// Fix: Use secure CDN subdomain layout and add clean, standard parameter flags
const TILE_SERVER = "https://cartocdn.com{z}/{x}/{y}.png";

const OUTPUT_DIR = path.join(process.cwd(), "public", "offline-maps");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadTile(z, x, y) {
  const dirPath = path.join(OUTPUT_DIR, String(z), String(x));
  const filePath = path.join(dirPath, `${y}.png`);

  // Skip if already downloaded
  if (fs.existsSync(filePath)) return;

  fs.mkdirSync(dirPath, { recursive: true });

  // Generate target URL
  const url = TILE_SERVER.replace("{z}", z).replace("{x}", x).replace("{y}", y);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        // Mimic a standard modern desktop browser to pass anti-scraping firewalls securely
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/png,image/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);
    // console.log(`Downloaded tile: maps/${z}/${x}/${y}.png`);
  } catch (err) {
    console.error(`❌ Failed to download tile ${z}/${x}/${y}:`, err.message);
  }
}

async function main() {
  // console.log("🚀 Starting Safe Base World Map Download (Zoom 0 to 5)...");

  for (let z = 0; z <= MAX_ZOOM; z++) {
    const maxCoordinate = Math.pow(2, z) - 1;
    // console.log(`📦 Processing Zoom Level ${z}...`);

    for (let x = 0; x <= maxCoordinate; x++) {
      for (let y = 0; y <= maxCoordinate; y++) {
        await downloadTile(z, x, y);
        // Short pause to maintain standard friendly request intervals
        await sleep(15);
      }
    }
  }

  // console.log(
  //   "✅ Base Offline World Map Download Complete! Saved to public/offline-maps/",
  // );
}

main();
