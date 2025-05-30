import { invoke } from "@tauri-apps/api/core";
import { watch, BaseDirectory, rename, mkdir } from "@tauri-apps/plugin-fs";
import { extractFields } from "./fieldExtractor";
import { sendToNext } from "./actions/sendToNext";

export async function startInvoiceWatcher() {
  // Ensure processed directory exists
  const processedDir = "invoices/processed";
  try {
    await mkdir(processedDir, {
      baseDir: BaseDirectory.Download,
      recursive: true,
    });
  } catch (err) {
    console.log("ℹ️ Processed directory already exists", err);
  }

  await watch(
    "invoices",
    async (event) => {
      console.log("👀 FS Event:", event);

      // Filter only relevant create events
      if (
        !event.type?.create ||
        event.type.create.kind !== "file" ||
        !event.paths.some((p) => p.endsWith(".pdf"))
      ) {
        return;
      }

      for (const p of event.paths.filter((p) => p.endsWith(".pdf"))) {
        try {
          console.log("🔍 Processing new invoice:", p);

          const text: string = await invoke("parse_invoice", { filePath: p });
          const fields = extractFields(text);
          const payload = { ...fields };

          await sendToNext(payload);
          console.log("✅ Sent invoice", payload);

          // Create destination path
          const newPath = p.replace("/invoices/", "/invoices/processed/");

          // Ensure the directory exists before moving
          await mkdir(newPath.substring(0, newPath.lastIndexOf("/")), {
            baseDir: BaseDirectory.Download,
            recursive: true,
          });

          await rename(p, newPath, {
            oldPathBaseDir: BaseDirectory.Download,
            newPathBaseDir: BaseDirectory.Download,
          });

          console.log(`📦 Moved to: ${newPath}`);
        } catch (err) {
          console.error("❌ Processing failed", p, err);

          // Add error handling for file already moved
          if (err.message.includes("No such file or directory")) {
            console.warn("⚠️ File was already moved or deleted");
          }
        }
      }
    },
    {
      baseDir: BaseDirectory.Download,
      recursive: true,
    }
  );
}
