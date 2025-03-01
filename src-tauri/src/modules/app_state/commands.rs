use tauri::AppHandle;
use tauri_plugin_store::StoreExt;
use serde_json::json;

#[tauri::command]
pub async fn save_app_state(app: AppHandle, current_folder: Option<String>, selected_files: Vec<String>, expanded_ids: Vec<String>) -> Result<(), String> {
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
pub async fn load_app_state(app: AppHandle) -> Result<(Option<String>, Vec<String>, Vec<String>), String> {
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