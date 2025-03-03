import { BaseDirectory, mkdir, writeTextFile, remove, exists } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import { v4 as uuidv4 } from 'uuid';

// Type definition for our file objects
export interface FileWithContent {
    name: string;
    content: string;
    path?: string;
    tempId: string;
}

// Class to manage temporary file storage
export class TempFileStorage {
    private tempDir: string = 'temp_uploads';
    private files: Map<string, FileWithContent> = new Map();
    private initialized: boolean = false; // Fixed typo in variable name

    // Initialize the temp directory
    async initialize(): Promise<string> {
        if (this.initialized) return Promise.resolve('Already initialized');

        try {
            const appDataDirPath = await appDataDir();
            console.log(`App data directory: ${appDataDirPath}`);

            // Check if directory already exists
            const dirExists = await exists(this.tempDir, {
                baseDir: BaseDirectory.AppData
            }).catch(() => false);

            if (!dirExists) {
                console.log(`Creating temp directory: ${this.tempDir}`);
                await mkdir(this.tempDir, {
                    baseDir: BaseDirectory.AppData,
                    recursive: true
                });
            } else {
                console.log(`Temp directory already exists: ${this.tempDir}`);
            }

            this.initialized = true;
            const tempDirPath = `${appDataDirPath}${this.tempDir}`;
            console.log(`Using temp directory at: ${tempDirPath}`);
            return tempDirPath;
        } catch (error) {
            console.error('Failed to initialize temporary storage:', error);

            // Try an alternative approach - use in-memory only
            console.log('Falling back to in-memory storage only');
            this.initialized = true; // Still mark as initialized so we don't retry
            return '';
        }
    }

    // Store a file in temporary storage
    async storeFile(file: File): Promise<FileWithContent> {
        try {
            // Make sure temp storage is initialized
            if (!this.initialized) {
                await this.initialize();
            }

            const content = await file.text();
            const tempId = uuidv4();

            const fileWithContent: FileWithContent = {
                name: file.name,
                content,
                tempId
            };

            // Store in memory map
            this.files.set(tempId, fileWithContent);

            // Try to store on disk if initialization succeeded
            if (this.initialized) {
                try {
                    await mkdir(`${this.tempDir}/${tempId}`, {
                        baseDir: BaseDirectory.AppData,
                    })
                    await writeTextFile(
                        `${this.tempDir}/${tempId}/${file.name}`,
                        content,
                        { baseDir: BaseDirectory.AppData }
                    );
                } catch (diskError) {
                    console.warn('Could not save file to disk, using memory only:', diskError);
                }
            }

            return fileWithContent;
        } catch (error) {
            console.error('Failed to store file:', error);
            throw error;
        }
    }

    // Get a file from temporary storage
    getFile(tempId: string): FileWithContent | undefined {
        return this.files.get(tempId);
    }

    // Get all temporary files
    getAllFiles(): FileWithContent[] {
        return Array.from(this.files.values());
    }

    // Clean up temporary files
    async cleanup(tempIds?: string[]): Promise<void> {
        const idsToCleanup = tempIds || Array.from(this.files.keys());

        for (const tempId of idsToCleanup) {
            const file = this.files.get(tempId);
            if (file) {
                // Remove from memory
                this.files.delete(tempId);

                // Try to remove from disk
                if (this.initialized) {
                    try {
                        await remove(`${this.tempDir}/${tempId}_${file.name}`, {
                            baseDir: BaseDirectory.AppData
                        }).catch(err => console.warn(`Could not remove temp file: ${err}`));
                    } catch (error) {
                        console.warn(`Failed to clean up file ${file.name} from disk:`, error);
                        // Continue with other files
                    }
                }
            }
        }
    }
}

// Create a singleton instance
export const tempFileStorage = new TempFileStorage();