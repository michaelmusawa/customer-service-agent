// app/lib/settings.ts
import { set, get } from "@tauri-apps/plugin-store";

const storeKey = "agentApiKey";

export async function saveApiKey(key: string) {
  await set(storeKey, key);
}

export async function loadApiKey(): Promise<string> {
  return (await get<string>(storeKey)) ?? "";
}
