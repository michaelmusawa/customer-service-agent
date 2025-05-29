import { extractFields } from "./fieldExtractor";
import { sendToNext } from "./actions/sendToNext";
import { invoke } from "@tauri-apps/api/core";

export async function parseAndSend(filePath: string) {
  try {
    const text = await invoke<string>("parse_invoice", { filePath });

    const data = extractFields(text);
    if (!data.customerName) throw new Error("No customer name found");

    await sendToNext(data);
    console.log("✅ Sent:", data);
  } catch (e) {
    console.error("❌ Error parsing invoice:", e);
  }
}
