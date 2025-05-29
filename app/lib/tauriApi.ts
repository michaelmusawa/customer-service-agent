// app/lib/tauriApi.ts

import { invoke } from "@tauri-apps/api/core";

/**
 * Save the Agent API key using Rust backend
 * @param key - API key string
 */
export async function saveApiKey(key: string): Promise<void> {
  await invoke("save_api_key", { key });
}

/**
 * Load the Agent API key from Rust backend
 * @returns stored API key or empty string
 */
export async function loadApiKey(): Promise<string> {
  return await invoke<string>("load_api_key");
}
