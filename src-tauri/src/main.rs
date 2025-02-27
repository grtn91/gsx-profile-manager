#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use std::fs;
use std::path::PathBuf;
use std::os::windows::fs as windows_fs;
use std::env;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_store::{StoreExt, Builder};
use serde_json::json;


// Helper function to check if a directory contains a "GSX Profile" folder
fn contains_gsx_profile(dir_path: &PathBuf) -> bool {
    // Check if this directory is named "GSX Profile"
    if dir_path.file_name().map_or(false, |name| name == "GSX Profile") {
        return true;
    }

    // Check subdirectories
    if dir_path.is_dir() {
        match fs::read_dir(dir_path) {
            Ok(entries) => {
                for entry_result in entries {
                    if let Ok(entry) = entry_result {
                        let path = entry.path();
                        if path.is_dir() && contains_gsx_profile(&path) {
                            return true;
                        }
                    }
                }
            }
            Err(_) => return false,
        }
    }
    
    false
}

#[tauri::command]
fn activate_profiles(selected_files: Vec<String>) -> Result<String, String> {
    // Get current user's profile directory
    let user_profile = env::var("USERPROFILE")
        .map_err(|_| "Failed to get user profile directory".to_string())?;
    
    // Create target directory if it doesn't exist
    let target_dir = format!("{}\\AppData\\Roaming\\Virtuali\\GSX\\MSFS", user_profile);
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;
    
    // Clear existing files in the target directory
    for entry in fs::read_dir(&target_dir).map_err(|e| format!("Failed to read target directory: {}", e))? {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to remove file {}: {}", path.display(), e))?;
            } else if path.is_symlink() {
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to remove symlink {}: {}", path.display(), e))?;
            }
        }
    }
    
    // Create symlinks for selected files
    let mut activated_count = 0;
    for file_path in selected_files {
        let source_path = PathBuf::from(&file_path);
        
        if !source_path.exists() {
            return Err(format!("Source file does not exist: {}", file_path));
        }
        
        let file_name = source_path.file_name()
            .ok_or_else(|| "Invalid file path".to_string())?
            .to_string_lossy()
            .to_string();
        
        let target_path = format!("{}\\{}", target_dir, file_name);
        
        // Create symbolic link
        windows_fs::symlink_file(&source_path, &target_path)
            .map_err(|e| format!("Failed to create symlink: {}", e))?;
        
        activated_count += 1;
    }
    
    Ok(format!("Successfully activated {} profiles", activated_count))
}

#[tauri::command]
fn read_folder_contents(folder_path: String) -> Result<Vec<TreeDataItem>, String> {
    let path = PathBuf::from(&folder_path);
    if !path.exists() {
        return Err("Folder does not exist".into());
    }

    let mut items = Vec::new();
    match fs::read_dir(&path) {
        Ok(entries) => {
            for entry_result in entries {
                match entry_result {
                    Ok(entry) => {
                        let path = entry.path();
                        if path.is_dir() {
                            // Only process directories
                            let name = path.file_name().unwrap().to_string_lossy().to_string();
                            let id = name.clone();
                            
                            // Get child directories that contain GSX Profile folders
                            match read_relevant_folders(&path) {
                                Ok(children_result) => {
                                    // Only include this directory if it contains GSX Profile or has valid children
                                    if !children_result.is_empty() || contains_gsx_profile(&path) {
                                        items.push(TreeDataItem {
                                            id,
                                            name,
                                            children: Some(children_result),
                                        });
                                    }
                                },
                                Err(e) if e.contains("Access is denied") || e.contains("Permission denied") => {
                                    // Skip directories we can't access
                                    continue;
                                },
                                Err(e) => return Err(e),
                            }
                        }
                    },
                    Err(_e) => {
                        // Skip entries we can't read
                        continue;
                    }
                }
            }
            Ok(items)
        },
        Err(e) => {
            if e.kind() == std::io::ErrorKind::PermissionDenied {
                Err("Access denied: You don't have permission to read this folder".into())
            } else {
                Err(format!("Error reading folder: {}", e))
            }
        }
    }
}

