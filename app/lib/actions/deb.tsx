// // app/lib/invoiceWatcher.ts
// import { invoke } from "@tauri-apps/api/core";
// import { watch, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";

// import { basename } from "./pathUtils";
// import { renamePath } from "./utils";
// import { parseExcel } from "./excelUtils";
// import { sendNotification } from "@tauri-apps/plugin-notification";
// import { sendToNextRaw } from "./actions/sendToNext";

// export type ProcessingEvent = {
//   fileName: string;
//   fullPath?: string;
//   status: "started" | "success" | "error" | "skipped";
//   error?: string;
//   timestamp: number;
// };

// // Prevent double-processing of the same file in a short window
// const recentFiles = new Map<string, number>();
// const DUPLICATE_WINDOW = 3000; // ms

// function shouldProcess(filePath: string): boolean {
//   const now = Date.now();
//   const last = recentFiles.get(filePath);
//   recentFiles.set(filePath, now);
//   return !last || now - last > DUPLICATE_WINDOW;
// }

// // Prevent processing a file multiple times simultaneously
// const inProgress = new Set<string>();

// // Debounce multiple FS events for the same file path
// const debounceMap = new Map<string, NodeJS.Timeout>();
// const EVENT_DEBOUNCE = 400; // ms

// function debounceEvent(path: string, cb: () => void) {
//   if (debounceMap.has(path)) {
//     clearTimeout(debounceMap.get(path)!);
//   }
//   const t = setTimeout(() => {
//     debounceMap.delete(path);
//     cb();
//   }, EVENT_DEBOUNCE);
//   debounceMap.set(path, t);
// }

// // Wait until file size stops changing
// async function waitForFileStable(
//   filePath: string,
//   retries = 5,
//   interval = 400
// ): Promise<boolean> {
//   let lastSize = -1;

//   for (let i = 0; i < retries; i++) {
//     try {
//       const { size } = (await invoke("stat_file", { filePath })) as {
//         size: number;
//       };
//       if (size === lastSize) return true;
//       lastSize = size;
//     } catch {
//       // File might not exist yet
//     }
//     await new Promise((res) => setTimeout(res, interval));
//   }
//   return false;
// }

// async function processFile(
//   p: string,
//   onEvent?: (event: ProcessingEvent) => void
// ) {
//   const fileName = basename(p);

//   // Prevent two parallel processes
//   if (inProgress.has(p)) return;
//   inProgress.add(p);

//   // Prevent rapid double events
//   if (!shouldProcess(p)) {
//     inProgress.delete(p);
//     return;
//   }

//   onEvent?.({
//     fileName,
//     fullPath: p,
//     status: "started",
//     timestamp: Date.now(),
//   });

//   try {
//     await waitForFileStable(p);

//     let content;
//     if (p.endsWith(".pdf")) {
//       content = await invoke("parse_invoice", { filePath: p });
//     } else {
//       content = await parseExcel(p);
//     }

//     const response = await sendToNextRaw({
//       type: p.endsWith(".pdf") ? "pdf" : "excel",
//       fileName,
//       content,
//     });

//     if (response?.message?.includes("No new records inserted")) {
//       onEvent?.({
//         fileName,
//         fullPath: p,
//         status: "skipped",
//         error: "Duplicate record skipped",
//         timestamp: Date.now(),
//       });
//     } else {
//       onEvent?.({
//         fileName,
//         fullPath: p,
//         status: "success",
//         timestamp: Date.now(),
//       });
//     }

//     try {
//       await renamePath(p, "invoices/processed");
//     } catch {
//       console.error("Failed moving to processed directory");
//     }
//   } catch (err) {
//     let errorMsg = "An unexpected error occurred.";

//     if (typeof err === "object" && err !== null) {
//       if ("error" in err && typeof err.error === "string") {
//         errorMsg = err.error;
//       } else if ("message" in err && typeof err.message === "string") {
//         errorMsg = err.message;
//       }
//     } else {
//       errorMsg = String(err);
//     }

//     sendNotification({ title: "Invoice Agent", body: `❌ ${errorMsg}` });

//     onEvent?.({
//       fileName,
//       fullPath: p,
//       status: "error",
//       error: errorMsg,
//       timestamp: Date.now(),
//     });

//     try {
//       await renamePath(p, "invoices/failed");
//     } catch (err) {
//       console.error("Failed moving to failed directory", err);
//     }
//   }

//   inProgress.delete(p);
// }

// export async function startInvoiceWatcher(
//   onEvent?: (event: ProcessingEvent) => void
// ) {
//   // Ensure directories exist
//   const directories = ["invoices", "invoices/processed", "invoices/failed"];
//   for (const dir of directories) {
//     try {
//       await mkdir(dir, {
//         baseDir: BaseDirectory.Download,
//         recursive: true,
//       });
//     } catch {}
//   }

//   await watch(
//     "invoices",
//     async (event) => {
//       // detect new files
//       // @ts-expect-error (plugin-fs type issue)
//       // prettier-ignore
//       const isNewFile = event?.type?.create || event?.type?.create?.kind === "file";
//       if (!isNewFile) return;

//       // filter ONLY real files, not browser temp files
//       const validFiles = event.paths.filter(
//         (p) =>
//           (p.endsWith(".pdf") || p.endsWith(".xlsx")) &&
//           !p.endsWith(".crdownload") &&
//           !p.endsWith(".part") &&
//           !p.endsWith(".tmp")
//       );

//       for (const p of validFiles) {
//         debounceEvent(p, () => processFile(p, onEvent));
//       }
//     },
//     { baseDir: BaseDirectory.Download, recursive: true }
//   );
// }
