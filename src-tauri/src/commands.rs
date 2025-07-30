// src-tauri/src/commands.rs
use tauri::{AppHandle, Wry};
use serde_json::json;
use tauri_plugin_store::StoreExt;


use pdf_extract::extract_text;
use tauri::command;

/// Save the API key under "agentApiKey" in `store.json`
#[tauri::command]
pub async fn save_api_key(app: AppHandle<Wry>, key: String) -> Result<(), String> {
  let store = app.store("store.json").map_err(|e| e.to_string())?;
  store.set("agentApiKey", json!(key)); // key should be: "email::key"
  store.save().map_err(|e| e.to_string())?;
  store.close_resource();
  Ok(())
}

#[tauri::command]
pub async fn load_api_key(app: AppHandle<Wry>) -> Result<String, String> {
  let store = app.store("store.json").map_err(|e| e.to_string())?;
  let value = store
    .get("agentApiKey")
    .and_then(|v| v.as_str().map(str::to_string))
    .unwrap_or_default();
  store.close_resource();
  Ok(value)
}

/// Save the API base URL under “apiBaseUrl” in `store.json`
#[tauri::command]
pub async fn save_api_base_url(app: AppHandle<Wry>, url: String) -> Result<(), String> {
  let store = app.store("store.json").map_err(|e| e.to_string())?;
  store.set("apiBaseUrl", json!(url));
  store.save().map_err(|e| e.to_string())?;
  store.close_resource();
  Ok(())
}

/// Load the API base URL (or empty if not present)
#[tauri::command]
pub async fn load_api_base_url(app: AppHandle<Wry>) -> Result<String, String> {
  let store = app.store("store.json").map_err(|e| e.to_string())?;
  let value = store
    .get("apiBaseUrl")
    .and_then(|v| v.as_str().map(str::to_string))
    .unwrap_or_default();
  store.close_resource();
  Ok(value)
}


#[command]
pub fn parse_invoice(file_path: String) -> Result<String, String> {
  let metadata = std::fs::metadata(&file_path)
    .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
  if metadata.len() > 10 * 1024 * 1024 { // 10MB limit
    return Err("File too large (max 10MB)".into());
  }

  extract_text(&file_path)
    .map_err(|e| format!("Failed to extract text: {}", e))
}

