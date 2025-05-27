// src/watchInvoices.ts
import chokidar from "chokidar";
import path from "path";
import { parseAndSend } from "./parser";

const INVOICE_DIR = path.join(process.env.HOME || "", "Downloads", "invoices");

export function startWatcher() {
  const watcher = chokidar.watch(INVOICE_DIR, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 2000 },
  });

  watcher.on("add", (filePath) => {
    if (filePath.endsWith(".pdf")) {
      console.log("New invoice detected:", filePath);
      parseAndSend(filePath);
    }
  });
}
