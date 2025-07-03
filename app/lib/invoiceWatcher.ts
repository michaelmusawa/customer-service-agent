import { invoke } from "@tauri-apps/api/core";
import { watch, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";

import { extractFields } from "./fieldExtractor";
import { sendToNext } from "./actions/sendToNext";
import { basename } from "./pathUtils";
import { renamePath, validate } from "./utils";
import { extractExcelFields, parseExcel } from "./excelUtils";
import { sendNotification } from "@tauri-apps/plugin-notification";

export type ProcessingEvent = {
  fileName: string;
  fullPath?: string;
  status: "started" | "success" | "error";
  timestamp: number;
  error?: string;
};

export async function startInvoiceWatcher(
  onEvent?: (event: ProcessingEvent) => void
) {
  // Ensure directories exist
  const directories = ["invoices", "invoices/processed", "invoices/failed"];
  for (const dir of directories) {
    try {
      await mkdir(dir, {
        baseDir: BaseDirectory.Download,
        recursive: true,
      });
    } catch {
      // already exists
    }
  }

  await watch(
    "invoices",
    async (event) => {
      // only care about new files
      // @ts-expect-error: we know `event.type.create` exists at runtime
      if (!event.type?.create || event.type.create.kind !== "file") return;

      for (const p of event.paths.filter(
        (p) => p.endsWith(".pdf") || p.endsWith(".xlsx")
      )) {
        const fileName = basename(p);
        onEvent?.({
          fileName,
          fullPath: p,
          status: "started",
          timestamp: Date.now(),
        });

        try {
          if (p.endsWith(".pdf")) {
            // === existing PDF flow ===
            const text: string = await invoke("parse_invoice", { filePath: p });
            const fields = extractFields(text);
            validate(fields);
            await sendToNext(fields);
          } else {
            // === new XLSX flow ===
            const rows = await parseExcel(p);
            for (const row of rows) {
              const fields = extractExcelFields(row);
              validate(fields);
              await sendToNext(fields);
            }
          }

          onEvent?.({
            fileName,
            fullPath: p,
            status: "success",
            timestamp: Date.now(),
          });
          await renamePath(p, "/invoices/processed/");
        } catch (err) {
          sendNotification({
            title: "Daemon",
            body: "❌ Unknown Error occurred",
          });
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          onEvent?.({
            fileName,
            fullPath: p,
            status: "error",
            error: errorMsg,
            timestamp: Date.now(),
          });
          try {
            await renamePath(p, "/invoices/failed/");
          } catch {
            console.error("Failed moving to failed directory");
          }
        }
      }
    },
    { baseDir: BaseDirectory.Download, recursive: true }
  );
}
