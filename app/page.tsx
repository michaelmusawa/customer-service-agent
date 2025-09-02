"use client";

import React, { useEffect, useState, useCallback } from "react";

import { startInvoiceWatcher } from "./lib/invoiceWatcher";
import { ProcessingEvent } from "./lib/invoiceWatcher";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiLink,
  FiLoader,
  FiLock,
  FiLogOut,
  FiSave,
  FiServer,
  FiSettings,
  FiUser,
  FiX,
} from "react-icons/fi";
import {
  loadApiBaseUrl,
  loadApiKey,
  saveApiBaseUrl,
  saveApiKey,
} from "./lib/settings";
import { processFile, renamePath } from "./lib/utils";
import { basename } from "path";

export default function HomePage() {
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [events, setEvents] = useState<ProcessingEvent[]>([]);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing"
  >("idle");

  // New states for URL settings
  const [baseUrl, setBaseUrl] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [settingUrl, setSettingUrl] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [urlStatus, setUrlStatus] = useState<
    "idle" | "saving" | "forbidden" | "saved"
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

    // load saved base URL
    (async () => {
      const saved = await loadApiBaseUrl();
      setBaseUrl(saved);
      setSettingUrl(saved);
    })();
  }, []);

  async function handleSave() {
    // Clear any prior error
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedKey = apiKey.trim();

    // Validation: required
    if (!trimmedEmail || !trimmedKey) {
      setErrorMessage("Both email and API key are required.");
      setStatus("error");
      return;
    }

    // Validation: email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    // Proceed to save
    setStatus("loading");
    try {
      const combined = `${trimmedEmail}::${trimmedKey}`;
      await saveApiKey(combined);
      setStatus("saved");
      // clear form and error after a moment
      setTimeout(() => {
        setStatus("idle");
        setErrorMessage(null);
        setShowCredentials(false);
      }, 1500);
    } catch (e) {
      // If your saveApiKey throws a string or Error, normalize it:
      const msg = e instanceof Error ? e.message : "Unknown error";
      setErrorMessage(`Failed to save credentials: ${msg}`);
      setStatus("error");
    }
  }

  // New: handle URL save with password check
  async function handleUrlSave() {
    if (adminPassword !== "Admin@1234") {
      setUrlStatus("forbidden");
      return;
    }
    setUrlStatus("saving");
    try {
      await saveApiBaseUrl(settingUrl.trim() || baseUrl);
      setBaseUrl(settingUrl.trim());
      setUrlStatus("saved");
      setTimeout(() => setUrlStatus("idle"), 1500);
      setShowUrlModal(false);
    } catch (e) {
      console.error("Failed to save base URL:", e);
      setUrlStatus("forbidden");
    }
  }

  const handleProcessingEvent = useCallback((newEvent: ProcessingEvent) => {
    setEvents((prev) => {
      // find any prior entry for this file
      const idx = prev.findIndex((e) => e.fileName === newEvent.fileName);

      if (idx >= 0) {
        // overwrite the old event
        const updated = [...prev];
        updated[idx] = newEvent;
        return updated;
      } else {
        // new file: prepend and keep only the last 10
        return [newEvent, ...prev.slice(0, 9)];
      }
    });
    setProcessingStatus(newEvent.status === "started" ? "processing" : "idle");
  }, []);

  async function retryProcessing(event: ProcessingEvent) {
    if (!event.fullPath) return;

    const p = event.fullPath;
    let failedPath;

    const fileName = basename(p);
    if (p.includes("/invoices/failed/")) {
      failedPath = p;
    } else {
      failedPath = p.replace("/invoices/", "/invoices/failed/");
    }

    // 1) UI → mark as “started”
    handleProcessingEvent({
      fileName,
      fullPath: failedPath,
      status: "started",
      timestamp: Date.now(),
    });

    try {
      // 2) Remove from seenPaths so watcher will react

      console.log(failedPath);
      await processFile(failedPath);

      // 3) on success → update UI
      handleProcessingEvent({
        fileName,
        fullPath: failedPath,
        status: "success",
        timestamp: Date.now(),
      });

      // 3) Move the file back into "invoices" so the watcher will pick it up
      //    `renamePath` should move under BaseDirectory.Download automatically
      await renamePath(failedPath, "invoices/processed");
      // Inside retryProcessing error handler
    } catch (err) {
      let message: string;
      if (typeof err === "object" && err && "error" in (err as any)) {
        // Backend error object
        message = (err as any).error;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = String(err);
      }

      handleProcessingEvent({
        fileName,
        fullPath: failedPath,
        status: "error",
        error: message,
        timestamp: Date.now(),
      });
    }
  }

  const isProcessing = events.some((e) => e.status === "started");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // New: clear stored credentials and state
  async function handleLogout() {
    try {
      // Remove credentials from store
      await saveApiKey("");
      // Clear local state
      setEmail("");
      setApiKey("");
      setStatus("idle");
      setShowCredentials(false);
      console.log("🔒 Logged out");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  if (events.length > 0) {
    events.forEach((event) => {
      if (event.status === "error" && event.fullPath) {
        console.log("Failed path:", event.fullPath);
      }
    });
  }

  return (
    <main className="max-w-4xl mx-auto mt-12 px-4">
      {/* Logout button appears when we're not editing credentials */}
      <div className="absolute top-2 right-4 flex items-center space-x-3">
        {/* Logout (only when logged in) */}
        {!showCredentials && email && apiKey && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Logout"
            title="Logout"
          >
            <FiLogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => setShowUrlModal(true)}
          className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Advanced settings"
          title="Advanced settings"
        >
          <FiSettings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 pb-0">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <FiServer className="w-5 h-5 text-green-700 dark:text-blue-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Server Configuration
                  </h3>
                </div>
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="space-y-5">
                {/* Base URL Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiLink className="text-gray-500" />
                    <span>Base URL</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={settingUrl}
                      onChange={(e) => setSettingUrl(e.currentTarget.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder={baseUrl || "https://api.yourserver.com"}
                    />
                    <FiLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Admin Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <FiLock className="text-gray-500" />
                    <span>Admin Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.currentTarget.value)}
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      placeholder="••••••••"
                    />
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  </div>
                </div>

                {/* Status Messages */}
                {urlStatus === "forbidden" && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
                    <FiAlertTriangle className="flex-shrink-0" />
                    <span>Forbidden: Incorrect password</span>
                  </div>
                )}

                {urlStatus === "saved" && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
                    <FiCheckCircle className="flex-shrink-0" />
                    <span>Configuration saved successfully!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 px-5 py-4">
              <button
                onClick={handleUrlSave}
                disabled={urlStatus === "saving"}
                className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  urlStatus === "saving"
                    ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    : "bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-md hover:shadow-lg"
                }`}
              >
                {urlStatus === "saving" ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Saving Configuration...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors">
          <h1 className="text-2xl font-semibold mb-6 dark:text-white">
            Agent Settings
          </h1>

          {email && apiKey
            ? !showCredentials && (
                <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-4 rounded-full">
                  <FiUser className="w-4 h-4" />

                  <span className="text-sm font-semibold truncate max-w-xs">
                    {email}
                  </span>
                </div>
              )
            : !showCredentials && (
                <button
                  onClick={() => setShowCredentials(true)}
                  disabled={processingStatus === "processing"}
                  className={`w-full py-2 px-4 text-white rounded-md font-medium ${
                    processingStatus === "processing"
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Add Credentials
                </button>
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

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCredentials(false);
                    setErrorMessage(null);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={status === "loading"}
                  className={`w-full py-2 px-2 rounded-md text-white font-medium transition-colors ${
                    status === "loading"
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {status === "loading" ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}

          {status === "saved" && (
            <div className="mt-2 text-green-600 dark:text-green-400 text-sm font-medium">
              ✅ Credentials saved
            </div>
          )}
          {status === "error" && (
            <div className="mt-2 text-red-600 dark:text-red-400 text-sm font-medium">
              ❌ {errorMessage}
            </div>
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
                        : event.status === "skipped"
                        ? "border-yellow-200 bg-yellow-50 dark:border-yellow-800/50 dark:bg-yellow-900/20"
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
                            : event.status === "skipped"
                            ? "text-yellow-500 dark:text-yellow-400"
                            : "text-blue-500 dark:text-blue-400"
                        }`}
                      >
                        {event.status === "success"
                          ? "✓"
                          : event.status === "error"
                          ? "✗"
                          : event.status === "skipped"
                          ? "⚠"
                          : "↻"}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm dark:text-gray-300">
                          {event.status === "success"
                            ? "Successfully processed"
                            : event.status === "error"
                            ? `Error: ${event.error || "Processing failed"}`
                            : event.status === "skipped"
                            ? event.error || "Document skipped (duplicate)"
                            : "Processing started..."}
                        </div>

                        {event.status === "error" && (
                          <div className="mt-2">
                            <span className="text-red-700 dark:text-red-400 text-sm font-medium">
                              {event.error}
                            </span>

                            {/* Fallback troubleshooting tips if backend didn’t provide a clear error */}
                            {!event.error ||
                              (event.error === "Processing failed" && (
                                <div className="mt-2">
                                  <div className="text-red-700 dark:text-red-400 text-sm font-medium">
                                    Troubleshooting:
                                  </div>
                                  <ul className="text-red-600 dark:text-red-400 text-sm list-disc pl-5 mt-1 space-y-1">
                                    <li>
                                      Check if the PDF contains required fields
                                    </li>
                                    <li>
                                      Ensure the file is a valid invoice
                                      document
                                    </li>
                                  </ul>
                                </div>
                              ))}

                            {event.fullPath && (
                              <button
                                onClick={() => retryProcessing(event)}
                                className="mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center transition-colors"
                              >
                                <span className="mr-1">↻</span> Retry processing
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

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center space-x-3">
              <FiAlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirm Logout
              </h3>
            </div>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              Are you sure you want to log out? You will need to re-enter your
              credentials to continue.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutConfirm(false);
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
