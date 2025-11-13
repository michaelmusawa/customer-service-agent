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

// Cache to avoid double-processing same file within a short time
const recentFiles = new Map<string, number>();
const DUPLICATE_WINDOW = 3000; // ms

function shouldProcess(filePath: string): boolean {
  const now = Date.now();
  const last = recentFiles.get(filePath);
  recentFiles.set(filePath, now);
  return !last || now - last > DUPLICATE_WINDOW;
}

// Helper to wait for file stability (optional for large downloads)
async function waitForFileStable(
  filePath: string,
  retries = 5,
  interval = 500
): Promise<boolean> {
  let lastSize = -1;
  for (let i = 0; i < retries; i++) {
    try {
      const { size } = (await invoke("stat_file", { filePath })) as {
        size: number;
      };
      if (size === lastSize) return true;
      lastSize = size;
    } catch {
      // file may not exist yet
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

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

      // Only process new PDF/Excel files, ignore temp files
      const validFiles = event.paths.filter(
        (p) =>
          (p.endsWith(".pdf") || p.endsWith(".xlsx")) &&
          !p.endsWith(".crdownload") &&
          !p.endsWith(".part") &&
          !p.endsWith(".tmp")
      );

      for (const p of validFiles) {
        const fileName = basename(p);

        // Avoid double-triggering (esp. on Windows rename events)
        if (!shouldProcess(p)) return;

        onEvent?.({
          fileName,
          fullPath: p,
          status: "started",
          timestamp: Date.now(),
        });

        try {
          await waitForFileStable(p);

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
