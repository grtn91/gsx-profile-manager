use tauri::AppHandle;
use serde_json::json;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn save_app_state(
    app: AppHandle,
    current_folder: Option<String>,
    selected_files: Vec<String>,
    expanded_ids: Vec<String>,
    local_expanded_ids: Vec<String>
) -> Result<(), String> {
    
    let store = app
        .store("app-settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;

    if let Some(path) = current_folder {
        if !path.is_empty() {
            store.set("current_folder".to_string(), json!(path));
        }
        // Don't delete if empty - keep previous value
    }
    // Don't delete if null - keep previous value

    store.set("selected_files".to_string(), json!(selected_files));
    store.set("expanded_ids".to_string(), json!(expanded_ids));
    store.set("local_expanded_ids".to_string(), json!(local_expanded_ids));

    store.save()
        .map_err(|e| format!("Failed to persist settings: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn load_app_state(app: AppHandle) -> Result<serde_json::Value, String> {
    let store = app
        .store("app-settings.json")
        .map_err(|e| format!("Failed to get store: {}", e))?;
    
    let current_folder = store.get("current_folder").map(|v| v.clone());
    
    let selected_files = match store.get("selected_files") {
        Some(value) => value.clone(),
        None => json!([])
    };
    
    let expanded_ids = match store.get("expanded_ids") {
        Some(value) => value.clone(),
        None => json!([])
    };
    
    let local_expanded_ids = match store.get("local_expanded_ids") {
        Some(value) => value.clone(),
        None => json!([])
    };
    
    Ok(json!({
        "currentFolder": current_folder.unwrap_or(json!(null)),
        "selectedFiles": selected_files,
        "expandedIds": expanded_ids,
        "localExpandedIds": local_expanded_ids
    }))
}