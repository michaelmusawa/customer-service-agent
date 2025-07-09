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

  // 2) Build the new relative path ("invoices/failed/foo.pdf")
  const newRel = `${targetFolder}/${fileName}`;

  // 3) Call the plugin exactly as documented:
  //    rename(oldPath, newPath, { oldPathBaseDir, newPathBaseDir })
  await rename(
    oldRel,
    newRel,
    {
      oldPathBaseDir: BaseDirectory.Download,
      newPathBaseDir: BaseDirectory.Download,
    }
  );
}
