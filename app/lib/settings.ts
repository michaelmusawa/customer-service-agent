import { invoke } from "@tauri-apps/api/core";

export async function saveApiKey(key: string): Promise<void> {
  await invoke("save_api_key", { key });
}

export async function loadApiKey(): Promise<string> {
  return await invoke<string>("load_api_key");
}
