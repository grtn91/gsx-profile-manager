#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod create_profile_symlink;
mod db;
use tauri_plugin_sql::Builder;
mod airport_community_scanner;
mod is_admin;

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
        ])
        .setup(|_app| {
            // Initialize the database.
            db::init();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
