#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod profile_manager;

use profile_manager::commands;
use std::path::PathBuf;
use tauri::{App, AppHandle, Error as TauriError, Manager, State, WindowBuilder, WindowUrl};
use tauri_plugin_sql::Sql;

#[derive(Debug)]
struct AppState;

async fn setup_database(app: &AppHandle) -> Result<(), tauri::Error> {
    let sql = app
        .state::<tauri_plugin_sql::Sql>()
        .expect("failed to get sql plugin");
    let db = sql.get("sqlite:profiles.db").await?;

    db.execute(
        "CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            continent TEXT NOT NULL,
            country TEXT NOT NULL,
            icao TEXT NOT NULL,
            developer TEXT,
            version TEXT,
            file_path TEXT NOT NULL
        )",
        [],
    )
    .await
    .map_err(|e| TauriError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;

    Ok(())
}

fn main() -> tauri::Result<()> {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle();

            // Create the main window
            #[cfg(debug_assertions)]
            app.get_webview_window("main").unwrap_or_else(|| {
                app.create_webview_window(
                    "main",
                    tauri::WebviewUrl::App("index.html".into()),
                    |window_builder| window_builder,
                )
                .expect("failed to create window")
            });

            tauri::async_runtime::spawn(async move {
                if let Err(e) = setup_database(&app_handle).await {
                    eprintln!("Failed to initialize database: {}", e);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![commands::store_profile])
        .run(tauri::generate_context!())?;

    Ok(())
}
