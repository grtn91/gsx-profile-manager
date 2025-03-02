import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { TreeDataItem } from '@/types/treeTypes';

// Define the context type
interface AppContextType {
  // Global selection state (shared across components)
  globalSelectedFiles: string[];
  setGlobalSelectedFiles: React.Dispatch<React.SetStateAction<string[]>>;

  // Watched folders (external filesystem)
  watchedFolderData: TreeDataItem[];
  setwatchedFolderData: React.Dispatch<React.SetStateAction<TreeDataItem[]>>;
  watchedFolderExpandedIds: string[];
  setwatchedFolderExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentWatchedFolderPath: string | null;
  setCurrentWatchedFolderPath: React.Dispatch<React.SetStateAction<string | null>>;
  refreshWatchedFolders: () => Promise<void>;

  // Local folders (internal app storage)
  localFolderData: TreeDataItem[];
  setLocalFolderData: React.Dispatch<React.SetStateAction<TreeDataItem[]>>;
  localFolderExpandedIds: string[];
  setlocalFolderExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;
  refreshLocalFolders: () => Promise<void>;

  // New initialization functions
  initializeLocalFolder: () => Promise<void>;

  // Application state
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Initialization states - replacing simplified mode
  folderWatchInitialized: boolean;
  setFolderWatchInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  localFolderInitialized: boolean;
  setLocalFolderInitialized: React.Dispatch<React.SetStateAction<boolean>>;

