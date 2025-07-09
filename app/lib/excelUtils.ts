import { BaseDirectory, readFile } from "@tauri-apps/plugin-fs";
import * as XLSX from "xlsx";

// === helper: read an .xlsx into JSON rows ===
export async function parseExcel(relPath: string): Promise<ExcelRow[]> {
  // read as binary (byte array) from plugin-fs
  const bytes = await readFile(relPath, {
    baseDir: BaseDirectory.Download,
  });
  // convert to ArrayBuffer
  const buf = new Uint8Array(bytes).buffer;
  // parse workbook
  const wb = XLSX.read(buf, { type: "array" });
  // assume first sheet
  const sheet = wb.Sheets[wb.SheetNames[0]];
  // convert to JS objects
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

// === helper: map a row to your invoice-fields shape ===
interface ExcelRow {
  "Customer Name"?: string;
  "Invoice No"?: string;
  "Total Amount": string;
  "House/Stall No."?: string;
}

export function extractExcelFields(row: ExcelRow) {
  const name = row["Customer Name"]?.toString().trim();
  const recordNumber = row["Invoice No"]?.toString().trim();
  const value = parseFloat(row["Total Amount"]) || 0;
  const houseStall = row["House/Stall No."]?.toString().toLowerCase() || "";

  return {
    name,
    recordNumber,
    recordType: "invoice",
    ticket: "T-DAEMON",
    value,
    service: "County Rents",
    subservice: houseStall.includes("house")
      ? "County Houses"
      : "County Market Stalls",
  };
}
