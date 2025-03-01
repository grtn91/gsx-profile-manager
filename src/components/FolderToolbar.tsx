import { invoke } from "@tauri-apps/api/core";
import { TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import { Folder, FolderOpen, FolderOpenDot, FolderMinus, RefreshCw, X } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

export function FolderToolbar() {
  const {
    isLoading, 
    setIsLoading,
    currentFolderPath, 
    setCurrentFolderPath, 
    selectedFiles, 
    setSelectedFiles, 
    expandedIds,
    setExpandedIds,
    data, 
    setData
  } = useAppContext();

  const handleStopWatching = async () => {
    // Clear UI state
    setData([]);
    setSelectedFiles([]);
    setCurrentFolderPath("");
    setExpandedIds([]);
    
    // Clear persistent state in the store
    try {
      await invoke("save_app_state", {
        currentFolder: null,
        selectedFiles: [],
        expandedIds: []
      });
      console.log("Store data cleared successfully");
    } catch (error) {
      console.error("Failed to clear store data:", error);
    }
  };

  const handleRefreshFolder = async () => {
    if (!currentFolderPath) return;
    
    try {
      setIsLoading(true);
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath: currentFolderPath });
      setData(folderContents);
    } catch (error) {
      console.error("Error refreshing folder contents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get all folder IDs for expansion
  const getAllFolderIds = (items: TreeDataItem[]): string[] => {
    let folderIds: string[] = [];
    
    const traverse = (items: TreeDataItem[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          folderIds.push(item.id);
          traverse(item.children);
        }
      }
    };
    
    traverse(items);
    return folderIds;
  };

  // Function to get paths to selected items
  const getPathsToSelectedItems = (items: TreeDataItem[], targetIds: string[]): string[] => {
    const paths: string[] = [];
    
    const findPaths = (items: TreeDataItem[], currentPath: string[] = []) => {
      for (const item of items) {
        const newPath = [...currentPath, item.id];
        
        // If this item is selected, add all parent folders to paths
        if (targetIds.includes(item.id)) {
          paths.push(...currentPath);
        }
        
        // Continue traversing if this item has children
        if (item.children && item.children.length > 0) {
          findPaths(item.children, newPath);
        }
      }
    };
    
    findPaths(items);
    return [...new Set(paths)]; // Remove duplicates
  };
  
  const handleExpandAll = () => {
    const allFolderIds = getAllFolderIds(data);
    
    // Check if all folders are already expanded
    const allExpanded = allFolderIds.every(id => expandedIds.includes(id));
    
    if (allExpanded) {
      // If all are expanded, collapse all
      setExpandedIds([]);
    } else {
      // If not all expanded, expand all
      setExpandedIds(allFolderIds);
    }
  };
  
  const handleExpandToSelected = () => {
    if (selectedFiles.length === 0) return;
    
    // Get paths to selected items
    const pathFolders = getPathsToSelectedItems(data, selectedFiles);
    
    // Expand all paths to selected items (no toggling)
    // Keep existing expanded folders
    const newExpandedIds = [...new Set([...expandedIds, ...pathFolders])];
    setExpandedIds(newExpandedIds);
  };
  
  // Helper to determine if the button should be disabled
  const areAllSelectedPathsExpanded = () => {
    if (selectedFiles.length === 0) return true; // Disable if nothing selected
    
    const pathFolders = getPathsToSelectedItems(data, selectedFiles);
    return pathFolders.every(id => expandedIds.includes(id));
  };

  const handleCloseAll = () => {
    setExpandedIds([]);
  };

  return (
    <div className="mb-4 border rounded-md p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm overflow-hidden mr-2">
          <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
          <div className="font-medium text-muted-foreground truncate">
            {currentFolderPath}
          </div>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={handleExpandAll}
                  disabled={isLoading}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expand all folders</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={handleExpandToSelected}
                  disabled={isLoading || areAllSelectedPathsExpanded()}
                >
                  <FolderOpenDot className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Expand all folders with selected profiles</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={handleCloseAll}
                >
                  <FolderMinus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Close all folders</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={handleRefreshFolder}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh watched folder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button 
                  size="icon"
                  variant="ghost" 
                  className="h-7 w-7"
                  onClick={handleStopWatching}
                  disabled={isLoading}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop watching folder and select new folder</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

export default FolderToolbar;