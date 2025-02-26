use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
fn read_folder_contents(folder_path: String) -> Result<Vec<TreeDataItem>, String> {
    let path = PathBuf::from(&folder_path);
    if !path.exists() {
        return Err("Folder does not exist".into());
    }

    let mut items = Vec::new();
    for entry in fs::read_dir(&path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = path.file_name().unwrap().to_string_lossy().to_string();
        let id = name.clone();

        let item = if path.is_dir() {
            TreeDataItem {
                id,
                name,
                children: Some(read_folder_contents(path.to_string_lossy().to_string())?),
            }
        } else {
            TreeDataItem {
                id,
                name,
                children: None,
            }
        };

        items.push(item);
    }

    Ok(items)
}

#[derive(serde::Serialize)]
struct TreeDataItem {
    id: String,
    name: String,
    children: Option<Vec<TreeDataItem>>,
}

#[tauri::command]
async fn select_folder(app: AppHandle) -> Result<String, String> {
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

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_folder_contents, select_folder])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}