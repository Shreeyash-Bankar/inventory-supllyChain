import fs from "fs";
import path from "path";
import { parseStringPromise } from "xml2js";

let PARAM_META = {};

/**
 * Load XML ONCE at startup
 */
export async function loadParamMeta() {
  try {
    const filePath = path.join(
      process.cwd(),
      "electron/main/assets/apm.pdef.xml",
    );

    const xml = fs.readFileSync(filePath, "utf-8");

    const parsed = await parseStringPromise(xml);

    const params = parsed?.PARAMETERS?.PARAM || [];

    const map = {};

    for (const p of params) {
      const name = p?.$?.name;
      if (!name) continue;

      map[name] = {
        description: p?.DESCRIPTION?.[0] || "",
        category: p?.GROUP?.[0] || "General",
        unit: p?.UNITS?.[0] || "",
        min: p?.RANGE?.[0]?.$?.min ?? null,
        max: p?.RANGE?.[0]?.$?.max ?? null,
        reboot: p?.REBOOT_REQUIRED?.[0] === "true",
      };
    }

    PARAM_META = map;

    console.log(" Param meta loaded:", Object.keys(map).length);
    return map;
  } catch (err) {
    console.error(" Failed to load param meta:", err);
    return {};
  }
}

/**
 * Fast access (no re-read)
 */
export function getParamMeta() {
  return PARAM_META;
}
