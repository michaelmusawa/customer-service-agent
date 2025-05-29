import { invoke } from "@tauri-apps/api/core";
import { watchImmediate, BaseDirectory } from "@tauri-apps/plugin-fs";

export async function startInvoiceWatcher() {
  // watches ~/Downloads/invoices
  await watchImmediate(
    "invoices",
    (event) => {
      for (const p of event.paths) {
        if (p.endsWith(".pdf")) {
          console.log("🆕 Detected invoice:", p);
          invoke("parse_and_send", { path: p }).catch(console.error);
        }
      }

      console.log("invoices directory event", event);
    },
    {
      baseDir: BaseDirectory.Download,
      recursive: false,
    }
  );
}
