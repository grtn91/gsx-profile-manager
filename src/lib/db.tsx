import { appDataDir } from '@tauri-apps/api/path';
import { GSXProfile } from '@/types/gsx-profile';
import Database from '@tauri-apps/plugin-sql';
import { join } from '@tauri-apps/api/path';

let db: Database | null = null;

// Track database version to manage migrations
const CURRENT_DB_VERSION = 2; // Increment when schema changes

export async function initializeDb(): Promise<void> {
  try {
    // Get app data directory path
    const appDir = await appDataDir();
    // Join with .config/gsx_profiles.db
    const dbPath = await join(appDir, '.config', 'gsx_profiles.db');
    console.log('Database path:', dbPath);

    db = await Database.load(`sqlite:${dbPath}`);

    // Create the version tracking table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS db_version (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL
      );
    `);

    // Get current version from DB (or initialize it)
    let dbVersion = 1;
    const versionResult = await db.select<{ version: number }[]>('SELECT version FROM db_version WHERE id = 1');

    if (versionResult && versionResult.length > 0) {
      dbVersion = versionResult[0].version;
    } else {
      // First time setup - initialize version
      await db.execute('INSERT INTO db_version (id, version) VALUES (1, 1)');
    }

    console.log(`Current database version: ${dbVersion}, Latest version: ${CURRENT_DB_VERSION}`);

    // Create base table if it doesn't exist (for new installations)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        continent TEXT NOT NULL,
        country TEXT NOT NULL,
        airportIcaoCode TEXT NOT NULL,
        airportDeveloper TEXT,
        profileVersion TEXT,
        filePaths TEXT NOT NULL,
        status INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // Apply migrations as needed
    if (dbVersion < CURRENT_DB_VERSION) {
      await runMigrations(dbVersion);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Runs database migrations from the current version to the latest version
 * @param currentVersion The current database version
 */
async function runMigrations(currentVersion: number): Promise<void> {
  if (!db) return;

  console.log(`Running migrations from version ${currentVersion} to ${CURRENT_DB_VERSION}`);

  try {
    // Migration 1 to 2: Add fstoLink column
    if (currentVersion < 2) {
      console.log('Applying migration v1 to v2: Adding fstoLink column');

      // Check if the column already exists (for safety)
      const tableInfo = await db.select<{ name: string }[]>(
        "PRAGMA table_info(profiles)"
      );

      const columnExists = tableInfo.some(col => col.name === 'fstoLink');

      if (!columnExists) {
        await db.execute(`ALTER TABLE profiles ADD COLUMN fstoLink TEXT;`);
        console.log('Added fstoLink column to profiles table');
      } else {
        console.log('fstoLink column already exists, skipping');
      }
    }

    // Add more migrations here in the future
    // if (currentVersion < 3) { ... }

    // Update the database version
    await db.execute('UPDATE db_version SET version = ? WHERE id = 1', [CURRENT_DB_VERSION]);
    console.log(`Database updated to version ${CURRENT_DB_VERSION}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw new Error(`Database migration failed: ${error}`);
  }
}

