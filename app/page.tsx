// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { saveApiKey, loadApiKey } from "./lib/tauriApi";
import { startInvoiceWatcher } from "./lib/invoiceWatcher";

export default function HomePage() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );

  useEffect(() => {
    async function initWatcher() {
      try {
        await startInvoiceWatcher();
        console.log("✅ Invoice watcher started");
      } catch (e) {
        console.error("🚨 startInvoiceWatcher threw:", e);
      }
    }
    initWatcher();
  }, []);

  useEffect(() => {
    async function fetchKey() {
      setStatus("loading");
      try {
        const stored = await loadApiKey();
        if (stored) setApiKeyState(stored);
        setStatus("idle");
      } catch (e) {
        console.error("Failed to load API key:", e);
        setStatus("error");
      }
    }
    fetchKey();
  }, []);

  async function handleSave() {
    setStatus("loading");
    try {
      await saveApiKey(apiKey);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error("Failed to save API key:", e);
      setStatus("error");
    }
  }

  return (
    <main className="max-w-md mx-auto mt-12 px-4">
      <h1 className="text-2xl font-semibold">Agent Settings</h1>

      <label
        htmlFor="apiKey"
        className="block mt-6 text-sm font-medium text-gray-700"
      >
        Agent API Key
      </label>
      <input
        id="apiKey"
        type="text"
        value={apiKey}
        onChange={(e) => setApiKeyState(e.currentTarget.value)}
        placeholder="Paste your Next.js agent key here"
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
      />

      <button
        onClick={handleSave}
        disabled={status === "loading"}
        className={`
          mt-6 w-full flex justify-center items-center
          px-4 py-2 text-white font-medium rounded-md
          ${
            status === "loading"
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }
        `}
      >
        {status === "loading" ? "Saving…" : "Save"}
      </button>

      {status === "saved" && (
        <p className="mt-4 text-green-600 flex items-center">
          ✅ API Key saved!
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 text-red-600 flex items-center">
          ❌ Something went wrong. Check console.
        </p>
      )}
    </main>
  );
}
