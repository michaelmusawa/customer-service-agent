// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{generate_context, Builder};
use tauri_plugin_store::{Builder as StorePluginBuilder};

// Bring your commands into scope from the renamed module
mod commands;
use commands::{save_api_key, load_api_key, parse_invoice}; 

fn main() {
    Builder::default()
        .plugin(StorePluginBuilder::default().build())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            use tauri_plugin_notification::NotificationExt;
            app.notification()
                .builder()
                .title("Tauri")
                .body("Tauri is awesome")
                .show()
                .unwrap();
    
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_api_key, load_api_key, parse_invoice])
        .plugin(tauri_plugin_fs::init())
        .run(generate_context!())
        .expect("error while running tauri application");
}
