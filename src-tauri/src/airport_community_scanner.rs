use regex::Regex;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use tauri::command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Clone)]
pub struct AirportInfo {
    pub icao: String,
    pub title: String,
    pub path: String,
    pub folder_type: String, // Added to track which folder type (Community or StreamedPackages)
    pub developer: String,
    pub fsversion: String,
    pub name: String,
}

fn find_msfs_community_folders() -> Vec<(PathBuf, String)> {
    let mut community_folders = Vec::new();

    // Check MSFS 2020 locations
    if let Some(local_app_data) = dirs_next::data_local_dir() {
        let store_path_2020 = local_app_data
            .join("Packages")
            .join("Microsoft.FlightSimulator_8wekyb3d8bbwe")
            .join("LocalCache")
            .join("Packages")
            .join("Community");

        if store_path_2020.exists() {
            community_folders.push((store_path_2020, "Community".to_string()));
        }
    }

    if let Some(app_data) = dirs_next::data_local_dir() {
        let steam_path_2020 = app_data
            .join("Microsoft Flight Simulator")
            .join("Packages")
            .join("Community");

        if steam_path_2020.exists() {
            community_folders.push((steam_path_2020, "Community".to_string()));
        }
    }

    // Check MSFS 2024 locations
    if let Some(local_app_data) = dirs_next::data_local_dir() {
        let store_path_2024 = local_app_data
            .join("Packages")
            .join("Microsoft.Limitless_8wekyb3d8bbwe")
            .join("LocalCache")
            .join("Packages")
            .join("Community");

        if store_path_2024.exists() {
            community_folders.push((store_path_2024, "Community".to_string()));
        }
    }

    // Check MSFS 2024 streamed locations
    if let Some(local_app_data) = dirs_next::data_local_dir() {
        let store_streamed_path_2024 = local_app_data
            .join("Packages")
            .join("Microsoft.Limitless_8wekyb3d8bbwe")
            .join("LocalCache")
            .join("Packages")
            .join("StreamedPackages");

        if store_streamed_path_2024.exists() {
            community_folders.push((store_streamed_path_2024, "StreamedPackages".to_string()));
        }
    }

    if let Some(app_data) = dirs_next::config_dir() {
        let steam_path_2024 = app_data
            .join("Microsoft Flight Simulator 2024")
            .join("Packages")
            .join("Community");

        if steam_path_2024.exists() {
            community_folders.push((steam_path_2024, "Community".to_string()));
        }
    }

    community_folders
}

