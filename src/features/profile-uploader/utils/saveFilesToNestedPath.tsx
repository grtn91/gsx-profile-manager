import { path } from '@tauri-apps/api';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';

// Define types for the function parameters
export type FileWithContent = {
    name: string;
    text: () => Promise<string>;
    savedPath?: string;
};

export type PathSegments = {
    basePath: string;
    rootFolder: string;
    segments: Array<string | undefined>;
};

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