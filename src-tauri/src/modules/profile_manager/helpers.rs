use std::fs;
use std::path::PathBuf;
use std::os::windows::fs as windows_fs;

pub fn create_profile_backup(user_profile: &str, target_dir: &str) -> Result<(), String> {
    // User wants backup - create backup folder
    let datetime = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let backup_dir = format!("{}\\AppData\\Roaming\\Virtuali\\GSX\\MSFS\\_backup_profiles_{}", user_profile, datetime);
    
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;
    
    // Copy all files from target directory to backup directory
    for entry in fs::read_dir(target_dir)
        .map_err(|e| format!("Failed to read target directory: {}", e))? {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() || path.is_symlink() {
                let file_name = path.file_name()
                    .ok_or_else(|| "Invalid file path".to_string())?;
                let backup_path = format!("{}\\{}", backup_dir, file_name.to_string_lossy());
                
                // For symlinks, copy the actual file content
                let file_content = fs::read(&path)
                    .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;
                fs::write(&backup_path, file_content)
                    .map_err(|e| format!("Failed to write backup file {}: {}", backup_path, e))?;
            }
        }
    }
    
    Ok(())
}

pub fn remove_existing_symlinks(target_dir: &str) -> Result<(), String> {
    // First, remove ALL existing symlinks in the target directory
    for entry in fs::read_dir(target_dir).map_err(|e| format!("Failed to read target directory: {}", e))? {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_symlink() {
                // Remove all symlinks regardless of their name
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to remove symlink {}: {}", path.display(), e))?;
            }
        }
    }
    
    Ok(())
}

pub fn create_profile_symlinks(selected_files: Vec<String>, target_dir: &str) -> Result<usize, String> {
    // Create symlinks for selected files
    let mut activated_count = 0;
    for file_path in selected_files {
        let source_path = PathBuf::from(&file_path);
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
    
    Ok(activated_count)
}