#[command]
pub fn scan_for_airport_scenery() -> Result<Vec<AirportInfo>, String> {
    // We only need the regex to extract ICAO codes after "-airport-"
    let airport_icao_regex =
        Regex::new(r"(?i)-airport-([A-Z0-9]{4})-").map_err(|e| e.to_string())?;

    let mut airports = Vec::new();

    // Track seen ICAOs per folder and folder type to ensure we only show each ICAO
    // once per Community folder and once per StreamedPackages folder
    let mut seen_airports: HashMap<String, HashSet<String>> = HashMap::new();

    let community_folders = find_msfs_community_folders();
    if community_folders.is_empty() {
        return Err("No MSFS Community folders found".to_string());
    }

    println!(
        "Found {} community folders to scan",
        community_folders.len()
    );
    for (folder, folder_type) in &community_folders {
        println!("Found folder: {} ({})", folder.display(), folder_type);
    }

    for (folder, folder_type) in community_folders {
        // Create a new set for tracking seen ICAOs in this specific folder
        let folder_seen_icaos = seen_airports
            .entry(folder_type.clone())
            .or_insert_with(HashSet::new);

        println!("Scanning folder: {} ({})", folder.display(), folder_type);

        // Walk through the directory with limited depth
        for entry in WalkDir::new(&folder)
            .follow_links(true)
            .max_depth(3)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Skip if not a directory
            if !path.is_dir() {
                continue;
            }

            let folder_name = match path.file_name().and_then(|n| n.to_str()) {
                Some(name) => name.to_uppercase(), // Convert to uppercase for case-insensitive matching
                None => continue,
            };

            // Check if folder name contains "-airport-" and extract ICAO directly after it
            if let Some(cap) = airport_icao_regex.captures(&folder_name) {
                if let Some(icao_match) = cap.get(1) {
                    let icao = icao_match.as_str();

                    // Add the airport if we haven't seen this ICAO in this folder type before
                    if folder_seen_icaos.insert(icao.to_string()) {
                        let original_folder_name = path
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy()
                            .to_string();

                        // Extract developer and FS version based on folder type
                        let (developer, fsversion) =
                            extract_developer_and_version(&original_folder_name, &folder_type);

                        // Extract the airport name
                        let airport_name = extract_airport_name(&original_folder_name, icao);

                        // Format the title with the folder type
                        let title = format!("{} ({})", original_folder_name, folder_type);

                        airports.push(AirportInfo {
                            icao: icao.to_string(),
                            title,
                            path: path.to_string_lossy().to_string(),
                            folder_type: folder_type.clone(),
                            developer,
                            fsversion: fsversion.clone(),
                            name: airport_name.clone(),
                        });

                        println!(
                            "Found airport: {} ({}) in folder {} ({}) version {}",
                            icao, airport_name, folder_name, folder_type, fsversion
                        );
                    }
                }
            }
        }
    }

    println!("Found {} airports in total", airports.len());
    Ok(airports)
}

/// Extract the developer and flight simulator version from the folder name
/// For streamed packages: First part is FS version (fs24-xxx, fs20-xxx), second part is developer
/// For community packages: First part is always the developer, no FS version specified
fn extract_developer_and_version(folder_name: &str, folder_type: &str) -> (String, String) {
    // Split the folder name by hyphens
    let parts: Vec<&str> = folder_name.split('-').collect();

    if parts.is_empty() {
        return ("Unknown".to_string(), "".to_string());
    }

    if folder_type == "StreamedPackages" {
        // For streamed packages, first part is FS version, second part is developer
        if parts.len() >= 2 {
            let fs_version = parts[0].to_lowercase();
            let developer = parts[1].to_string();

            // Check if the first part is fs version pattern (fs24-xxx, fs20-xxx)
            if fs_version.starts_with("fs") {
                return (developer, fs_version);
            }
        }
        // If we couldn't parse properly, return what we have
        if !parts.is_empty() {
            return (parts[0].to_string(), "".to_string());
        }
    } else {
        // For community packages, first part is the developer
        if !parts.is_empty() {
            return (parts[0].to_string(), "".to_string());
        }
    }

    ("Unknown".to_string(), "".to_string())
}

/// Extract the airport name from the folder name
/// Example: "FS20-AEROSOFT-AIRPORT-EDDB-BERLIN-BRANDENBURG" -> "Berlin-Brandenburg"
fn extract_airport_name(folder_name: &str, icao: &str) -> String {
    // Create a regex pattern to match everything after the ICAO code
    let pattern = format!(r"(?i)-airport-{}-(.+?)(?:$|-\d)", icao);
    let name_regex = Regex::new(&pattern).unwrap_or_else(|_| Regex::new(r"^$").unwrap());

    if let Some(cap) = name_regex.captures(folder_name) {
        if let Some(name_match) = cap.get(1) {
            // Extract the name part and properly format it
            let raw_name = name_match.as_str();
            return raw_name
                .split('-')
                .map(|word| {
                    // Capitalize first letter, lowercase the rest
                    let mut chars = word.chars();
                    match chars.next() {
                        None => String::new(),
                        Some(first) => {
                            first.to_uppercase().collect::<String>()
                                + &chars.collect::<String>().to_lowercase()
                        }
                    }
                })
                .collect::<Vec<String>>()
                .join("-");
        }
    }

    "Unknown".to_string()
}
