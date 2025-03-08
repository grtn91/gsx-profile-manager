use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

// Helper functions module
pub mod helpers {
    use std::fs;
    use std::os::windows::fs as win_fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    // Creates a backup of existing profiles
    pub fn create_profile_backup(target_dir: &Path) -> Result<(), String> {
        // Get current timestamp using std library
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| format!("Failed to get system time: {}", e))?
            .as_secs();

        // Create backup directory in the same folder as target_dir
        let backup_dir = target_dir.join(format!("backup-{}", timestamp));

        // Convert to string for printing
        let backup_dir_str = backup_dir.to_string_lossy().to_string();
        println!("Creating backup directory: {}", backup_dir_str);

        fs::create_dir_all(&backup_dir)
            .map_err(|e| format!("Failed to create backup directory: {}", e))?;

        // Copy all files from target directory to backup directory
        let entries = fs::read_dir(target_dir)
            .map_err(|e| format!("Failed to read target directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            // Skip backup directories
            if path.is_dir()
                && path
                    .file_name()
                    .map_or(false, |name| name.to_string_lossy().starts_with("backup-"))
            {
                continue;
            }

            if path.is_file() && !path.is_symlink() {
                let file_name = path
                    .file_name()
                    .ok_or_else(|| format!("Failed to get file name from {:?}", path))?;
                let dest_path = backup_dir.join(file_name);

                println!("Backing up file: {:?} to {:?}", path, dest_path);

                fs::copy(&path, &dest_path)
                    .map_err(|e| format!("Failed to copy file to backup: {}", e))?;
            }
        }

        Ok(())
    }

    // Remove existing symlinks in the target directory
    pub fn remove_existing_symlinks(target_dir: &Path) -> Result<(), String> {
        let entries = fs::read_dir(target_dir)
            .map_err(|e| format!("Failed to read target directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            // Skip backup directories
            if path.is_dir()
                && path
                    .file_name()
                    .map_or(false, |name| name.to_string_lossy().starts_with("backup-"))
            {
                continue;
            }

            if path.is_file() || path.is_symlink() {
                println!("Removing file or symlink: {:?}", path);
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to remove file or symlink {:?}: {}", path, e))?;
            }
        }

        Ok(())
    }

    // Create symlinks for selected profile files
    pub fn create_profile_symlinks(
        file_paths: Vec<String>,
        target_dir: &Path,
    ) -> Result<usize, String> {
        let mut created_count = 0;

        for file_path in file_paths {
            let source_path = PathBuf::from(&file_path);

            // Skip if source doesn't exist
            if !source_path.exists() {
                println!("Warning: Source file does not exist: {}", file_path);
                continue;
            }

            let file_name = source_path
                .file_name()
                .ok_or_else(|| format!("Could not get file name from path: {}", file_path))?;

            let target_path = target_dir.join(file_name);
            println!(
                "Creating symlink from {:?} to {:?}",
                source_path, target_path
            );

            // Remove existing file at target path if it exists
            if target_path.exists() || target_path.is_symlink() {
                println!("Removing existing file at target path: {:?}", target_path);
                if target_path.is_dir() {
                    fs::remove_dir_all(&target_path)
                        .map_err(|e| format!("Failed to remove existing directory: {}", e))?;
                } else {
                    fs::remove_file(&target_path)
                        .map_err(|e| format!("Failed to remove existing file: {}", e))?;
                }
            }

            // Create symlink
            if source_path.is_dir() {
                win_fs::symlink_dir(&source_path, &target_path)
                    .map_err(|e| format!("Failed to create directory symlink: {}", e))?;
            } else {
                win_fs::symlink_file(&source_path, &target_path)
                    .map_err(|e| format!("Failed to create file symlink: {}", e))?;
            }

            created_count += 1;
        }

        Ok(created_count)
    }

    // Check if directory has actual files (not just directories or backup folders)
    pub fn has_actual_files(dir_path: &Path) -> Result<bool, String> {
        let entries =
            fs::read_dir(dir_path).map_err(|e| format!("Failed to read directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            // Skip backup directories
            if path.is_dir()
                && path
                    .file_name()
                    .map_or(false, |name| name.to_string_lossy().starts_with("backup-"))
            {
                continue;
            }

            // If it's a file or symlink, return true
            if path.is_file() && !path.is_symlink() {
                return Ok(true);
            }
        }

        // No files found
        Ok(false)
    }
}

#[tauri::command]
pub async fn activate_profiles(
    app: AppHandle,
    selected_files: Vec<String>,
) -> Result<String, String> {
    // Get the AppData\Roaming folder directly using environment variables
    let roaming_dir = env::var("APPDATA")
        .map_err(|e| format!("Failed to get APPDATA environment variable: {}", e))?;

    // Create path to C:\Users\[user]\AppData\Roaming\Virtuali\GSX\MSFS
    let target_dir = PathBuf::from(roaming_dir)
        .join("Virtuali")
        .join("GSX")
        .join("MSFS");

    // Create target directory if it doesn't exist
    fs::create_dir_all(&target_dir)
        .map_err(|e| format!("Failed to create target directory: {}", e))?;

    // Check if any files will be overwritten
    for file_path in &selected_files {
        let source_path = PathBuf::from(file_path);

        if !source_path.exists() {
            return Err(format!("Source file does not exist: {}", file_path));
        }
    }

    // Check if target directory has any actual files
    let has_existing_files = helpers::has_actual_files(&target_dir)?;

    // If there are existing files, show confirmation dialog
    if has_existing_files {
        // Create channel to receive dialog result
        let (tx, rx) = std::sync::mpsc::channel();

        // Show confirmation dialog using the DialogExt trait
        app.dialog()
            .message("This will replace existing GSX profiles. Would you like to proceed?")
            .title("Warning")
            .kind(tauri_plugin_dialog::MessageDialogKind::Warning)
            .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancel)
            .show(move |response| {
                let _ = tx.send(response);
            });

        // Wait for user response - true for OK, false for Cancel
        let response = rx
            .recv()
            .map_err(|_| "Dialog interaction failed".to_string())?;
        if !response {
            return Ok("Operation cancelled by user.".to_string());
        }

        // Only ask for backup if there are actual files to back up
        let (backup_tx, backup_rx) = std::sync::mpsc::channel();

        app.dialog()
            .message("Would you like to create a backup of your current profiles?")
            .title("Backup")
            .buttons(tauri_plugin_dialog::MessageDialogButtons::YesNo)
            .show(move |response| {
                let _ = backup_tx.send(response);
            });

        // Wait for user response - true for Yes, false for No
        let backup_response = backup_rx
            .recv()
            .map_err(|_| "Dialog interaction failed".to_string())?;
        if backup_response {
            helpers::create_profile_backup(&target_dir)?;
        }
    }

    // Now proceed with symlink removal and creation
    helpers::remove_existing_symlinks(&target_dir)?;

    let activated_file_count =
        helpers::create_profile_symlinks(selected_files.clone(), &target_dir)?;
    // Return a more accurate message that focuses on successful activation
    if activated_file_count > 0 {
        Ok(
            "GSX profiles activated successfully! Your simulator is ready to use these profiles."
                .to_string(),
        )
    } else {
        Ok("No profiles were activated. Please check your selected profiles.".to_string())
    }
}
