use std::fs;
use std::path::PathBuf;
use std::env;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use super::helpers::{create_profile_backup, remove_existing_symlinks, create_profile_symlinks};

#[tauri::command]
pub async fn activate_profiles(app: AppHandle, selected_files: Vec<String>) -> Result<String, String> {
    // Get current user's profile directory
    let user_profile = env::var("USERPROFILE")
        .map_err(|_| "Failed to get user profile directory".to_string())?;
    
    // Create target directory if it doesn't exist
    let target_dir = format!("{}\\AppData\\Roaming\\Virtuali\\GSX\\MSFS", user_profile);
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;
    
    // Check if any files will be overwritten
    for file_path in &selected_files {
        let source_path = PathBuf::from(file_path);
        
        if !source_path.exists() {
            return Err(format!("Source file does not exist: {}", file_path));
        }
    }
    
    // Check if target directory has any files
    let has_existing_files = fs::read_dir(&target_dir)
        .map_err(|e| format!("Failed to read target directory: {}", e))?
        .filter_map(|entry| entry.ok())
        .any(|entry| entry.path().is_file() || entry.path().is_symlink());
    
    // If there are existing files, show confirmation dialog
    if has_existing_files {
        let (tx, rx) = std::sync::mpsc::channel();
        
        // Ask user for confirmation
        app.dialog()
            .message("This will replace existing GSX profiles. Would you like to proceed?")
            .title("Warning")
            .kind(MessageDialogKind::Warning)
            .buttons(MessageDialogButtons::OkCancel)
            .show(move |index| {
                let _ = tx.send(index);
            });
        
            let response = rx.recv().map_err(|_| "Dialog interaction failed".to_string())?;
            if !response { // For OkCancel, false means Cancel was clicked
                // User clicked Cancel
                return Ok("Operation cancelled by user.".to_string());
            }
        
        // Ask if user wants to create backup
        let (backup_tx, backup_rx) = std::sync::mpsc::channel();
        
        app.dialog()
            .message("Would you like to create a backup of your current profiles?")
            .title("Backup")
            .buttons(MessageDialogButtons::YesNo)
            .show(move |index| {
                let _ = backup_tx.send(index);
            });
        
        // Wait for user response on backup
        let backup_response = backup_rx.recv().map_err(|_| "Dialog interaction failed".to_string())?;
        if backup_response {
            create_profile_backup(&user_profile, &target_dir)?;
        }
    }
    
    // Now proceed with symlink removal and creation
    remove_existing_symlinks(&target_dir)?;
    let activated_count = create_profile_symlinks(selected_files, &target_dir)?;
    
    Ok(format!("Successfully activated {} profiles", activated_count))
}