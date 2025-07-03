"use client";

import React, { useEffect, useState, useCallback } from "react";
import { saveApiKey, loadApiKey } from "./lib/tauriApi";
import { startInvoiceWatcher } from "./lib/invoiceWatcher";
import { ProcessingEvent } from "./lib/invoiceWatcher";
import { rename, BaseDirectory } from "@tauri-apps/plugin-fs";

export default function HomePage() {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );
  const [showCredentials, setShowCredentials] = useState(false);
  const [events, setEvents] = useState<ProcessingEvent[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing"
  >("idle");

  useEffect(() => {
    async function initWatcher() {
      try {
        await startInvoiceWatcher(handleProcessingEvent);
      } catch (e) {
        console.error("🚨 startInvoiceWatcher threw:", e);
      }
    }
    initWatcher();
  }, []);

  useEffect(() => {
    async function fetchStoredCredentials() {
      setStatus("loading");
      try {
        const stored = await loadApiKey(); // Format: `${email}::${key}`
        if (stored && stored.includes("::")) {
          const [storedEmail, storedKey] = stored.split("::");
          setApiKey(storedKey);
          setEmail(storedEmail);
        }
        setStatus("idle");
      } catch (e) {
        console.error("Failed to load credentials:", e);
        setStatus("error");
      }
    }
    fetchStoredCredentials();
  }, []);

  async function handleSave() {
    setStatus("loading");
    try {
      const combined = `${email}::${apiKey}`;
      await saveApiKey(combined);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
      setShowCredentials(false);
    } catch (e) {
      console.error("Failed to save API key:", e);
      setStatus("error");
    }
  }

  const handleProcessingEvent = useCallback((newEvent: ProcessingEvent) => {
    setEvents((prev) => {
      const idx = prev.findIndex(
        (e) => e.fileName === newEvent.fileName && e.status === "started"
      );
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = newEvent;
        return updated;
      } else {
        return [newEvent, ...prev.slice(0, 9)];
      }
    });
    setProcessingStatus(newEvent.status === "started" ? "processing" : "idle");
  }, []);

  async function retryProcessing(event: ProcessingEvent) {
    if (!event.fullPath) return;

    try {
      handleProcessingEvent({
        fileName: event.fileName,
        fullPath: event.fullPath,
        status: "started",
        timestamp: Date.now(),
      });

      const originalPath = event.fullPath.replace("/failed/", "/invoices/");
      await rename(event.fullPath, originalPath, {
        oldPathBaseDir: BaseDirectory.Download,
        newPathBaseDir: BaseDirectory.Download,
      });
    } catch (err) {
      console.error("Retry failed:", err);
    }
  }

  const isProcessing = events.some((e) => e.status === "started");

  return (
    <main className="max-w-4xl mx-auto mt-8 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
          <h1 className="text-2xl font-semibold mb-6 dark:text-white">
            Agent Settings
          </h1>

          {!showCredentials && (
            <button
              onClick={() => setShowCredentials(true)}
              disabled={processingStatus === "processing"}
              className={`w-full py-2 px-4 text-white rounded-md font-medium ${
                processingStatus === "processing"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Add Credentials
            </button>
          )}
          {status === "saved" && (
            <div className="mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              ✅ Credentials saved
            </div>
          )}
          {status === "error" && (
            <div className="mt-2 text-red-600 dark:text-red-400 text-sm font-medium">
              ❌ Failed to save credentials
            </div>
          )}

          {showCredentials && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Agent Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  placeholder="e.g. agent@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.currentTarget.value)}
                  placeholder="Paste your API key here"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={status === "loading"}
                className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                  status === "loading"
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {status === "loading" ? "Saving..." : "Save Credentials"}
              </button>
            </>
          )}

          {/* Watcher Status */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium dark:text-gray-200">
                Watcher Status
              </h2>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  isProcessing
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                    : "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                }`}
              >
                {isProcessing ? "PROCESSING" : "IDLE"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Watching ~/Downloads/invoices
            </p>
          </div>
        </div>

        {/* Right side panel unchanged */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">
                Processing History
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last {events.length} events
              </span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No processing events yet. Add PDFs to your invoices folder to
                  begin.
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={`${event.fileName}-${event.timestamp}`}
                    className={`p-4 rounded-lg border transition-colors ${
                      event.status === "success"
                        ? "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20"
                        : event.status === "error"
                        ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20"
                        : "border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/20"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="font-medium truncate max-w-[60%] dark:text-white">
                        {event.fileName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="mt-2 flex items-start">
                      <div
                        className={`mr-2 mt-1 ${
                          event.status === "success"
                            ? "text-green-500 dark:text-green-400"
                            : event.status === "error"
                            ? "text-red-500 dark:text-red-400"
                            : "text-blue-500 dark:text-blue-400"
                        }`}
                      >
                        {event.status === "success"
                          ? "✓"
                          : event.status === "error"
                          ? "✗"
                          : "↻"}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm dark:text-gray-300">
                          {event.status === "success"
                            ? "Successfully processed"
                            : event.status === "error"
                            ? `Error: ${event.error || "Processing failed"}`
                            : "Processing started..."}
                        </div>

                        {event.status === "error" && (
                          <div className="mt-2">
                            <div className="text-red-700 dark:text-red-400 text-sm font-medium">
                              Troubleshooting:
                            </div>
                            <ul className="text-red-600 dark:text-red-400 text-sm list-disc pl-5 mt-1 space-y-1">
                              <li>Check if the PDF contains required fields</li>
                              <li>Verify the PDF is not password protected</li>
                              <li>
                                Ensure the file is a valid invoice document
                              </li>
                              <li>Confirm API key has required permissions</li>
                            </ul>

                            {event.fullPath &&
                              event.fullPath.includes("/failed/") && (
                                <button
                                  onClick={() => retryProcessing(event)}
                                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center transition-colors"
                                >
                                  <span className="mr-1">↻</span> Retry
                                  processing
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
