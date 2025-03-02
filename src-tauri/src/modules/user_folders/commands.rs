use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::modules::types::TreeDataItem;
use super::helpers::{get_user_folders_path, read_user_folders_tree};

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
    target_folder_id: String
) -> Result<(), String> {
    let source_path = PathBuf::from(source_file_path);
    
    if !source_path.exists() || !source_path.is_file() {
        return Err("Source file does not exist".to_string());
    }
    
    let file_name = source_path.file_name()
        .ok_or("Invalid source file path")?;
    
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
    fs::copy(&source_path, &target_file_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
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
        fs::remove_dir_all(&path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn copy_file_to_user_folder(
    source_file_path: String, 
    target_folder_id: String
) -> Result<(), String> {
    let source_path = PathBuf::from(source_file_path);
    
    if !source_path.exists() || !source_path.is_file() {
        return Err("Source file does not exist".to_string());
    }
    
    let file_name = source_path.file_name()
        .ok_or("Invalid source file path")?;
    
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
    fs::copy(&source_path, &target_file_path)
        .map_err(|e| format!("Failed to copy file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn sync_user_folders_with_watched() -> Result<(), String> {
    // Basic synchronization implementation
    Ok(())
}