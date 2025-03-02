use std::fs;
use std::path::{Path, PathBuf};
use crate::modules::types::TreeDataItem;

pub fn get_user_folders_path() -> Result<PathBuf, String> {
    // Get the app data directory using dirs crate
    let app_data_dir = dirs::data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())?
        .join("gsx-profile-manager");
    
    let user_folders_path = app_data_dir.join("user_folders");
    
    // Create directory if it doesn't exist
    if !user_folders_path.exists() {
        fs::create_dir_all(&user_folders_path)
            .map_err(|e| format!("Failed to create user folders directory: {}", e))?;
    }
    
    Ok(user_folders_path)
}

pub fn read_user_folders_tree() -> Result<Vec<TreeDataItem>, String> {
    let user_folders_path = get_user_folders_path()?;
    let mut items = Vec::new();
    
    // Read all items in user folders path
    if let Ok(entries) = fs::read_dir(&user_folders_path) {
        for entry_result in entries {
            if let Ok(entry) = entry_result {
                let path = entry.path();
                let name = path.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                    
                let path_str = path.to_string_lossy().to_string();
                let is_directory = path.is_dir();
                
                if is_directory {
                    // Read directory contents recursively
                    let children = read_directory_contents(&path)?;
                    items.push(TreeDataItem::new(name, path_str, is_directory, Some(children)));
                } else {
                    // Add file directly
                    items.push(TreeDataItem::new(name, path_str, is_directory, None));
                }
            }
        }
    }
    
    Ok(items)
}

fn read_directory_contents(dir_path: &Path) -> Result<Vec<TreeDataItem>, String> {
    let mut items = Vec::new();
    
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry_result in entries {
            if let Ok(entry) = entry_result {
                let path = entry.path();
                let name = path.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                    
                let path_str = path.to_string_lossy().to_string();
                let is_directory = path.is_dir();
                
                if is_directory {
                    // Read subdirectory contents recursively
                    let children = read_directory_contents(&path)?;
                    items.push(TreeDataItem::new(name, path_str, is_directory, Some(children)));
                } else {
                    // Add file
                    items.push(TreeDataItem::new(name, path_str, is_directory, None));
                }
            }
        }
    }
    
    Ok(items)
}