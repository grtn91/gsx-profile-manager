import { BaseDirectory, mkdir, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import { FileWithContent } from './tempStorage';

// Create directories recursively if they don't exist
export async function ensureDirectoryExists(path: string, baseDir = BaseDirectory.AppData): Promise<void> {
    try {
        const dirExists = await exists(path, { baseDir });

        if (!dirExists) {
            console.log(`Creating directory: ${path}`);
            await mkdir(path, {
                baseDir,
                recursive: true,
            });

            // Verify the directory was created
            const verifyExists = await exists(path, { baseDir });
            if (!verifyExists) {
                throw new Error(`Directory was not created successfully: ${path}`);
            }
        }
    } catch (error) {
        console.error(`Failed to create directory ${path}:`, error);
        throw new Error(`Could not create directory ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Copy a file to its final destination
export async function saveFileToProfile(
    file: FileWithContent,
    destPath: string
): Promise<string> {
    try {
        await ensureDirectoryExists(destPath);

        // Calculate the full destination path including filename
        const finalPath = `${destPath}/${file.name}`;

        console.log(`Saving file to: ${finalPath}`);

        // Write the file to its final destination
        await writeTextFile(
            finalPath,
            file.content,
            { baseDir: BaseDirectory.AppData }
        );

        return finalPath;
    } catch (error) {
        console.error(`Failed to save file ${file.name}:`, error);
        throw new Error(`Could not save file ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Get the app data directory
export async function getAppDataDirectory(): Promise<string> {
    return await appDataDir();
}