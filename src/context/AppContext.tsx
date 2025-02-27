import { TreeDataItem } from '@/components/ui/tree-view';
import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentFolderPath: string,
  setCurrentFolderPath: (path: string) => void;
  selectedFiles: string[],
  setSelectedFiles: (path: string[]) => void;
  data: TreeDataItem[],
  setData: (folderContents: TreeDataItem[]) => void;
  expandedIds: string[],
  setExpandedIds: (ids: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [data, setData] = useState<TreeDataItem[]>([]);
  // Add state for expanded nodes
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

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