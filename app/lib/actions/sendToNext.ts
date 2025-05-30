// app/lib/actions/sendToNext.ts
import axios from "axios";
import { loadApiKey } from "../tauriApi";

export async function sendToNext(payload: any) {
  console.log("Sending payload to Next.js webhook:", payload);
  const apiKey = await loadApiKey();
  const endpoint = "https://customer-service/api/invoices/import";

  await axios.post(endpoint, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}
