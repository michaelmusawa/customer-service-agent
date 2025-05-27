// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { get, set } from "@tauri-apps/plugin-store";

export default function HomePage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );

  // load the saved key on first render
  useEffect(() => {
    async function loadKey() {
      setStatus("loading");
      try {
        const stored = await get<string>("agentApiKey");
        if (stored) setApiKey(stored);
        setStatus("idle");
      } catch (e) {
        console.error("Failed to load API key:", e);
        setStatus("error");
      }
    }
    loadKey();
  }, []);

  // handler for clicking “Save”
  async function handleSave() {
    setStatus("loading");
    try {
      await set("agentApiKey", apiKey);
      setStatus("saved");
      // clear “saved” after a moment
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e) {
      console.error("Failed to save API key:", e);
      setStatus("error");
    }
  }

  return (
    <main
      style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "sans-serif" }}
    >
      <h1>Agent Settings</h1>

      <label htmlFor="apiKey" style={{ display: "block", marginTop: "1rem" }}>
        Agent API Key
      </label>
      <input
        id="apiKey"
        type="text"
        value={apiKey}
        onChange={(e) => setApiKey(e.currentTarget.value)}
        placeholder="Paste your Next.js agent key here"
        style={{
          width: "100%",
          padding: "0.5rem",
          marginTop: "0.5rem",
          fontSize: "1rem",
        }}
      />

      <button
        onClick={handleSave}
        disabled={status === "loading"}
        style={{
          marginTop: "1rem",
          padding: "0.6rem 1.2rem",
          fontSize: "1rem",
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "Saving…" : "Save"}
      </button>

      {status === "saved" && (
        <p style={{ color: "green", marginTop: "0.75rem" }}>
          ✅ API Key saved!
        </p>
      )}
      {status === "error" && (
        <p style={{ color: "red", marginTop: "0.75rem" }}>
          ❌ Something went wrong. Check console.
        </p>
      )}
    </main>
  );
}
