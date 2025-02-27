import { invoke } from '@tauri-apps/api/core';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TreeDataItem } from '@/components/ui/tree-view';

interface AppContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentFolderPath: string;
  setCurrentFolderPath: (path: string) => void;
  selectedFiles: string[];
  setSelectedFiles: (path: string[]) => void;
  data: TreeDataItem[];
  setData: (folderContents: TreeDataItem[]) => void;
  expandedIds: string[];
  setExpandedIds: (ids: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [data, setData] = useState<TreeDataItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  
  // Load saved state when app starts
  useEffect(() => {
    async function loadSavedState() {
      try {
        setIsLoading(true);
        const [savedFolder, savedFiles, savedExpanded] = await invoke<[string | null, string[], string[]]>("load_app_state");
        
        if (savedFolder) {
          setCurrentFolderPath(savedFolder);
          const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath: savedFolder });
          setData(folderContents);
          
          if (savedExpanded && savedExpanded.length > 0) {
            setExpandedIds(savedExpanded);
          }
          
          if (savedFiles && savedFiles.length > 0) {
            setSelectedFiles(savedFiles);
          }
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSavedState();
  }, []);
  
  // Save state whenever it changes
  useEffect(() => {
    async function saveState() {
      // Don't save if we have nothing meaningful to save
      if (!currentFolderPath && selectedFiles.length === 0 && expandedIds.length === 0) return;
      
      try {
        await invoke("save_app_state", {
          currentFolder: currentFolderPath || null,
          selectedFiles,
          expandedIds
        });
      } catch (error) {
        console.error("Error saving state:", error);
      }
    }
    
    // Debounce the save to prevent too many calls
    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [currentFolderPath, selectedFiles, expandedIds]);

  return (
    <AppContext.Provider value={{ 
      isLoading, 
      setIsLoading, 
      currentFolderPath,
      setCurrentFolderPath,
      selectedFiles,
      setSelectedFiles,
      data,
      setData,
      expandedIds,
      setExpandedIds,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}