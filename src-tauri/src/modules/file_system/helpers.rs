use std::fs;
use std::path::PathBuf;
use crate::modules::types::TreeDataItem;

// Helper function to check if a directory contains a "GSX Profile" folder
pub fn contains_gsx_profile(dir_path: &PathBuf) -> bool {
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

// Helper function to read only relevant folders
pub fn read_relevant_folders(dir_path: &PathBuf) -> Result<Vec<TreeDataItem>, String> {
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
pub fn read_gsx_profile_contents(dir_path: &PathBuf) -> Result<Vec<TreeDataItem>, String> {
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

/* // Helper function to determine if a file is relevant for GSX profiles
pub fn is_relevant_file(path: &PathBuf) -> bool {
    // Check if file is within a "GSX Profile" directory
    let parent_is_gsx = path.parent()
        .and_then(|p| p.file_name())
        .map_or(false, |name| name == "GSX Profile");
    
    // Check if file has a relevant extension
    let has_relevant_extension = path.extension()
        .map_or(false, |ext| ext == "xml" || ext == "prf");
    
    parent_is_gsx || has_relevant_extension
} */

// Special handling for paths with potential permission issues
pub fn safely_check_path(path: &PathBuf) -> Result<(), String> {
    // Special handling for MSFS paths
    if path.to_string_lossy().contains("Microsoft.Limitless_8wekyb3d8bbwe") {
        // First try to check permissions
        match fs::read_dir(path) {
            Ok(_) => Ok(()), // Directory is readable
            Err(e) => {
                if e.kind() == std::io::ErrorKind::PermissionDenied {
                    Err("Cannot access the Microsoft Flight Simulator folder due to permission restrictions. Try running the app as administrator.".to_string())
                } else {
                    Err(format!("Error accessing path: {}", e))
                }
            }
        }
    } else {
        Ok(())
    }
}