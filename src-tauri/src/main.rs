#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod modules;
use modules::file_system;
use modules::profile_manager;
use modules::app_state;
use modules::user_folders;

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
            app_state::load_app_state,

            // User Folder
            user_folders::get_user_folders,
            user_folders::create_user_folder,
            user_folders::create_subfolder,
            user_folders::select_files_for_import,
            user_folders::import_file_to_user_folder,
            user_folders::delete_user_folder_item,
            user_folders::copy_file_to_user_folder,
            user_folders::sync_user_folders_with_watched,
            user_folders::refresh_local_folders,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}