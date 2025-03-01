import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";
import { useAppContext } from "@/context/AppContext";
import { FileUser } from "lucide-react";
import FolderToolbar from "./FolderToolbar";
import SelectedFolders from "./SelectedFolders";

export function FolderView() {
  const {
    setIsLoading, 
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
            <FolderToolbar />

            <TreeView 
              data={data} 
              onSelectChange={handleSelectChange} 
              selectedItemIds={selectedFiles}
              defaultLeafIcon={FileUser}
              expandedIds={expandedIds} /* Pass the expanded IDs */
              onExpandedIdsChange={setExpandedIds} /* Handle expansion changes */
            />

          </div>
          
          {/* Right Column (2/3) - Selected Files Panel */}
          <SelectedFolders />
        </div>
      )}
    </div>
  );
}

export default FolderView;