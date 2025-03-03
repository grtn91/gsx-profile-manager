import { useRef, useState, useCallback, useEffect } from 'react';
import { homeDir } from '@tauri-apps/api/path';
import Database from '@tauri-apps/plugin-sql';

export function useOnce<T>(initializer: () => Promise<T>) {
  const [state, setState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const initialize = useCallback(async () => {
    // Only run once
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const result = await initializer();
      setState(result);
    } catch (err) {
      console.error('Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [initializer]);

  // Use useEffect for initialization instead of conditional execution in component body
  useEffect(() => {
    initialize();
  }, [initialize]);

  return { data: state, loading, error };
}

/**
 * Initialize the database connection and set up necessary tables
 * @returns Database instance with initialized connection
 */
export async function initDatabase() {
  try {
    // Get the user's home directory
    const home = await homeDir();

    // Construct the database path with the home directory
    const dbPath = `${home}/AppData/Roaming/com.gsx-profile-manager.app/.config/gsx-profiles.sqlite`;

    // Connect using a direct path instead of the config alias
    const db = await Database.load(`sqlite:${dbPath}`);

    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS gsx_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        continent TEXT NOT NULL,
        country TEXT NOT NULL,
        icao_code TEXT NOT NULL,
        airport_developer TEXT,
        profile_version TEXT,
        filePaths TEXT NOT NULL, -- Store file paths as JSON string
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Database initialized successfully at:", dbPath);
    return db;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}