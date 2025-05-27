// src/parser.ts
import fs from "fs";
import pdf from "pdf-parse";
import { extractFields } from "./fieldExtractor";
import { sendToNext } from "./actions/sendToNext";

export async function parseAndSend(filePath: string) {
  try {
    const buffer = fs.readFileSync(filePath);
    const { text } = await pdf(buffer);

    const data = extractFields(text);
    if (!data.customerName) throw new Error("No customer name found");

    // data.invoiceNumber = filePath.split("/").pop()?.replace(".pdf", "");
    await sendToNext(data);

    console.log("✅ Sent:", data);
  } catch (e) {
    console.error("❌ Error parsing invoice:", e);
    // You can save the file to a “failed” folder
  }
}
