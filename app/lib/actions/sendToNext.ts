// app/lib/actions/sendToNextRaw.ts
import axios from "axios";
import { loadApiKey } from "../tauriApi";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { loadApiBaseUrl } from "../settings";

interface RawPayload {
  type: "pdf" | "excel";
  fileName: string;
  content: string | unknown; // text for pdf, rows[] for excel
}

export async function sendToNextRaw(payload: RawPayload) {
  const apiKey = await loadApiKey();

  if (!apiKey) {
    sendNotification({
      title: "Daemon",
      body: "❌ No API key or Email configured",
    });
    throw new Error("No API key configured");
  }

  const base = await loadApiBaseUrl();
  const endpoint = `${base.replace(/\/$/, "")}/api/records`;

  try {
    const response = await axios.post(endpoint, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (
      response.data &&
      response.data.message?.includes("No new records inserted")
    ) {
      sendNotification({
        title: "Invoice Agent",
        body: `⚠️ Skipped: ${payload.fileName} (already processed)`,
      });
      return response.data;
    } else if (response.status === 200) {
      sendNotification({
        title: "Invoice Agent",
        body: "✅ File sent successfully!",
      });
    } else {
      sendNotification({
        title: "Invoice Agent",
        body: "❌ Failed to send file",
      });
      throw new Error(`API responded with status ${response.status}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Let API response bubble up instead of custom messages
      throw error.response.data;
    }
    throw error;
  }
}
