use crate::AppState;
use rand::Rng;
use std::fs::{self, create_dir_all, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{command, Manager, State}; // Import the Manager trait

#[derive(serde::Deserialize)]
pub struct ProfileData {
    continent: String,
    country: String,
    icao_code: String,
    airport_developer: Option<String>,
    profile_version: Option<String>,
    file_name: String,
    file_content: String, // Base64 encoded file content
}

#[command]
pub fn store_profile(
    profile: ProfileData,
    state: State<'_, AppState>,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // Get the app data directory
    let app_data_dir: PathBuf = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    // Create the base profile directory
    let profiles_dir = app_data_dir.join("gsx-profiles");

    // Create the path structure: continent/country/icao/developer/version
    let mut path = profiles_dir.clone();
    path.push(&profile.continent);
    path.push(&profile.country);
    path.push(&profile.icao_code);

    if let Some(dev) = &profile.airport_developer {
        path.push(dev);
    } else {
        path.push("unknown");
    }

    if let Some(ver) = &profile.profile_version {
        path.push(ver);
    } else {
        path.push("1.0");
    }

    // Create all directories in the path
    create_dir_all(&path).map_err(|e| format!("Failed to create directory structure: {}", e))?;

    // Decode the base64 file content
    let file_content = base64::decode(&profile.file_content)
        .map_err(|e| format!("Failed to decode file content: {}", e))?;

    // Write the file to the destination
    let file_path = path.join(&profile.file_name);
    let mut file = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;

    file.write_all(&file_content)
        .map_err(|e| format!("Failed to write file content: {}", e))?;

    // Generate a random ID (hash)
    let id = generate_random_id();

    // Store the profile metadata in the database
    state
        .db
        .insert_profile(
            &id,
            &profile.continent,
            &profile.country,
            &profile.icao_code,
            profile.airport_developer.as_deref(),
            profile.profile_version.as_deref(),
            file_path.to_str().unwrap_or_default(),
        )
        .map_err(|e| format!("Failed to insert profile into database: {}", e))?;

    Ok(())
}

fn generate_random_id() -> String {
    let mut rng = rand::thread_rng();
    let random_number: u64 = rng.gen();
    format!("{:016x}", random_number)
}
