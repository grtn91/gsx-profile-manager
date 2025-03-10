import { appDataDir } from '@tauri-apps/api/path';
import { GSXProfile } from '@/types/gsx-profile';
import Database from '@tauri-apps/plugin-sql';
import { join } from '@tauri-apps/api/path';
import { UserProfile } from '@/types/userProfile';

let db: Database | null = null;

// Track database version to manage migrations
const CURRENT_DB_VERSION = 8; // Increment when schema changes

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

    console.log('Database initialized successfully', db);
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

    // Migration 2 to 3: Add user_profiles table
    if (currentVersion < 3) {
      console.log('Applying migration v2 to v3: Creating user_profiles table');

      await db.execute(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          simbriefUsername TEXT,
          skipUpdate INTEGER DEFAULT 0,
          skipUpdateUntil TEXT, 
          communityFolderAirports TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // Insert a default record
      const now = new Date().toISOString();
      await db.execute(`
        INSERT INTO user_profiles (simbriefUsername, skipUpdate, communityFolderAirports, createdAt, updatedAt)
        VALUES ('', 0, '[]', ?, ?);
      `, [now, now]);

      console.log('Created user_profiles table with default record');
    }

    // Add more migrations here in the future
    // Migration 3 to 4: Adding ignoredAirports to user_profiles
    if (currentVersion < 4) {
      console.log('Applying migration v3 to v4: Adding ignoredAirports to user_profiles');

      try {
        // Check if the column already exists (for safety)
        const tableInfo = await db.select<{ name: string }[]>("PRAGMA table_info(user_profiles)");
        const columnExists = tableInfo.some(col => col.name === 'ignoredAirports');

        if (!columnExists) {
          await db.execute(`ALTER TABLE user_profiles ADD COLUMN ignoredAirports TEXT DEFAULT '[]';`);
          console.log('Added ignoredAirports column to user_profiles table');
        } else {
          console.log('ignoredAirports column already exists, skipping');
        }
      } catch (error) {
        console.error('Failed to add ignoredAirports column:', error);
        throw error;
      }
    }

    // Migration 4 to 5: Add applied column to gsx profiles
    if (currentVersion < 5) {
      console.log('Applying migration v4 to v5: Add applied column to gsx profiles');

      // Check if the column already exists (for safety)
      const tableInfo = await db.select<{ name: string }[]>(
        "PRAGMA table_info(profiles)"
      );

      const columnExists = tableInfo.some(col => col.name === 'applied');

      if (!columnExists) {
        await db.execute(`ALTER TABLE profiles ADD COLUMN applied INTEGER DEFAULT 0;`);
        console.log('Added applied column to gsx profiles');
      } else {
        console.log('applied column already exists, skipping');
      }
    }

    // Fix Migration 6 to : Add openai key to user_profiles
    if (currentVersion < 6) {
      console.log('Applying migration v5 to v6: Add openaiApiKey to user_profiles');

      // Check if the column already exists (for safety)
      const tableInfo = await db.select<{ name: string }[]>(
        "PRAGMA table_info(user_profiles)"
      );

      const columnExists = tableInfo.some(col => col.name === 'openaiApiKey');

      if (!columnExists) {
        await db.execute(`ALTER TABLE user_profiles ADD COLUMN openaiApiKey TEXT DEFAULT '';`);
        console.log('Added openaiApiKey column to user_profiles');
      } else {
        console.log('openaiApiKey column already exists, skipping');
      }
    }

    // Migration 7 to 8: Ensure openaiApiKey exists in user_profiles
    if (currentVersion = 8) {
      console.log('Applying migration v7 to v8: Ensuring openaiApiKey exists in user_profiles');

      try {
        // Check if the column exists
        const tableInfo = await db.select<{ name: string }[]>(
          "PRAGMA table_info(user_profiles)"
        );

        const columnExists = tableInfo.some(col => col.name === 'openaiApiKey');

        if (!columnExists) {
          console.log('openaiApiKey column is missing, adding it now');
          await db.execute(`ALTER TABLE user_profiles ADD COLUMN openaiApiKey TEXT DEFAULT '';`);
          console.log('Added openaiApiKey column to user_profiles');

          // Print the updated schema to verify
          const updatedSchema = await db.select("PRAGMA table_info(user_profiles)");
          console.log("Updated user_profiles schema:", updatedSchema);
        } else {
          console.log('openaiApiKey column already exists in user_profiles');
        }
      } catch (error) {
        console.error('Error checking/adding openaiApiKey column:', error);
        throw error; // Rethrow to prevent incomplete migrations
      }
    }

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

// Add a new function to mark profiles as applied
export async function markProfilesAsApplied(ids: string[]): Promise<void> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Reset all profiles to not applied
    await db.execute('UPDATE profiles SET applied = 0');

    // Mark the specified profiles as applied
    for (const id of ids) {
      await db.execute(
        'UPDATE profiles SET applied = 1, updatedAt = $1 WHERE id = $2',
        [new Date().toISOString(), id]
      );
    }
  } catch (error) {
    console.error('Failed to mark profiles as applied:', error);
    throw error;
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
    const result = await db.select<GSXProfile[]>('SELECT * FROM profiles');
    console.log("Database query result:", result);

    // If the table is empty, return an empty array
    if (!result || result.length === 0) {
      return [];
    }

    // Convert null to undefined and cast ID to expected format
    return result.map(profile => ({
      ...profile,
      id: profile.id as `${string}-${string}-${string}-${string}-${string}`,
      filePaths: JSON.parse(profile.filePaths.toString()),
      status: Boolean(profile.status),
      applied: Boolean(profile.applied),
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

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // There should only be one record, so we'll get the first one
    const result = await db.select<any[]>('SELECT * FROM user_profiles LIMIT 1');

    if (!result || result.length === 0) {
      // If no profile exists, create a default one
      return await createDefaultUserProfile();
    }

    console.log("User profile query result:", result);

    const profile = result[0];
    return {
      id: profile.id,
      simbriefUsername: profile.simbriefUsername || '',
      openaiApiKey: profile.openaiApiKey || '',
      skipUpdate: Boolean(profile.skipUpdate),
      skipUpdateUntil: profile.skipUpdateUntil ? new Date(profile.skipUpdateUntil) : null,
      communityFolderAirports: JSON.parse(profile.communityFolderAirports || '[]'),
      ignoredAirports: JSON.parse(profile.ignoredAirports || '[]'),
      createdAt: new Date(profile.createdAt),
      updatedAt: new Date(profile.updatedAt)
    };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    if (!db) await initializeDb();
    if (!db) throw new Error('Database not initialized');

    // Get the current profile first
    const currentProfile = await getUserProfile();
    if (!currentProfile) {
      throw new Error('No user profile found to update');
    }

    const updatedFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle each updatable field
    if ('simbriefUsername' in updates) {
      updatedFields.push(`simbriefUsername = $${paramIndex++}`);
      values.push(updates.simbriefUsername);
    }

    if ('skipUpdate' in updates) {
      updatedFields.push(`skipUpdate = $${paramIndex++}`);
      values.push(updates.skipUpdate ? 1 : 0);

      // If skipUpdate is true, set skipUpdateUntil to 30 days from now
      if (updates.skipUpdate) {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        updatedFields.push(`skipUpdateUntil = $${paramIndex++}`);
        values.push(thirtyDaysLater.toISOString());
      } else {
        updatedFields.push(`skipUpdateUntil = $${paramIndex++}`);
        values.push(null);
      }
    }

    if ('communityFolderAirports' in updates && updates.communityFolderAirports) {
      updatedFields.push(`communityFolderAirports = $${paramIndex++}`);
      values.push(JSON.stringify(updates.communityFolderAirports));
    }

    if ('openaiApiKey' in updates) {  // Changed from checking !null to just checking if the field is present
      updatedFields.push(`openaiApiKey = $${paramIndex++}`);
      values.push(updates.openaiApiKey || '');  // Allow empty strings
    }

    if ('ignoredAirports' in updates && updates.ignoredAirports) {
      updatedFields.push(`ignoredAirports = $${paramIndex++}`);
      values.push(JSON.stringify(updates.ignoredAirports));
    }

    // Always update the updatedAt timestamp
    updatedFields.push(`updatedAt = $${paramIndex++}`);
    values.push(new Date().toISOString());

    // Execute the update
    const query = `UPDATE user_profiles SET ${updatedFields.join(', ')} WHERE id = $${paramIndex}`;
    values.push(currentProfile.id);

    await db.execute(query, values);

    // Return the updated profile
    return getUserProfile();
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return null;
  }
}

async function createDefaultUserProfile(): Promise<UserProfile> {
  if (!db) throw new Error('Database not initialized');

  const now = new Date();
  const defaultProfile: UserProfile = {
    simbriefUsername: '',
    openaiApiKey: '',
    skipUpdate: false,
    skipUpdateUntil: null,
    communityFolderAirports: [],
    ignoredAirports: [],
    createdAt: now,
    updatedAt: now
  };

  await db.execute(`
    INSERT INTO user_profiles (
      simbriefUsername, openaiApiKey, skipUpdate, skipUpdateUntil, communityFolderAirports, ignoredAirports, createdAt, updatedAt
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    defaultProfile.simbriefUsername,
    defaultProfile.openaiApiKey,
    defaultProfile.skipUpdate ? 1 : 0,
    defaultProfile.skipUpdateUntil?.toISOString() || null,
    JSON.stringify(defaultProfile.communityFolderAirports),
    JSON.stringify(defaultProfile.ignoredAirports),
    defaultProfile.createdAt.toISOString(),
    defaultProfile.updatedAt.toISOString()
  ]);

  // Get the newly created profile
  const result = await db.select<any[]>('SELECT * FROM user_profiles ORDER BY id DESC LIMIT 1');
  const profile = result[0];

  return {
    id: profile.id,
    simbriefUsername: profile.simbriefUsername,
    openaiApiKey: profile.openaiApiKey,
    skipUpdate: Boolean(profile.skipUpdate),
    skipUpdateUntil: profile.skipUpdateUntil ? new Date(profile.skipUpdateUntil) : null,
    communityFolderAirports: JSON.parse(profile.communityFolderAirports),
    ignoredAirports: JSON.parse(profile.ignoredAirports || '[]'),
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt)
  };
}