import { remove, exists, readDir, mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { dirname } from '@tauri-apps/api/path';
import { useProfileStore } from '@/store/useGsxProfileStore';
import { appDataDir } from '@tauri-apps/api/path';
import { path } from '@tauri-apps/api';

// Define types for the function parameters
export interface FileWithContent {
    name: string;
    text: () => Promise<string>;
    savedPath?: string;
};

export interface PathSegments {
    basePath: string;
    rootFolder: string;
    segments: Array<string | undefined>;
};

/**
 * Checks if a directory is empty
 * @param dirPath Directory path to check
 * @returns True if directory is empty or doesn't exist
 */
async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
    try {
        const entries = await readDir(dirPath);
        return entries.length === 0;
    } catch (error) {
        console.warn(`Error checking if directory is empty: ${dirPath}`, error);
        return false; // Assume not empty if we can't check
    }
}

/**
 * Recursively removes empty parent directories up to a limit
 * @param dirPath Starting directory path
 * @param baseDir Don't delete directories at or above this level
 * @param maxLevels Maximum number of parent levels to check
 */
async function removeEmptyParentDirs(dirPath: string, baseDir: string, maxLevels: number = 3): Promise<void> {
    if (maxLevels <= 0 || dirPath === baseDir || dirPath.length <= baseDir.length) {
        return;
    }

    try {
        // Check if current directory is empty
        if (await isDirectoryEmpty(dirPath)) {
            console.log(`Removing empty directory: ${dirPath}`);
            await remove(dirPath, { recursive: true });

            // Check parent directory
            const parentDir = await dirname(dirPath);
            await removeEmptyParentDirs(parentDir, baseDir, maxLevels - 1);
        }
    } catch (error) {
        console.warn(`Failed to remove directory ${dirPath}:`, error);
    }
}

/**
 * Deletes all files associated with a profile from disk and cleans up empty directories
 * @param id Profile ID
 * @returns Promise that resolves when all files and empty directories are deleted
 */
export async function deleteProfileFiles(id: string): Promise<void> {
    // Get the profile by ID from the store
    const profile = useProfileStore.getState().getProfileById(id);

    if (!profile) {
        console.warn(`Profile with ID ${id} not found, no files to delete`);
        return;
    }

    console.log(`Deleting ${profile.filePaths.length} files for profile ${profile.airportIcaoCode}`);

    // Get base directory for profiles to set deletion boundary
    const baseDir = await appDataDir();
    const profileBaseDir = `${baseDir}gsx-profiles`;

    // Store directories that might need cleanup
    const dirsToCheck = new Set<string>();

    // Delete all files
    const deletePromises = profile.filePaths.map(async (filePath) => {
        try {
            // Check if file exists before attempting to delete
            const fileExists = await exists(filePath);
            if (fileExists) {
                // Get parent directory before deleting file
                const parentDir = await dirname(filePath);
                dirsToCheck.add(parentDir);

                // Delete the file
                await remove(filePath);
                console.log(`Deleted file: ${filePath}`);
            } else {
                console.log(`File doesn't exist, skipping: ${filePath}`);
            }
        } catch (error) {
            console.warn(`Failed to delete file ${filePath}:`, error);
            // Don't throw here to allow other files to be deleted
        }
    });

    // Wait for all file deletions to complete
    await Promise.all(deletePromises);

    // Clean up empty directories - starting from deepest level (version folder)
    for (const dir of dirsToCheck) {
        await removeEmptyParentDirs(dir, profileBaseDir);
    }
}

/**
 * Saves files to a nested directory structure
 * @param files - Array of files to save
 * @param pathConfig - Configuration for creating the directory structure
 * @returns Promise with the created directory path
 */
export async function saveFilesToNestedPath<T extends FileWithContent>(
    files: T[],
    pathConfig: PathSegments
): Promise<string> {
    // Filter out undefined segments and trim strings
    const validSegments = pathConfig.segments
        .filter((segment): segment is string => segment !== undefined)
        .map(segment => segment.trim())
        .filter(segment => segment.length > 0);

    // Build the complete path
    const pathParts = [pathConfig.basePath, pathConfig.rootFolder, ...validSegments];
    const directoryPath = await path.join(...pathParts);

    // Create all directories in the path
    await mkdir(directoryPath, { recursive: true });

    // Save each file to the directory
    for (const file of files) {
        const filePath = await path.join(directoryPath, file.name);

        // Read file content and save it
        const fileContent = await file.text();
        const encoder = new TextEncoder();
        const fileData = encoder.encode(fileContent);

        await writeFile(filePath, fileData);
    }

    return directoryPath;
}