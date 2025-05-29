import { invoke } from "@tauri-apps/api/core";
import { watchImmediate, BaseDirectory, rename } from "@tauri-apps/plugin-fs";
import { extractFields } from "./fieldExtractor";
import { sendToNext } from "./actions/sendToNext";

export async function startInvoiceWatcher() {
  await watchImmediate(
    "invoices",
    async (event) => {
      for (const p of event.paths.filter((p) => p.endsWith(".pdf"))) {
        try {
          const text: string = await invoke("parse_invoice", { filePath: p });
          console.log("📄", p, "=>", text);

          // 2) pull out structured fields
          const fields = extractFields(text);
          // derive invoiceNumber from filename
          // const fileName = basename(fullPath, ".pdf");
          // const payload = { invoiceNumber: fileName, ...fields };
          const payload = { ...fields };

          // 3) send to Next.js webhook
          await sendToNext(payload);
          console.log(`✅ Sent invoice `, payload);

          // move to ~/Downloads/invoices/processed/foo.pdf
          const newPath = p.replace("/invoices/", "/invoices/processed/");
          await rename(p, newPath, {
            oldPathBaseDir: BaseDirectory.Download,
            newPathBaseDir: BaseDirectory.Download,
          });
        } catch (err) {
          console.error("❌ Failed to process", p, err);
        }
      }
    },
    { baseDir: BaseDirectory.Download, recursive: false }
  );
}