// Helper function to read only relevant folders
fn read_relevant_folders(dir_path: &PathBuf) -> Result<Vec<TreeDataItem>, String> {
    let mut items = Vec::new();
    
    for entry in fs::read_dir(dir_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_dir() {
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            let id = name.clone();
            
            if name == "GSX Profile" {
                // Found a GSX Profile folder, read and include its contents
                let gsx_files = read_gsx_profile_contents(&path)?;
                items.push(TreeDataItem {
                    id,
                    name,
                    children: Some(gsx_files), // Add the files inside GSX Profile folder
                });
            } else {
                // Check if this directory contains GSX Profile folders
                let children_result = read_relevant_folders(&path)?;
                
                if !children_result.is_empty() {
                    // Only add directories that contain GSX Profile folders
                    items.push(TreeDataItem {
                        id,
                        name,
                        children: Some(children_result),
                    });
                }
            }
        }
    }
    
    Ok(items)
}

// Helper function to read files inside GSX Profile folders
fn read_gsx_profile_contents(dir_path: &PathBuf) -> Result<Vec<TreeDataItem>, String> {
    let mut items = Vec::new();
    
    for entry in fs::read_dir(dir_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        
        if path.is_file() {
            // Include the file in the tree
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            let id = format!("{}/{}", dir_path.to_string_lossy(), name); // Use full path as ID for uniqueness
            
            items.push(TreeDataItem {
                id,
                name,
                children: None, // Files don't have children
            });
        } else if path.is_dir() {
            // If there are subdirectories in GSX Profile, recursively include them
            let name = path.file_name().unwrap().to_string_lossy().to_string();
            let id = format!("{}/{}", dir_path.to_string_lossy(), name);
            let children = read_gsx_profile_contents(&path)?;
            
            if !children.is_empty() {
                items.push(TreeDataItem {
                    id,
                    name,
                    children: Some(children),
                });
            }
        }
    }
    
    Ok(items)
}

#[derive(serde::Serialize)]
struct TreeDataItem {
    id: String,
    name: String,
    children: Option<Vec<TreeDataItem>>,
}

#[tauri::command]
async fn select_folder(app: AppHandle) -> Result<String, String> {
    let (tx, rx) = std::sync::mpsc::channel();
    
    app.dialog().file().pick_folder(move |folder_path| {
        let _ = tx.send(folder_path);
    });
    
    let folder_path = rx.recv().map_err(|e| e.to_string())?;
    match folder_path {
        Some(path) => Ok(path.to_string()),
        None => Err("No folder selected".into()),
    }
}

#[tauri::command]
async fn save_app_state(app: AppHandle, current_folder: Option<String>, selected_files: Vec<String>, expanded_ids: Vec<String>) -> Result<(), String> {
    let store = app
        .store("app-settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;

    if let Some(folder) = current_folder {
        store.set("current_folder".to_string(), json!(folder));
    } else {
        // Remove the entry completely if null is passed
        store.delete("current_folder".to_string());
    }

    store.set("selected_files".to_string(), json!(selected_files));
    
    store.set("expanded_ids".to_string(), json!(expanded_ids));

    store.save()
        .map_err(|e| format!("Failed to persist settings: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn load_app_state(app: AppHandle) -> Result<(Option<String>, Vec<String>, Vec<String>), String> {
    let store = app
        .store("app-settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;
    
    let current_folder = match store.get("current_folder") {
        Some(value) => {
            serde_json::from_value::<String>(value.clone())
                .map(Some)
                .map_err(|e| format!("Failed to parse current folder: {}", e))?
        },
        None => None
    };
    
    let selected_files = match store.get("selected_files") {
        Some(value) => {
            serde_json::from_value::<Vec<String>>(value.clone())
                .map_err(|e| format!("Failed to parse selected files: {}", e))?
        },
        None => Vec::new()
    };
    
    let expanded_ids = match store.get("expanded_ids") {
        Some(value) => {
            serde_json::from_value::<Vec<String>>(value.clone())
                .map_err(|e| format!("Failed to parse expanded ids: {}", e))?
        },
        None => Vec::new()
    };
    
    Ok((current_folder, selected_files, expanded_ids))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            read_folder_contents, 
            select_folder, 
            activate_profiles,
            save_app_state,
            load_app_state
            ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}