  // Session management
  saveAppState: () => Promise<void>;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentWatchedFolderPath, setCurrentWatchedFolderPath] = useState<string | null>(null);
  const [globalSelectedFiles, setGlobalSelectedFiles] = useState<string[]>([]);
  const [watchedFolderData, setwatchedFolderData] = useState<TreeDataItem[]>([]);
  const [localFolderData, setLocalFolderData] = useState<TreeDataItem[]>([]);
  const [watchedFolderExpandedIds, setwatchedFolderExpandedIds] = useState<string[]>([]);
  const [localFolderExpandedIds, setlocalFolderExpandedIds] = useState<string[]>([]);

  // Replace isSimplifiedMode with two separate initialization states
  const [folderWatchInitialized, setFolderWatchInitialized] = useState<boolean>(false);
  const [localFolderInitialized, setLocalFolderInitialized] = useState<boolean>(false);

  const hasLoadedState = useRef<boolean>(false);

  const saveAppState = async () => {
    // Don't save state until initial load is complete
    if (!hasLoadedState.current) {
      console.log("Skipping save - initial state not yet loaded");
      return;
    }

    try {
      console.log("Saving app state with explicit initialization flags:", {
        folderWatchInitialized,
        localFolderInitialized
      });

      await invoke("save_app_state", {
        currentFolder: currentWatchedFolderPath,
        selectedFiles: globalSelectedFiles,
        expandedIds: watchedFolderExpandedIds,
        localExpandedIds: localFolderExpandedIds,
        // CRITICAL FIX: Always pass the current state values
        folder_watch_initialized: folderWatchInitialized,
        local_folder_initialized: localFolderInitialized
      });
    } catch (error) {
      console.error("Failed to save app state:", error);
    }
  };

  // Function to refresh local folders (internal app storage)
  const refreshLocalFolders = async () => {
    try {
      setIsLoading(true);
      // Call the Tauri command to refresh local folders
      const folderContents = await invoke<TreeDataItem[]>("refresh_local_folders");
      setLocalFolderData(folderContents);

      if (folderContents.length > 0 && !localFolderInitialized) {
        // If we found content but local folder wasn't marked as initialized
        setLocalFolderInitialized(true);
      }
    } catch (error) {
      console.error("Error refreshing local folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeLocalFolder = async () => {
    try {
      setIsLoading(true);
      console.log("Initializing local folder structure...");

      // Create the local folder structure via backend
      await invoke("initialize_local_folders");

      // Explicitly set this state right away
      setLocalFolderInitialized(true);

      // Refresh the local folders to get updated data
      const localFolders = await invoke<TreeDataItem[]>("refresh_local_folders");
      setLocalFolderData(localFolders);

      // Save app state with updated initialization flags
      await saveAppState();

      // Add this to debug the app data location
      try {
        const appDataPath = await invoke<string>("get_app_data_path");
        console.log("App data is stored at:", appDataPath);
      } catch (e) {
        console.log("Couldn't get app data path:", e);
      }

      console.log("Local folder structure initialized successfully");
    } catch (error) {
      console.error("Failed to initialize local folder structure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh watched folders
  const refreshWatchedFolders = async () => {
    if (!currentWatchedFolderPath) {
      console.log("No folder path to refresh");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Refreshing watched folder:", currentWatchedFolderPath);

      // Regular folder handling
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", {
        folderPath: currentWatchedFolderPath
      });

      setwatchedFolderData(folderContents);
      console.log("Watched folder refreshed, found", folderContents.length, "items");
    } catch (error) {
      console.error("Error refreshing watched folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save state whenever critical parts change - with debounce
  useEffect(() => {
    // Don't save on initial render or before initial load
    if (!hasLoadedState.current) return;

    const timeoutId = setTimeout(() => {
      saveAppState();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [
    currentWatchedFolderPath,
    globalSelectedFiles,
    watchedFolderExpandedIds,
    localFolderExpandedIds,
    folderWatchInitialized,
    localFolderInitialized
  ]);

  // Load app state on initial mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);
        console.log("Loading initial state...");

        // Debug what's in the file first
        try {
          const fileContent = await invoke<string>("debug_read_app_settings");
          console.log("STARTUP - Settings file content:", fileContent);
        } catch (err) {
          console.error("Failed to read settings file:", err);
        }

        // Load saved app state
        const appState = await invoke<{
          currentFolder: string | null;
          selectedFiles: string[];
          expandedIds: string[];
          localExpandedIds: string[];
          folderWatchInitialized: boolean;
          localFolderInitialized: boolean;
        }>("load_app_state");

        console.log("Loaded app state:", appState);
        console.log("localFolderInitialized value type:", typeof appState.localFolderInitialized);
        console.log("folderWatchInitialized value type:", typeof appState.folderWatchInitialized);

        // Let's try to debug-save the state at startup too
        await invoke("save_app_state", {
          currentFolder: appState.currentFolder,
          selectedFiles: appState.selectedFiles || [],
          expandedIds: appState.expandedIds || [],
          localExpandedIds: appState.localExpandedIds || [],
          folder_watch_initialized: appState.folderWatchInitialized,
          local_folder_initialized: appState.localFolderInitialized
        });

        // Make sure to use direct boolean values instead of checking for undefined
        const watchInitialized = typeof appState.folderWatchInitialized === 'boolean'
          ? appState.folderWatchInitialized
          : false;

        const localInitialized = typeof appState.localFolderInitialized === 'boolean'
          ? appState.localFolderInitialized
          : false;

        console.log("Setting folder watch initialized to:", watchInitialized);
        setFolderWatchInitialized(watchInitialized);

        console.log("Setting local folder initialized to:", localInitialized);
        setLocalFolderInitialized(localInitialized);

        // Only set the current folder if watch is initialized
        if (appState.currentFolder && watchInitialized) {
          console.log("Setting watched folder path:", appState.currentFolder);
          setCurrentWatchedFolderPath(appState.currentFolder);

          // Load watched folder contents
          try {
            const folderContents = await invoke<TreeDataItem[]>(
              "read_folder_contents",
              { folderPath: appState.currentFolder }
            );
            setwatchedFolderData(folderContents);
          } catch (error) {
            console.error("Error loading watched folder contents:", error);
          }
        }

        console.log("Is folder watch initialized?", watchInitialized);
        console.log("Is local folder initialized?", localInitialized);

        if (appState.selectedFiles && appState.selectedFiles.length > 0) {
          setGlobalSelectedFiles(appState.selectedFiles);
        }

        if (appState.expandedIds && appState.expandedIds.length > 0) {
          setwatchedFolderExpandedIds(appState.expandedIds);
        }

        if (appState.localExpandedIds && appState.localExpandedIds.length > 0) {
          setlocalFolderExpandedIds(appState.localExpandedIds);
        }

        // Mark that we've loaded initial state - IMPORTANT!
        hasLoadedState.current = true;

        // Load local folders if they're initialized
        if (appState.localFolderInitialized) {
          await refreshLocalFolders();
        }
        // After everything is loaded
        console.log("Initial state loaded successfully!");
      } catch (error) {
        console.error("Error loading initial state:", error);
      } finally {
        setIsLoading(false);
        hasLoadedState.current = true;
      }
    };

    loadInitialState();
  }, []);

  // Create the context value object
  const contextValue: AppContextType = {
    // Global selection
    globalSelectedFiles,
    setGlobalSelectedFiles,

    // Watched folders
    watchedFolderData,
    setwatchedFolderData,
    watchedFolderExpandedIds,
    setwatchedFolderExpandedIds,
    currentWatchedFolderPath,
    setCurrentWatchedFolderPath,
    refreshWatchedFolders,

    // Local folders
    localFolderData,
    setLocalFolderData,
    localFolderExpandedIds,
    setlocalFolderExpandedIds,
    refreshLocalFolders,
    initializeLocalFolder,

    // Application state
    isLoading,
    setIsLoading,

    // Initialization states - replacing simplified mode
    folderWatchInitialized,
    setFolderWatchInitialized,
    localFolderInitialized,
    setLocalFolderInitialized,

    // Session management
    saveAppState
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the AppContext
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}