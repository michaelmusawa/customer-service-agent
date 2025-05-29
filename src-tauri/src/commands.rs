// src-tauri/src/lib.rs
use tauri::{AppHandle, Wry};
use serde_json::json;
use tauri_plugin_store::StoreExt;

use std::fs;
use pdf_extract::extract_text;
use tauri::command;

/// Save the API key under "agentApiKey" in `store.json`
#[tauri::command]
pub async fn save_api_key(app: AppHandle<Wry>, key: String) -> Result<(), String> {
  let store = app.store("store.json").map_err(|e| e.to_string())?;
  store.set("agentApiKey", json!(key));
  store.save().map_err(|e| e.to_string())?;
  store.close_resource();
  Ok(())
}

/// Load the API key from `store.json`, defaulting to `""`
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



#[command]
pub fn parse_invoice(file_path: String) -> Result<String, String> {
    match fs::read(file_path.clone()) {
        Ok(bytes) => {
            match extract_text(&bytes) {
                Ok(text) => Ok(text),
                Err(err) => Err(format!("Failed to extract text: {}", err)),
            }
        }
        Err(err) => Err(format!("Failed to read file: {}", err)),
    }
}

