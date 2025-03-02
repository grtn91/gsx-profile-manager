use rusqlite::{params, Connection, Result as SqlResult};
use std::fs;
use std::path::Path;
use std::sync::Mutex;

pub struct ProfileDatabase {
    conn: Mutex<Connection>,
}

impl ProfileDatabase {
    pub fn new(app_data_dir: &Path) -> SqlResult<Self> {
        fs::create_dir_all(app_data_dir);

        let db_path = app_data_dir.join("profiles.db");
        let conn = Connection::open(db_path)?;

        // Create the profiles table if it doesn't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                continent TEXT NOT NULL,
                country TEXT NOT NULL,
                icao TEXT NOT NULL,
                developer TEXT,
                version TEXT,
                file_path TEXT NOT NULL
            )",
            [],
        )?;

        Ok(ProfileDatabase {
            conn: Mutex::new(conn),
        })
    }

    pub fn insert_profile(
        &self,
        id: &str,
        continent: &str,
        country: &str,
        icao: &str,
        developer: Option<&str>,
        version: Option<&str>,
        file_path: &str,
    ) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap(); // Acquire the lock
        conn.execute(
            "INSERT INTO profiles (id, continent, country, icao, developer, version, file_path)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, continent, country, icao, developer, version, file_path],
        )?;

        Ok(())
    }
}

impl std::fmt::Debug for ProfileDatabase {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("ProfileDatabase").finish()
    }
}
