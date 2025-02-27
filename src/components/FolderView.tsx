import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import { FileUser, Folder, FolderOpen, FolderOpenDot, FolderMinus, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, X as XIcon } from "lucide-react";

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
      setIsLoading(true);
      const folderPath = await invoke<string>("select_folder");
      setCurrentFolderPath(folderPath);
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
      setData(folderContents); 
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error reading folder contents:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-4">
      {data.length === 0 ? (
        <div className="container mx-auto h-[85vh] flex items-center justify-center">
          <Button onClick={handleWatchFolder}>Watch Folder</Button>
        </div>
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
                    disabled={isLoading || areAllSelectedPathsExpanded()}
                    title="Expand to Selected Items"
                  >
                    <FolderOpenDot className="h-3.5 w-3.5" />
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
              onExpandedIdsChange={setExpandedIds} /* Handle expansion changes */
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
              <ul className="text-sm overflow-y-auto flex-grow">
                <AnimatePresence>
                  {(() => {
                    // Group files by parent folder (one level up from immediate parent)
                    const fileGroups: Record<string, string[]> = {};

                    selectedFiles.forEach(path => {
                      // Extract parent folder path
                      const lastSlashIndex = path.lastIndexOf('/');
                      const lastBackslashIndex = path.lastIndexOf('\\');
                      const lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
                      
                      if (lastSeparatorIndex !== -1) {
                        const parentPath = path.substring(0, lastSeparatorIndex);
                        
                        // Get parent of parent (one level up)
                        const parentLastSlashIndex = parentPath.lastIndexOf('/');
                        const parentLastBackslashIndex = parentPath.lastIndexOf('\\');
                        const parentLastSeparatorIndex = Math.max(parentLastSlashIndex, parentLastBackslashIndex);
                        
                        if (parentLastSeparatorIndex !== -1) {
                          const grandparentPath = parentPath.substring(0, parentLastSeparatorIndex);
                          
                          // Use grandparent path as the key
                          if (!fileGroups[grandparentPath]) {
                            fileGroups[grandparentPath] = [];
                          }
                          fileGroups[grandparentPath].push(path);
                        } else {
                          // Fallback to parent if no grandparent found
                          if (!fileGroups[parentPath]) {
                            fileGroups[parentPath] = [];
                          }
                          fileGroups[parentPath].push(path);
                        }
                      } else {
                        // No folder separator found, use "Other" as group
                        if (!fileGroups["Other"]) {
                          fileGroups["Other"] = [];
                        }
                        fileGroups["Other"].push(path);
                      }
                    });
                    
                    // Sort groups by folder name
                    const sortedGroups = Object.entries(fileGroups).sort((a, b) => {
                      const folderNameA = a[0].split(/[\/\\]/).pop() || a[0];
                      const folderNameB = b[0].split(/[\/\\]/).pop() || b[0];
                      return folderNameA.localeCompare(folderNameB);
                    });
                    
                    return sortedGroups.map(([folderPath, files]) => {
                      // Get folder name (last part of the path)
                      const folderName = folderPath.split(/[\/\\]/).pop() || folderPath;
                      
                      // Sort files alphabetically within each group
                      const sortedFiles = [...files].sort((a, b) => {
                        const fileNameA = a.split(/[\/\\]/).pop() || a;
                        const fileNameB = b.split(/[\/\\]/).pop() || b;
                        return fileNameA.localeCompare(fileNameB);
                      });
                      
                      return (
                        <motion.div
                          key={folderPath}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mb-3"
                        >
                          <div className="font-medium text-xs px-2 py-1 mb-1 bg-muted/40 rounded flex items-center">
                            <Folder className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="truncate">{folderName}</span>
                          </div>
                          {sortedFiles.map(path => (
                            <motion.li
                              key={path}
                              initial={{ opacity: 0, y: -10, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="group flex items-center gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 mb-1 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors ml-2"
                            >
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                              <span className="flex-grow truncate text-green-800 dark:text-green-300">
                                {path.split(/[\/\\]/).pop()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles(selectedFiles.filter(id => id !== path));
                                }}
                                className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200 transition-opacity"
                                title="Remove"
                              >
                                <XIcon className="h-3.5 w-3.5" />
                              </button>
                            </motion.li>
                          ))}
                        </motion.div>
                      );
                    });
                  })()}
                </AnimatePresence>
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