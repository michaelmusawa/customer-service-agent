// src/fieldExtractor.ts
export function extractFields(text: string) {
  const customerMatch = text.match(/Customer\s*Name:\s*(.+)/i);
  const addressMatch = text.match(/Address:\s*(.+)/i);
  const amountMatch = text.match(/Total\s*Amount:\s*(\d+[\.,]?\d*)/i);

  return {
    customerName: customerMatch?.[1]?.trim() || null,
    address: addressMatch?.[1]?.trim() || null,
    totalAmount: amountMatch?.[1]?.trim() || null,
  };
}
