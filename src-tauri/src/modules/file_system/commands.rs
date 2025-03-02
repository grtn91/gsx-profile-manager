use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::modules::types::TreeDataItem;
use super::helpers::{read_relevant_folders, safely_check_path, contains_gsx_profile};

#[tauri::command]
pub fn read_folder_contents(folder_path: String) -> Result<Vec<TreeDataItem>, String> {
    let path = PathBuf::from(&folder_path);
    
    // Check if path exists
    if !path.exists() {
        return Err(format!("Folder not found: {}", folder_path));
    }
    
    // Check if it's a directory
    if !path.is_dir() {
        return Err(format!("Not a directory: {}", folder_path));
    }
    
    // Check for special path handling
    if let Err(e) = safely_check_path(&path) {
        return Err(e);
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
                            let path_str = path.to_string_lossy().to_string();
                            let is_directory = true; // This is always a directory here
                            
                            // Get child directories that contain GSX Profile folders
                            match read_relevant_folders(&path) {
                                Ok(children_result) => {
                                    // Only include this directory if it contains GSX Profile or has valid children
                                    if !children_result.is_empty() || contains_gsx_profile(&path) {
                                        items.push(TreeDataItem::new(name, path_str, is_directory, Some(children_result)));
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

#[tauri::command]
pub async fn select_folder(app: AppHandle) -> Result<String, String> {
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
pub fn check_folder_exists(folder_path: String) -> bool {
    let path = PathBuf::from(folder_path);
    path.exists() && path.is_dir()
}