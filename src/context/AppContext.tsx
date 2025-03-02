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

  // Application state
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Session management
  saveAppState: () => Promise<void>;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Flag to track if initial state has been loaded
  const hasLoadedState = useRef(false);
  // Global selection state
  const [globalSelectedFiles, setGlobalSelectedFiles] = useState<string[]>([]);

  // Watched folders state
  const [watchedFolderData, setwatchedFolderData] = useState<TreeDataItem[]>([]);
  const [watchedFolderExpandedIds, setwatchedFolderExpandedIds] = useState<string[]>([]);
  const [currentWatchedFolderPath, setCurrentWatchedFolderPath] = useState<string | null>(null);

  // Local folders state (internal app storage)
  const [localFolderData, setLocalFolderData] = useState<TreeDataItem[]>([]);
  const [localFolderExpandedIds, setlocalFolderExpandedIds] = useState<string[]>([]);

  // Application state
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const saveAppState = async () => {
    // Don't save state until initial load is complete
    if (!hasLoadedState.current) {
      console.log("Skipping save - initial state not yet loaded");
      return;
    }

    try {
      /* console.log("Saving app state:", {
        currentFolder: currentWatchedFolderPath,
        selectedFiles: globalSelectedFiles.length,
        expandedIds: watchedFolderExpandedIds.length,
        localExpandedIds: localFolderExpandedIds.length
      }); */

      await invoke("save_app_state", {
        currentFolder: currentWatchedFolderPath,
        selectedFiles: globalSelectedFiles,
        expandedIds: watchedFolderExpandedIds,
        localExpandedIds: localFolderExpandedIds
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
    } catch (error) {
      console.error("Error refreshing local folders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function after refreshLocalFolders and before useEffect blocks
  // Function to refresh watched folders
  const refreshWatchedFolders = async () => {
    if (!currentWatchedFolderPath) {
      console.log("No folder path to refresh");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Refreshing watched folder:", currentWatchedFolderPath);

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

    /*     console.log("State changed, scheduling save...", {
          currentFolder: currentWatchedFolderPath,
          selectedFilesCount: globalSelectedFiles.length
        }); */

    const timeoutId = setTimeout(() => {
      saveAppState();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timeoutId);
  }, [currentWatchedFolderPath, globalSelectedFiles, watchedFolderExpandedIds, localFolderExpandedIds]);

  // Load app state on initial mount
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setIsLoading(true);

        // Load saved app state
        const appState = await invoke<{
          currentFolder: string | null;
          selectedFiles: string[];
          expandedIds: string[];
          localExpandedIds: string[];
        }>("load_app_state");

        // Apply the loaded state if it exists
        if (appState.currentFolder) {
          setCurrentWatchedFolderPath(appState.currentFolder);

          try {
            // Load folder contents
            const folderContents = await invoke<TreeDataItem[]>(
              "read_folder_contents",
              { folderPath: appState.currentFolder }
            );
            setwatchedFolderData(folderContents);
          } catch (error) {
            console.error("Error loading watched folder contents:", error);
          }
        }

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

        // Load local folders regardless of saved state
        await refreshLocalFolders();
      } catch (error) {
        console.error("Failed to load initial app state:", error);
        // Still try to load local folders even if loading saved state fails
        await refreshLocalFolders();
        // Still mark as loaded so we can save later
        hasLoadedState.current = true;
      } finally {
        setIsLoading(false);
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

    // Application state
    isLoading,
    setIsLoading,

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