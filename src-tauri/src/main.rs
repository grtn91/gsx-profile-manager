mod db;

use tauri_plugin_sql::Builder;

fn main() {
    // Create a new Tauri application builder with default settings.
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(Builder::default().build())
        .setup(|_app| {
            // Initialize the database.
            db::init();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
