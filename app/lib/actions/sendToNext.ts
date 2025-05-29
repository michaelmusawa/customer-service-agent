// app/lib/actions/sendToNext.ts
import axios from "axios";
import { loadApiKey } from "../settings";

export async function sendToNext(payload: any) {
  const apiKey = await loadApiKey();
  const endpoint = "https://your-domain.com/api/invoices/import";

  await axios.post(endpoint, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
