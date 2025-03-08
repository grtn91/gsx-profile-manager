use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::io::Read;
use tauri::command;
use zip::read::ZipArchive;

#[derive(Serialize, Deserialize)]
pub struct ExtractedFile {
    name: String,
    content: Vec<u8>,
}

#[command]
pub fn extract_zip_file(zip_content: Vec<u8>) -> Result<Vec<ExtractedFile>, String> {
    let cursor = Cursor::new(zip_content);

    // Open the ZIP archive from the provided bytes
    let mut archive = match ZipArchive::new(cursor) {
        Ok(archive) => archive,
        Err(e) => return Err(format!("Failed to open ZIP: {}", e)),
    };

    let mut extracted_files = Vec::new();

    // Extract each file from the ZIP
    for i in 0..archive.len() {
        let mut file = match archive.by_index(i) {
            Ok(file) => file,
            Err(e) => return Err(format!("Failed to read file from ZIP: {}", e)),
        };

        // Skip directories
        if file.is_dir() {
            continue;
        }

        // Get the file name
        let name = match file.name().to_string() {
            n if n.contains('/') => n.split('/').last().unwrap_or("unknown").to_string(),
            n => n,
        };

        // Check if the file has .ini or .py extension
        let lowercase_name = name.to_lowercase();
        if !lowercase_name.ends_with(".ini") && !lowercase_name.ends_with(".py") {
            continue; // Skip files that don't have the required extensions
        }

        // Read file content
        let mut content = Vec::new();
        if let Err(e) = file.read_to_end(&mut content) {
            return Err(format!("Failed to read file content: {}", e));
        }

        // Add file to result
        extracted_files.push(ExtractedFile { name, content });
    }

    if extracted_files.is_empty() {
        return Err("No .ini or .py files found in the ZIP archive".to_string());
    }

    Ok(extracted_files)
}
