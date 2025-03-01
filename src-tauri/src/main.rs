#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod modules;
use modules::file_system;
use modules::profile_manager;
use modules::app_state;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            // File system operations
            file_system::read_folder_contents, 
            file_system::select_folder, 
            file_system::check_folder_exists,
            
            // Profile management
            profile_manager::activate_profiles,
            
            // App state operations
            app_state::save_app_state,
            app_state::load_app_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}