// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{generate_context, Builder};
use tauri_plugin_store::{Builder as StorePluginBuilder};

// Bring your commands into scope from the renamed module
mod commands;
use commands::{save_api_key, load_api_key, save_api_base_url, load_api_base_url, parse_invoice, update}; 

fn main() {
    Builder::default()
        .plugin(StorePluginBuilder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            use tauri_plugin_notification::NotificationExt;
            app.notification()
                .builder()
                .title("Customer Service Agent")
                .body("Application started successfully!")
                .show()
                .unwrap();
    
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_api_key, load_api_key, save_api_base_url, load_api_base_url, parse_invoice, update])
        .plugin(tauri_plugin_fs::init())
        .run(generate_context!())
        .expect("error while running tauri application");
}
