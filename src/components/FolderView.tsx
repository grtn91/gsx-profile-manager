import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";

export function FolderView() {
  const [data, setData] = useState<TreeDataItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleWatchFolder = async () => {
    try {
      const folderPath = await invoke<string>("select_folder");
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
      setData(folderContents); 
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error reading folder contents:", error);
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
      setSelectedFiles(prev => {
        // If already selected, remove it, otherwise add it
        const isSelected = prev.includes(item.id);
        if (isSelected) {
          return prev.filter(id => id !== item.id);
        } else {
          return [...prev, item.id];
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <Button onClick={handleWatchFolder}>Watch Folder</Button>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column (2/3) - Tree View */}
          <div className="col-span-1">
            <TreeView 
              data={data} 
              onSelectChange={handleSelectChange} 
              selectedItemIds={selectedFiles}
            />
            
            <div className="flex gap-4 mt-4">
              <Button 
                variant="default" 
                onClick={handleActivateProfiles}
                disabled={isLoading || selectedFiles.length === 0}
              >
                {isLoading ? "Activating..." : "Activate selected Profiles"}
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => setSelectedFiles([])}
                disabled={isLoading || selectedFiles.length === 0}
              >
                Clear Selection
              </Button>
            </div>
          </div>
          
          {/* Right Column (1/3) - Selected Files Panel */}
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