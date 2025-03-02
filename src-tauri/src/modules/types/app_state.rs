use serde::{Deserialize, Serialize};

// Make sure the fields match exactly what you're using in JavaScript
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AppState {
    pub current_folder: Option<String>,
    pub selected_files: Vec<String>,
    pub expanded_ids: Vec<String>,
    pub local_expanded_ids: Vec<String>,

    // Ensure these match the exact field names you're sending from the frontend
    #[serde(default)]
    pub folder_watch_initialized: bool,

    #[serde(default)]
    pub local_folder_initialized: bool,
}
