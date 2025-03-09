#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod create_profile_symlink;
mod db;

use tauri::Manager;
use tauri_plugin_sql::Builder;
mod airport_community_scanner;
mod is_admin;
mod zip_handler;

#[tauri::command]
async fn switch_to_main_window(app_handle: tauri::AppHandle) -> Result<(), String> {
    // Get main window with error handling
    let main_window = app_handle
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    // Try to get splash window, but don't fail if it doesn't exist
    if let Some(splash_window) = app_handle.get_webview_window("splashscreen") {
        // Show main window first
        main_window.show().map_err(|e| e.to_string())?;

        // Small delay to ensure smooth transition
        std::thread::sleep(std::time::Duration::from_millis(500));

        // Close splash window
        splash_window.close().map_err(|e| e.to_string())?;

        println!("Window transition completed successfully");
    } else {
        // If there's no splash window, just show the main window
        println!("Splash window not found, showing main window directly");
        main_window.show().map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn main() {
    // Create a new Tauri application builder with default settings.
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            create_profile_symlink::activate_profiles,
            is_admin::is_admin,
            is_admin::restart_as_admin,
            airport_community_scanner::scan_for_airport_scenery,
            zip_handler::extract_zip_file,
            switch_to_main_window,
        ])
        .setup(|_app| {
            // Initialize the database.
            db::init();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
