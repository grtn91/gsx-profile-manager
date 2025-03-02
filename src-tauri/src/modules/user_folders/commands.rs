use super::helpers::{get_user_folders_path, read_user_folders_tree};
use crate::modules::types::TreeDataItem;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_store::StoreBuilder;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn get_user_folders() -> Result<Vec<TreeDataItem>, String> {
    read_user_folders_tree()
}

#[tauri::command]
pub async fn create_user_folder(folder_name: String) -> Result<(), String> {
    let base_path = get_user_folders_path()?;
    let new_folder_path = base_path.join(folder_name);

    fs::create_dir_all(new_folder_path)
        .map_err(|e| format!("Failed to create custom folder: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn refresh_local_folders() -> Result<Vec<TreeDataItem>, String> {
    // This command simply reads the folder structure fresh from disk
    // and returns the updated folder tree
    read_user_folders_tree()
}

// Make sure the import_file_to_user_folder properly updates folder IDs
#[tauri::command]
pub async fn import_file_to_user_folder(
    source_file_path: String,
    target_folder_id: String,
) -> Result<(), String> {
    let source_path = PathBuf::from(source_file_path);

    if !source_path.exists() || !source_path.is_file() {
        return Err("Source file does not exist".to_string());
    }

    let file_name = source_path.file_name().ok_or("Invalid source file path")?;

    // Determine target folder path
    let target_path = if target_folder_id == "root" {
        get_user_folders_path()?
    } else {
        PathBuf::from(target_folder_id)
    };

    // Ensure the target folder exists
    if !target_path.exists() {
        fs::create_dir_all(&target_path)
            .map_err(|e| format!("Failed to create target directory: {}", e))?;
    }

    // Copy the file
    let target_file_path = target_path.join(file_name);
    fs::copy(&source_path, &target_file_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn create_subfolder(parent_folder_id: String, folder_name: String) -> Result<(), String> {
    let parent_path = if parent_folder_id == "root" {
        // Special case for the root node - use base user folders path
        get_user_folders_path()?
    } else {
        PathBuf::from(&parent_folder_id)
    };

    if !parent_path.exists() {
        fs::create_dir_all(&parent_path)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    }

    let new_folder_path = parent_path.join(folder_name);

    fs::create_dir_all(new_folder_path)
        .map_err(|e| format!("Failed to create subfolder: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn initialize_local_folders(app_handle: AppHandle) -> Result<(), String> {
    // Get the path to the user folders
    let user_folders_path =
        get_user_folders_path().map_err(|e| format!("Failed to get user folders path: {}", e))?;

    // Create the directory if it doesn't exist
    if !user_folders_path.exists() {
        fs::create_dir_all(&user_folders_path)
            .map_err(|e| format!("Failed to create user folders directory: {}", e))?;
    }

    // Create the root folder if it doesn't exist
    let root_folder_path = user_folders_path.join("root");
    if !root_folder_path.exists() {
        fs::create_dir_all(&root_folder_path)
            .map_err(|e| format!("Failed to create root folder: {}", e))?;
    }

    // Create some example folders
    let example_folders = vec!["Aircraft", "Scenery", "Utilities"];
    for folder in example_folders {
        let path = root_folder_path.join(folder);
        if !path.exists() {
            fs::create_dir_all(&path)
                .map_err(|e| format!("Failed to create example folder {}: {}", folder, e))?;
        }
    }

    // Also update our settings store to mark local folders as initialized
    // This provides a double guarantee that we're marking as initialized
    let store = match app_handle.get_store("app-settings.json") {
        Some(store) => store,
        None => {
            // Initialize the store if it doesn't exist
            let path = app_handle
                .path()
                .app_data_dir()
                .map_err(|e| format!("Failed to get app data directory: {}", e))?
                .join("app-settings.json");

            StoreBuilder::new(&app_handle, path)
                .build()
                .map_err(|e| format!("Failed to create store: {}", e))?
        }
    };

    // Get the current app state or create a default one
    let mut app_state = match store.get("app_state") {
        Some(state) => {
            if let Some(obj) = state.as_object() {
                // Convert back to AppState struct
                let mut state_obj = serde_json::Map::new();
                for (key, value) in obj {
                    state_obj.insert(key.clone(), value.clone());
                }
                serde_json::Value::Object(state_obj)
            } else {
                // Create default state
                serde_json::json!({
                    "current_folder": null,
                    "selected_files": [],
                    "expanded_ids": [],
                    "local_expanded_ids": [],
                    "folder_watch_initialized": false,
                    "local_folder_initialized": true
                })
            }
        }
        None => {
            // Create default state
            serde_json::json!({
                "current_folder": null,
                "selected_files": [],
                "expanded_ids": [],
                "local_expanded_ids": [],
                "folder_watch_initialized": false,
                "local_folder_initialized": true
            })
        }
    };

    // Set local_folder_initialized to true
    if let Some(obj) = app_state.as_object_mut() {
        obj.insert(
            "local_folder_initialized".to_string(),
            serde_json::json!(true),
        );
    }

    // Save the app state
    println!("Directly setting local_folder_initialized to true in store");
    store.set("app_state".to_string(), app_state);

    // Persist the changes
    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    println!("Local folders initialized and state saved");
    Ok(())
}

#[tauri::command]
pub async fn select_files_for_import(app: AppHandle) -> Result<Vec<String>, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .add_filter("GSX Profile Files", &["ini", "py"])
        .add_filter("All Files", &["*"])
        .pick_files(move |file_paths| {
            let _ = tx.send(file_paths);
        });

    let file_paths = rx.recv().map_err(|e| e.to_string())?;
    match file_paths {
        Some(paths) => Ok(paths.iter().map(|p| p.to_string()).collect()),
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
pub async fn delete_user_folder_item(item_path: String) -> Result<(), String> {
    // Prevent deletion of the root node
    if item_path == "root" {
        return Err("Cannot delete the root folder".into());
    }

    let path = PathBuf::from(&item_path);

    if !path.exists() {
        return Err("Item does not exist".into());
    }

    // Check if this is inside the user folders path to prevent deleting system files
    let user_folders_path = get_user_folders_path()?;
    if !path.starts_with(&user_folders_path) {
        return Err("Cannot delete files outside of user folders directory".into());
    }

    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn copy_file_to_user_folder(
    source_file_path: String,
    target_folder_id: String,
) -> Result<(), String> {
    let source_path = PathBuf::from(source_file_path);

    if !source_path.exists() || !source_path.is_file() {
        return Err("Source file does not exist".to_string());
    }

    let file_name = source_path.file_name().ok_or("Invalid source file path")?;

    // Handle root folder specially
    let target_path = if target_folder_id == "root" {
        get_user_folders_path()?
    } else {
        PathBuf::from(target_folder_id)
    };

    // Create directory if it doesn't exist
    fs::create_dir_all(&target_path)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;

    // Copy the file
    let target_file_path = target_path.join(file_name);
    fs::copy(&source_path, &target_file_path).map_err(|e| format!("Failed to copy file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn sync_user_folders_with_watched() -> Result<(), String> {
    // Basic synchronization implementation
    Ok(())
}
