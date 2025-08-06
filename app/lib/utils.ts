import { BaseDirectory, rename } from "@tauri-apps/plugin-fs";
import { ExtractedFields } from "./fieldExtractor";
import { basename } from "./pathUtils";

// === helper: validate required fields ===

export function validate(fields: ExtractedFields) {
  if (
    !fields.name ||
    !fields.value ||
    !fields.recordNumber ||
    !fields.service ||
    !fields.subservice
  ) {
    throw new Error(
      "Missing required fields: " +
        (!fields.name ? "Customer Name, " : "") +
        (!fields.value ? "Total Amount" : "") +
        (!fields.recordNumber ? "Record Number, " : "") +
        (!fields.service ? "Service" : "") +
        (!fields.subservice ? "Sub Service, " : "")
    );
  }
}

// === helper: move file into a subfolder ===

/**
 * Move a file under Downloads from one sub‑folder into another.
 *
 * @param oldRel       e.g. "invoices/foo.pdf"
 * @param targetFolder e.g. "invoices/failed"
 */
export async function renamePath(oldRel: string, targetFolder: string) {
  // 1) Extract the filename ("foo.pdf")...
  const fileName = basename(oldRel);

  let sourceRel: string;
  let destRel: string;

  if (
    !targetFolder.includes("/processed") &&
    !targetFolder.includes("/failed")
  ) {
    sourceRel = `invoices/failed/${fileName}`;
    destRel = `invoices/${fileName}`;
  } else {
    sourceRel = oldRel;
    destRel = `${targetFolder}/${fileName}`;
  }

  // 3) Call the plugin exactly as documented:
  //    rename(oldPath, newPath, { oldPathBaseDir, newPathBaseDir })
  await rename(sourceRel, destRel, {
    oldPathBaseDir: BaseDirectory.Download,
    newPathBaseDir: BaseDirectory.Download,
  });
}
