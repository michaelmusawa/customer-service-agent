// app/lib/invoiceWatcher.ts
import { invoke } from "@tauri-apps/api/core";
import { watch, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";

import { basename } from "./pathUtils";
import { renamePath } from "./utils";
import { parseExcel } from "./excelUtils";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { sendToNextRaw } from "./actions/sendToNext";

export type ProcessingEvent = {
  fileName: string;
  fullPath?: string;
  status: "started" | "success" | "error" | "skipped";
  error?: string;
  timestamp: number;
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
      const isNewFile = event.type?.modify?.kind === "any";

      // const isNewFile =
      //   event?.type?.create || event?.type?.create?.kind === "file";
      if (!isNewFile) return;

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
          let text;
          let rows;

          if (p.endsWith(".pdf")) {
            // extract raw text from PDF
            text = await invoke("parse_invoice", { filePath: p });
          } else {
            // extract raw rows from Excel
            rows = await parseExcel(p);
          }

          const response = await sendToNextRaw({
            type: p.endsWith(".pdf") ? "pdf" : "excel",
            fileName,
            content: p.endsWith(".pdf") ? text : rows,
          });

          if (response?.message?.includes("No new records inserted")) {
            onEvent?.({
              fileName,
              fullPath: p,
              status: "skipped",
              error: "Duplicate record skipped",
              timestamp: Date.now(),
            });
          } else {
            onEvent?.({
              fileName,
              fullPath: p,
              status: "success",
              timestamp: Date.now(),
            });
          }

          try {
            await renamePath(p, "invoices/processed");
          } catch {
            console.error("Failed moving to processed directory");
          }
        } catch (err) {
          sendNotification({
            title: "Daemon",
            body: "❌ Failed sending to server",
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
            await renamePath(p, "invoices/failed");
          } catch (err) {
            console.error("Failed moving to failed directory", err);
          }
        }
      }
    },
    { baseDir: BaseDirectory.Download, recursive: true }
  );
}
