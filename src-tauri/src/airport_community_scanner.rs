use regex::Regex;
use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;
use std::fs;
use std::path::PathBuf;
use tauri::command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Clone)]
pub struct AirportInfo {
    pub icao: String,
    pub title: String,
    pub path: String,
}

fn find_msfs_community_folders() -> Vec<PathBuf> {
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
            community_folders.push(store_path_2020);
        }
    }

    if let Some(app_data) = dirs_next::data_local_dir() {
        let steam_path_2020 = app_data
            .join("Microsoft Flight Simulator")
            .join("Packages")
            .join("Community");

        if steam_path_2020.exists() {
            community_folders.push(steam_path_2020);
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
            community_folders.push(store_path_2024);
        }
    }

    if let Some(app_data) = dirs_next::config_dir() {
        let steam_path_2024 = app_data
            .join("Microsoft Flight Simulator 2024")
            .join("Packages")
            .join("Community");

        if steam_path_2024.exists() {
            community_folders.push(steam_path_2024);
        }
    }

    community_folders
}

#[command]
pub fn scan_for_airport_scenery() -> Result<Vec<AirportInfo>, String> {
    // Regex for ICAO airport codes - must be exactly 4 characters, starting with a letter
    let icao_regex = Regex::new(r"\b([A-Z][A-Z0-9]{3})\b").map_err(|e| e.to_string())?;

    let mut airports = Vec::new();
    let mut seen_icaos = HashSet::new();

    let community_folders = find_msfs_community_folders();
    if community_folders.is_empty() {
        return Err("No MSFS Community folders found".to_string());
    }

    // Define common words to filter out from ICAO matches
    let common_words = [
        "ORBX", "THAT", "ONLY", "WITH", "PAYA", "FREE", "BASE", "GATE", "SIMX", "FLYX", "LAND",
        "PORT", "JETS", "RUNX", "WAYX", "TERM", "PARK", "LOAD", "TAXI", "LIFT", "NAVX", "VORX",
        "ILSS", "DEPT", "ARRV", "CTRL", "ATCX", "WXRT", "METX", "CITY", "BETA", "MSFS", "PACK",
        "GATE", "JEPP", "FSDG", "FSDT",
    ];

    for folder in community_folders {
        for entry in WalkDir::new(&folder)
            .follow_links(true)
            .max_depth(3) // Limit depth to avoid excessive scanning
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Skip if not a manifest.json file
            if !path
                .file_name()
                .map_or(false, |name| name == "manifest.json")
            {
                continue;
            }

            let content = match fs::read_to_string(path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            let json: Value = match serde_json::from_str(&content) {
                Ok(j) => j,
                Err(_) => continue,
            };

            // Only process if content_type is SCENERY
            if let Some(content_type) = json.get("content_type").and_then(|ct| ct.as_str()) {
                if content_type != "SCENERY" {
                    continue;
                }

                // Get the parent folder name to use as primary title
                let folder_title = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                // Also get the package title as fallback
                let package_title = json
                    .get("title")
                    .and_then(|t| t.as_str())
                    .unwrap_or(&folder_title);

                // Try to extract ICAO from folder name first (higher priority)
                let mut found_icao = false;
                for cap in icao_regex.captures_iter(&folder_title.to_uppercase()) {
                    let icao = cap.get(1).unwrap().as_str();

                    // Skip common words that match the pattern
                    if common_words.contains(&icao) {
                        continue;
                    }

                    // Avoid duplicates
                    if seen_icaos.insert(icao.to_string()) {
                        airports.push(AirportInfo {
                            icao: icao.to_string(),
                            title: folder_title.clone(),
                            path: path.parent().unwrap_or(path).to_string_lossy().to_string(),
                        });
                        found_icao = true;
                        break;
                    }
                }

                // If we didn't find an ICAO in the folder name, try the package title
                if !found_icao {
                    for cap in icao_regex.captures_iter(&package_title.to_uppercase()) {
                        let icao = cap.get(1).unwrap().as_str();

                        if common_words.contains(&icao) {
                            continue;
                        }

                        if seen_icaos.insert(icao.to_string()) {
                            airports.push(AirportInfo {
                                icao: icao.to_string(),
                                title: folder_title,
                                path: path.parent().unwrap_or(path).to_string_lossy().to_string(),
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    Ok(airports)
}
