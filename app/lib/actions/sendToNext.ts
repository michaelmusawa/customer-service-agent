// app/lib/actions/sendToNext.ts
import axios from "axios";
import { loadApiKey } from "../tauriApi";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { ExtractedFields } from "../fieldExtractor";

export async function sendToNext(payload: ExtractedFields) {
  console.log("🚀 Sending payload to Next.js API:", payload);
  const apiKey = await loadApiKey();
  console.log("🚀 Loaded API key:", apiKey);

  if (!apiKey) {
    sendNotification({
      title: "Daemon",
      body: "❌ No API key or Email configured",
    });
    throw new Error("No API key configured");
  }

  const endpoint = "http://localhost:3001/api/records";

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 seconds timeout
    });

    if (response.status !== 200) {
      if (response.status === 401) {
        sendNotification({
          title: "Daemon",
          body: "❌ Access denied. Check your Email and API Key",
        });
      }
      sendNotification({
        title: "Invoice Agent",
        body: "❌ Failed to process PDF. Check logs.",
      });
      throw new Error(`API responded with status ${response.status}`);
    } else {
      sendNotification({
        title: "Invoice Agent",
        body: "✅ PDF processed successfully!",
      });
    }

    return response.data;
  } catch (error) {
    let errorMessage = "Network error";

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(`API request failed: ${errorMessage}`);
  }
}