export async function closeDb(): Promise<void> {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

export async function getFstoLinkById(id: string): Promise<string | null> {
  if (!db) {
    console.error('Database not initialized');
    return null;
  }
  // Query the database to get the fstoLink for the given id
  const result = await db.select<{ fstoLink: string }[]>(
    'SELECT fstoLink FROM profiles WHERE id = ?',
    [id]
  );
  if (result && result.length > 0) {
    return result[0].fstoLink;
  }
  return null;
}


// Add profile to database
export async function addProfile(profile: GSXProfile): Promise<GSXProfile> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Convert filePaths array to JSON string for storage
    const filePathsJson = JSON.stringify(profile.filePaths);

    await db.execute(
      `INSERT INTO profiles (
        id, continent, country, airportIcaoCode, airportDeveloper, 
        profileVersion, filePaths, status, createdAt, updatedAt, fstoLink
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        profile.id,
        profile.continent,
        profile.country,
        profile.airportIcaoCode,
        profile.airportDeveloper || null,
        profile.profileVersion || null,
        filePathsJson,
        profile.status ? 1 : 0,
        profile.createdAt.toISOString(),
        profile.updatedAt.toISOString(),
        profile.fstoLink || null,
      ]
    );

    return profile;
  } catch (error) {
    console.error('Failed to add profile:', error);
    throw error;
  }
}

// Add other database operations (updateProfile, deleteProfile, etc.)
export async function deleteProfile(id: string): Promise<void> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    await db.execute(
      'DELETE FROM profiles WHERE id = $1',
      [id]
    );
  } catch (error) {
    console.error('Failed to delete profile:', error);
    throw error;
  }
}

export async function updateProfileStatus(id: string, status: boolean): Promise<void> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    await db.execute(
      'UPDATE profiles SET status = $1, updatedAt = $2 WHERE id = $3',
      [status ? 1 : 0, new Date().toISOString(), id]
    );
  } catch (error) {
    console.error('Failed to update profile status:', error);
    throw error;
  }
}

// Update the getProfileById function to match the pattern
export async function getProfileById(id: string): Promise<GSXProfile | null> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    const result = await db.select<ProfileRow[]>(
      'SELECT * FROM profiles WHERE id = $1',
      [id]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const profile = result[0];

    return {
      ...profile,
      id: profile.id as `${string}-${string}-${string}-${string}-${string}`,
      filePaths: JSON.parse(profile.filePaths),
      status: Boolean(profile.status),
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
      airportDeveloper: profile.airportDeveloper || undefined,
      profileVersion: profile.profileVersion || undefined
    };
  } catch (error) {
    console.error('Failed to get profile by ID:', error);
    return null;
  }
}

export async function updateProfile(id: string, data: Partial<GSXProfile>): Promise<void> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Define interface for our query result type
    interface CountRow {
      count: number;
    }

    // First check if the profile exists
    const result = await db.select<CountRow[]>(
      'SELECT COUNT(*) as count FROM profiles WHERE id = $1',
      [id]
    );

    if (!result || result.length === 0 || result[0].count === 0) {
      throw new Error(`Profile with id ${id} not found`);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic update query based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'filePaths') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(JSON.stringify(value));
      } else if (key === 'status') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value ? 1 : 0);
      } else if (key !== 'id' && key !== 'createdAt') { // Skip id and createdAt
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Always update the updatedAt field
    updates.push(`updatedAt = $${paramIndex++}`);
    values.push(new Date().toISOString());

    // Add id for the WHERE clause
    values.push(id);

    const query = `UPDATE profiles SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    await db.execute(query, values);
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}

// Update getAllProfiles too
// Update getAllProfiles too
export async function getAllProfiles(): Promise<GSXProfile[]> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Get the result directly
    const result = await db.select<ProfileRow[]>('SELECT * FROM profiles');
    console.log("Database query result:", result);

    // If the table is empty, return an empty array
    if (!result || result.length === 0) {
      return [];
    }

    // Convert null to undefined and cast ID to expected format
    return result.map(profile => ({
      ...profile,
      id: profile.id as `${string}-${string}-${string}-${string}-${string}`,
      filePaths: JSON.parse(profile.filePaths),
      status: Boolean(profile.status),
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
      // Convert null to undefined for these properties
      airportDeveloper: profile.airportDeveloper || undefined,
      profileVersion: profile.profileVersion || undefined
    }));
  } catch (error) {
    console.error('Failed to get profiles:', error);
    // Return empty array instead of throwing
    return [];
  }
}

// Update the searchProfiles function if you have one
export async function searchProfiles(criteria: Partial<GSXProfile>): Promise<GSXProfile[]> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Build WHERE clause based on criteria
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'id' && key !== 'filePaths') {
        conditions.push(`${key} LIKE $${paramIndex++}`);
        params.push(`%${value}%`);
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM profiles ${whereClause}`;

    const result = await db.select<ProfileRow[]>(query, params);

    if (!result || result.length === 0) {
      return [];
    }

    return result.map(profile => ({
      ...profile,
      id: profile.id as `${string}-${string}-${string}-${string}-${string}`,
      filePaths: JSON.parse(profile.filePaths),
      status: Boolean(profile.status),
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt),
      airportDeveloper: profile.airportDeveloper || undefined,
      profileVersion: profile.profileVersion || undefined
    }));
  } catch (error) {
    console.error('Failed to search profiles:', error);
    return [];
  }
}