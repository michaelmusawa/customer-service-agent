// app/lib/fieldExtractor.ts

import { Services } from "./data";

export interface ExtractedFields {
  ticket: string | null;
  recordType: string | null;
  name?: string | null;
  recordNumber?: string | null;
  service: string | null;
  subservice: string | null;
  value: string | number | null;
  date?: string | null; // Added date field
}

export function extractFields(rawText: string): ExtractedFields {
  // collapse whitespace into single spaces (but KEEP case, since invoice numbers are case-sensitive)
  const normalized = rawText.replace(/\s+/g, " ").trim();

  // 1) Customer Name
  const customerMatch = normalized.match(
    /(?:client|name)[\s:]+(.+?)(?=\s+(?:invoice|bill|application)[\s:]|$)/i
  );

  // 2) Invoice/Bill Number
  const invoiceMatch = normalized.match(
    /(?:invoice|bill)[\s]*(?:no|number)[\s:]*([A-Za-z0-9_\-]+)/i
  );

  // 3) Total Amount
  const amountMatch = normalized.match(
    /(?:total|amount due|balance|grand total|bill total amount)[\s:]*\$?([\d,]+\.\d{2})\b/i
  );

  // 4) Date & Time
  const dateTimeMatch = normalized.match(
    /date[\s&]*time[\s:]*([\d\/]+\s+\d{1,2}:\d{2}\s*(?:AM|PM))/i
  );

  // 5) Subservice / Service
  let foundSub: string | null = null;
  let foundSvc: string | null = null;
  const lower = normalized.toLowerCase();

  // special case: "land rate for" → Annual Land rates
  if (lower.includes("land rate for")) {
    foundSub = "Annual Land rates";
    const svc = Services.find((s) =>
      s.subServices.some((ss) => ss.toLowerCase() === foundSub!.toLowerCase())
    );
    foundSvc = svc?.name ?? null;
  }

  // fallback: scan Services list for any matching subService
  if (!foundSub) {
    outer: for (const svc of Services) {
      for (const sub of svc.subServices) {
        if (lower.includes(sub.toLowerCase())) {
          foundSub = sub;
          foundSvc = svc.name;
          break outer;
        }
      }
    }
  }

  console.log("Extracted fields:", {
    customerName: customerMatch?.[1]?.trim() ?? null,
    invoiceNumber: invoiceMatch?.[1]?.trim() ?? null,
    amount: amountMatch?.[1]?.trim() ?? null,
    service: foundSvc,
    subservice: foundSub,
    date: dateTimeMatch?.[1]?.trim() ?? null,
  });

  return {
    ticket: "T-DAEMON",
    recordType: "invoice",
    name: customerMatch?.[1]?.trim() ?? null,
    recordNumber: invoiceMatch?.[1]?.trim() ?? null,
    service: foundSvc,
    subservice: foundSub,
    value: amountMatch?.[1]?.trim() ?? null,
    date: dateTimeMatch?.[1]?.trim() ?? null, // return captured date/time
  };
}
