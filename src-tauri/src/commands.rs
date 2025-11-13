// src-tauri/src/commands.rs
use tauri::{AppHandle, Wry};
use serde_json::json;
use tauri_plugin_store::StoreExt;
use tauri_plugin_updater::UpdaterExt;

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
pub async fn parse_invoice(app: AppHandle<Wry>, file_path: String) -> Result<String, String> {


    // 1. Try normal text extraction
    if let Ok(text) = extract_text(&file_path) {
        if !text.trim().is_empty() {
            return Ok(text);
        }
       
    }

    // 2. Load the API base URL from the store
    let store = app.store("store.json").map_err(|e| e.to_string())?;
    let base_url = store
        .get("apiBaseUrl")
        .and_then(|v| v.as_str().map(str::to_string))
        .unwrap_or_default();
    store.close_resource();

    // 3. Construct the full OCR endpoint dynamically
    let ocr_url = format!("{}/ocr/pdf", base_url.trim_end_matches('/'));

    println!("[parse_invoice] Fallback to OCR endpoint: {}", ocr_url);

    // 2. Fall back to OCR via FastAPI
    let client = tauri_plugin_http::reqwest::Client::new();
    let file_bytes = std::fs::read(&file_path).map_err(|e| e.to_string())?;

    let res = client
        .post(&ocr_url)
        .header("Content-Type", "application/pdf")
        .body(file_bytes)
        .send()
        .await
        .map_err(|e| {
            let msg = format!("OCR request failed: {}", e);
            println!("[parse_invoice] {}", msg);
            msg
        })?;
    let status = res.status();
    let text = res.text().await.map_err(|e| e.to_string())?;

    println!("[parse_invoice] OCR response status: {}", status);
    println!("[parse_invoice] Raw OCR response snippet: {}", &text[..text.len().min(300)]); // log safely

    if status.is_success() {
        match serde_json::from_str::<serde_json::Value>(&text) {
            Ok(json) => {
                if let Some(extracted) = json.get("text").and_then(|t| t.as_str()) {
                    println!(
                        "[parse_invoice] Successfully extracted OCR text ({} chars)",
                        extracted.len()
                    );
                    return Ok(extracted.to_string());
                } else {
                    println!("[parse_invoice] OCR JSON did not contain 'text' field.");
                }
            }
            Err(e) => {
                println!("[parse_invoice] Failed to parse OCR JSON: {}", e);
            }
        }
    } else {
        println!("[parse_invoice] OCR returned non-success status: {}", status);
    }

    Err("Failed to extract text".into())
}

#[command]
pub async fn update(app: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
  if let Some(update) = app.updater()?.check().await? {
    let mut downloaded = 0;

    // alternatively we could also call update.download() and update.install() separately
    update
      .download_and_install(
        |chunk_length, content_length| {
          downloaded += chunk_length;
          println!("downloaded {downloaded} from {content_length:?}");
        },
        || {
          println!("download finished");
        },
      )
      .await?;

    println!("update installed");
    app.restart();
  }

  Ok(())
}
