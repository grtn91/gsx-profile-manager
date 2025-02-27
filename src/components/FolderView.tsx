import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import { FileUser, Folder, FolderOpen, FolderOpenDot, FolderMinus, RefreshCw, X, ChevronRight, ChevronDown, FolderDot } from "lucide-react";

export function FolderView() {
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
  } 
  = useAppContext();

  const handleWatchFolder = async () => {
    try {
      const folderPath = await invoke<string>("select_folder");
      setCurrentFolderPath(folderPath);
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
      setData(folderContents); 
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error reading folder contents:", error);
    }
  };

  const handleStopWatching = async () => {
    // Clear UI state
    setData([]);
    setSelectedFiles([]);
    setCurrentFolderPath("");
    
    // Clear persistent state in the store
    try {
      await invoke("save_app_state", {
        currentFolder: null,  // Pass null to explicitly remove the folder
        selectedFiles: []     // Pass empty array to clear selections
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

  const handleActivateProfiles = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one profile to activate");
      return;
    }

    setIsLoading(true);
    try {
      const result = await invoke<string>("activate_profiles", { 
        selectedFiles 
      });
      
      // Show success message
      alert(result);
    } catch (error) {
      console.error("Error activating profiles:", error);
      alert(`Failed to activate profiles: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle item selection in the tree view
  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (!item) return;
    
    // Only handle files (items without children)
    if (!item.children) {
      // If already selected, remove it, otherwise add it
      const isSelected = selectedFiles.includes(item.id);
      if (isSelected) {
        setSelectedFiles(selectedFiles.filter(id => id !== item.id));
      } else {
        setSelectedFiles([...selectedFiles, item.id]);
      }
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
    
    // Check if all paths to selected items are already expanded
    const allPathsExpanded = pathFolders.every(id => expandedIds.includes(id));
    
    if (allPathsExpanded) {
      // If all paths are already expanded, collapse them
      // We only collapse paths related to selected files, not all expanded folders
      const remainingExpanded = expandedIds.filter(id => !pathFolders.includes(id));
      setExpandedIds(remainingExpanded);
    } else {
      // If not all paths are expanded, expand all paths to selected items
      // Keep existing expanded folders that aren't in the paths
      const newExpandedIds = [...new Set([...expandedIds, ...pathFolders])];
      setExpandedIds(newExpandedIds);
    }
  };

  const handleCloseAll = () => {
    setExpandedIds([]);
  };

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <Button onClick={handleWatchFolder}>Watch Folder</Button>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column (1/3) - Tree View */}
          <div className="col-span-1">
            {/* Path display and control buttons */}
            <div className="mb-4 border rounded-md p-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm overflow-hidden mr-2">
                  <Folder className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                  <div className="font-medium text-muted-foreground truncate">
                    {currentFolderPath}
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  {/* New expand buttons */}
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleExpandAll}
                    disabled={isLoading}
                    title="Expand All Folders"
                  >
                  <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleExpandToSelected}
                    disabled={isLoading || selectedFiles.length === 0}
                    title="Expand to Selected Items"
                  >
                    <FolderDot className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleCloseAll}
                    title="Close all folders"
                  >
                    <FolderMinus className="h-3.5 w-3.5" />
                  </Button>
                  {/* Existing buttons */}
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleRefreshFolder}
                    disabled={isLoading}
                    title="Refresh"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    size="icon"
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleStopWatching}
                    disabled={isLoading}
                    title="Reset"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <TreeView 
              data={data} 
              onSelectChange={handleSelectChange} 
              selectedItemIds={selectedFiles}
              defaultLeafIcon={FileUser}
              expandedIds={expandedIds} /* Pass the expanded IDs */
              onExpandedChange={setExpandedIds} /* Handle expansion changes */
            />
            
            <div className="flex gap-4 mt-4">
              <Button 
                variant="default" 
                onClick={handleActivateProfiles}
                disabled={isLoading || selectedFiles.length === 0}
                className="flex-1"
              >
                {isLoading ? "Activating..." : "Activate selected Profiles"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setSelectedFiles([])}
                disabled={isLoading || selectedFiles.length === 0}
                hidden={isLoading}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Right Column (2/3) - Selected Files Panel */}
          <div className="border rounded col-span-2 p-2 min-h-[300px] flex flex-col">
            <h3 className="font-medium mb-2">Selected Files: {selectedFiles.length}</h3>
            {selectedFiles.length > 0 ? (
              <ul className="text-sm space-y-1 overflow-y-auto flex-grow">
                {selectedFiles.map(path => (
                  <li key={path} className="truncate">
                    {path}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 flex-grow flex items-center justify-center">
                No files selected
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderView;