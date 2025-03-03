import { join } from '@tauri-apps/api/path';

export interface ProfilePathInfo {
    continent: string;
    country: string;
    icaoCode: string;
    developer?: string;
    version?: string;
}

// Generate the path based on the provided information
export async function generateProfilePath(
    baseDir: string,
    pathInfo: ProfilePathInfo
): Promise<string> {
    let path = baseDir;

    // Add required components
    path = await join(path, 'gsx_profiles');
    path = await join(path, sanitizePathComponent(pathInfo.continent));
    path = await join(path, sanitizePathComponent(pathInfo.country));
    path = await join(path, sanitizePathComponent(pathInfo.icaoCode).toUpperCase());

    // Add optional components if provided
    if (pathInfo.developer && pathInfo.developer.trim()) {
        path = await join(path, sanitizePathComponent(pathInfo.developer));

        if (pathInfo.version && pathInfo.version.trim()) {
            path = await join(path, sanitizePathComponent(pathInfo.version));
        }
    }

    return path;
}

// Sanitize path components to ensure they're valid directory names
function sanitizePathComponent(component: string): string {
    return component
        .trim()
        .replace(/[\/\\:*?"<>|]/g, '_') // Replace invalid path characters
        .replace(/\s+/g, '_'); // Replace spaces with underscore
}