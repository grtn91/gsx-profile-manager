use crate::modules::types::AppState;
use serde_json::json;
use tauri::AppHandle;
use tauri::Manager; // Ensure Manager is explicitly imported
use tauri_plugin_store::{StoreBuilder, StoreExt};

#[tauri::command]
pub fn get_app_data_path(app_handle: AppHandle) -> Result<String, String> {
    let path = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    println!("App data path: {:?}", path);
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn save_app_state(
    app_handle: AppHandle,
    current_folder: Option<String>,
    selected_files: Vec<String>,
    expanded_ids: Vec<String>,
    local_expanded_ids: Vec<String>,
    folder_watch_initialized: Option<bool>,
    local_folder_initialized: Option<bool>,
) -> Result<(), String> {
    // Get or create the store
    let store = match app_handle.get_store("app-settings.json") {
        Some(store) => store,
        None => {
            // Initialize the store if it doesn't exist
            let path = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?
                .join("app-settings.json");

            println!("Creating new store at: {:?}", path);
            StoreBuilder::new(&app_handle, path)
                .build()
                .map_err(|e| format!("Failed to create store: {}", e))?
        }
    };

    // Print the values we're about to save for debugging
    println!(
        "Saving state with folder_watch_initialized: {:?}, local_folder_initialized: {:?}",
        folder_watch_initialized, local_folder_initialized
    );

    // FIXED: store.set() returns (), not Result, so don't use map_err
    store.set(
        "app_state".to_string(),
        json!({
            "current_folder": current_folder,
            "selected_files": selected_files,
            "expanded_ids": expanded_ids,
            "local_expanded_ids": local_expanded_ids,
            "folder_watch_initialized": folder_watch_initialized.unwrap_or(false),
            "local_folder_initialized": local_folder_initialized.unwrap_or(false),
        }),
    );

    // Explicitly save the store - this returns Result so keep map_err
    store
        .save()
        .map_err(|e| format!("Failed to save store to disk: {}", e))?;

    // Verify the store after saving
    match app_handle.get_store("app-settings.json") {
        Some(verify_store) => {
            if let Some(app_state) = verify_store.get("app_state") {
                println!("VERIFICATION - State after save: {:?}", app_state);
            } else {
                println!("VERIFICATION FAILED - app_state not found after save!");
            }
        }
        None => println!("VERIFICATION FAILED - Store not found after save!"),
    }

    Ok(())
}

use std::fs;

// Add more detailed info to debug_read_app_settings
#[tauri::command]
pub async fn debug_read_app_settings(app_handle: AppHandle) -> Result<String, String> {
    let path = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?
        .join("app-settings.json");

    // Check if file exists
    if !path.exists() {
        return Ok("File does not exist".to_string());
    }

    println!("Reading file directly from: {:?}", path);

    // Try to read the file
    match fs::read_to_string(&path) {
        Ok(content) => {
            println!("Raw file content: {}", content);

            // Try parsing as JSON for prettier display
            match serde_json::from_str::<serde_json::Value>(&content) {
                Ok(json_value) => {
                    println!("Parsed as JSON: {:?}", json_value);
                    if let Some(obj) = json_value.as_object() {
                        if let Some(app_state) = obj.get("app_state") {
                            if let Some(state_obj) = app_state.as_object() {
                                println!("Initialization flags in file:");
                                println!(
                                    "  folder_watch_initialized: {:?}",
                                    state_obj.get("folder_watch_initialized")
                                );
                                println!(
                                    "  local_folder_initialized: {:?}",
                                    state_obj.get("local_folder_initialized")
                                );
                            }
                        }
                    }
                }
                Err(e) => println!("Not valid JSON: {}", e),
            }

            Ok(content)
        }
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
pub async fn load_app_state(app_handle: AppHandle) -> Result<serde_json::Value, String> {
    let store = match app_handle.get_store("app-settings.json") {
        Some(store) => store,
        None => {
            // Return default values if store doesn't exist yet
            return Ok(serde_json::json!({
                "currentFolder": null,
                "selectedFiles": [],
                "expandedIds": [],
                "localExpandedIds": [],
                "folderWatchInitialized": false,
                "localFolderInitialized": false
            }));
        }
    };

    // Try to get the app_state as a whole
    if let Some(app_state) = store.get("app_state") {
        // Debug what we're getting from storage
        println!("Raw app state from store: {:?}", app_state);

        // Create a new JSON object with camelCase keys for frontend
        let mut frontend_state = serde_json::Map::new();

        if let Some(obj) = app_state.as_object() {
            // Map snake_case to camelCase for frontend
            if let Some(val) = obj.get("current_folder") {
                frontend_state.insert("currentFolder".to_string(), val.clone());
            }

            if let Some(val) = obj.get("selected_files") {
                frontend_state.insert("selectedFiles".to_string(), val.clone());
            } else {
                frontend_state.insert("selectedFiles".to_string(), serde_json::json!([]));
            }

            if let Some(val) = obj.get("expanded_ids") {
                frontend_state.insert("expandedIds".to_string(), val.clone());
            } else {
                frontend_state.insert("expandedIds".to_string(), serde_json::json!([]));
            }

            if let Some(val) = obj.get("local_expanded_ids") {
                frontend_state.insert("localExpandedIds".to_string(), val.clone());
            } else {
                frontend_state.insert("localExpandedIds".to_string(), serde_json::json!([]));
            }

            // IMPORTANT: Make sure these boolean flags are correctly handled
            if let Some(val) = obj.get("folder_watch_initialized") {
                println!("Found folder_watch_initialized: {:?}", val);
                frontend_state.insert("folderWatchInitialized".to_string(), val.clone());
            } else {
                frontend_state.insert(
                    "folderWatchInitialized".to_string(),
                    serde_json::json!(false),
                );
            }

            if let Some(val) = obj.get("local_folder_initialized") {
                println!("Found local_folder_initialized: {:?}", val);
                frontend_state.insert("localFolderInitialized".to_string(), val.clone());
            } else {
                frontend_state.insert(
                    "localFolderInitialized".to_string(),
                    serde_json::json!(false),
                );
            }
        }

        let result = serde_json::Value::Object(frontend_state);
        println!("Returning to frontend: {:?}", result);
        return Ok(result);
    }

    // Fallback with default values
    Ok(serde_json::json!({
        "currentFolder": null,
        "selectedFiles": [],
        "expandedIds": [],
        "localExpandedIds": [],
        "folderWatchInitialized": false,
        "localFolderInitialized": false
    }))
}
