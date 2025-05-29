// src/watchInvoices.ts
import { watchImmediate, BaseDirectory } from "@tauri-apps/plugin-fs";
import { parseAndSend } from "./parser";

const INVOICE_FOLDER = "invoices"; // relative to ~/Downloads

/**
 * Start watching ~/Downloads/invoices for new PDFs,
 * and kick off parseAndSend for each one.
 */
export async function startWatcher() {
  // `watchImmediate` will fire once for any existing files + on each change
  await watchImmediate(
    INVOICE_FOLDER,
    (event) => {
      // Only care about newly created files

      for (const relPath of event.paths) {
        // Build the full path under Downloads/
        const fullPath = `${BaseDirectory.Download}/${relPath}`;

        if (relPath.toLowerCase().endsWith(".pdf")) {
          console.log("🆕 New invoice PDF detected:", fullPath);
          parseAndSend(fullPath);
        }
      }
    },
    {
      baseDir: BaseDirectory.Download,
      recursive: false, // set to `true` if you want to include subfolders
    }
  );
}
