import { BaseDirectory, rename } from "@tauri-apps/plugin-fs";
import { ExtractedFields } from "./fieldExtractor";

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
export async function renamePath(oldRel: string, targetFolder: string) {
  const newRel = oldRel.replace("/invoices/", targetFolder);
  await rename(oldRel, newRel, {
    oldPathBaseDir: BaseDirectory.Download,
    newPathBaseDir: BaseDirectory.Download,
  });
}
