#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use std::process::Command;
use tauri::AppHandle;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[tauri::command]
pub async fn is_admin() -> bool {
    #[cfg(target_os = "windows")]
    {
        // On Windows, we can check by trying to access the admin-only directory
        use std::fs::OpenOptions;
        let can_write_windows_dir = OpenOptions::new()
            .write(true)
            .open("C:\\Windows\\System32\\drivers\\etc\\hosts")
            .is_ok();
        return can_write_windows_dir;
    }

    #[cfg(not(target_os = "windows"))]
    {
        // On non-Windows platforms, return true as we don't need admin for symlinks
        true
    }
}

#[tauri::command]
pub fn restart_as_admin(app_handle: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Get the current executable path
        let current_exe = std::env::current_exe()
            .map_err(|e| format!("Failed to get current executable path: {}", e))?;

        // Convert to a string with proper escaping for cmd
        let exe_path = current_exe.to_string_lossy().replace("\\", "\\\\");

        // Create a temporary VBS script to elevate privileges
        let temp_dir = std::env::temp_dir();
        let script_path = temp_dir.join("elevate.vbs");

        // Write the VBS script content
        let script_content = format!(
            r#"
            Set UAC = CreateObject("Shell.Application")
            UAC.ShellExecute "{}", "", "", "runas", 1
            "#,
            exe_path
        );

        std::fs::write(&script_path, script_content)
            .map_err(|e| format!("Failed to create elevation script: {}", e))?;

        // Execute the VBS script
        Command::new("wscript.exe")
            .arg(script_path.to_string_lossy().to_string())
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|e| format!("Failed to execute elevation script: {}", e))?;

        // Exit the current instance after a short delay
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(1000));
            app_handle.exit(0);
        });

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Admin restart is only supported on Windows".to_string())
    }
}
