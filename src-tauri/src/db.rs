use dirs_next as dirs;
use std::fs;
use std::path::Path;

// Check if a database file exists, and create one if it does not.
pub fn init() {
    if !db_file_exists() {
        create_db_file();
    }
}
// Create the database file.
fn create_db_file() {
    let db_path = get_db_path();
    let db_dir = Path::new(&db_path).parent().unwrap();

    // If the parent directory does not exist, create it.
    if !db_dir.exists() {
        fs::create_dir_all(db_dir).unwrap();
    }

    // Create the database file.
    fs::File::create(db_path).unwrap();
}

// Check whether the database file exists.
fn db_file_exists() -> bool {
    let db_path = get_db_path();
    Path::new(&db_path).exists()
}

fn get_db_path() -> String {
    let home_dir = dirs::home_dir().unwrap();
    let db_path = format!(
        "{}/AppData/Roaming/com.gsx-profile-manager.app/.config/gsx-profiles.sqlite",
        home_dir.to_str().unwrap()
    );

    println!("Database path: {}", db_path); // Debugging output

    db_path
}
