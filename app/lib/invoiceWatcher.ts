// app/lib/invoiceWatcher.ts
import { invoke } from "@tauri-apps/api/core";
import { watch, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";

import { basename } from "./pathUtils";
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

      // const isNewFile = event.type?.modify?.kind === "any";

      // @ts-expect-error TODO: plugin-fs types are inaccurate for 'create'
      // prettier-ignore
      const isNewFile = event?.type?.create || event?.type?.create?.kind === "file";

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
        } catch (err) {
          sendNotification({
            title: "Daemon",
            body: "❌ Failed sending to server",
          });
          let errorMsg: string;

          if (typeof err === "object" && err !== null) {
            if ("error" in err && typeof err.error === "string") {
              errorMsg = err.error;
            } else if ("message" in err && typeof err.message === "string") {
              errorMsg = err.message;
            } else {
              errorMsg = "An unexpected error occurred while sending data.";
            }
          } else {
            errorMsg = String(err);
          }

          sendNotification({
            title: "Invoice Agent",
            body: `❌ ${errorMsg}`,
          });

          onEvent?.({
            fileName,
            fullPath: p,
            status: "error",
            error: errorMsg,
            timestamp: Date.now(),
          });
        }
      }
    },
    { baseDir: BaseDirectory.Download, recursive: true }
  );
}
