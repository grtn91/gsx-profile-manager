import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { useAppContext } from "../context/AppContext";
import { Button } from "./ui/button";
import { Eye, FileUser } from "lucide-react";
import { FolderToolbar } from "./FolderToolbar";
import { SelectedFolders } from "./SelectedFolders";
import { UserFoldersView } from "./UserFoldersView";
import { useEffect } from "react";

export function FolderView() {
  const {
    setIsLoading,
    currentWatchedFolderPath,
    setCurrentWatchedFolderPath,
    globalSelectedFiles: selectedFiles,
    setGlobalSelectedFiles: setSelectedFiles,
    watchedFolderExpandedIds,
    setwatchedFolderExpandedIds,
    watchedFolderData,
    setwatchedFolderData,
    refreshWatchedFolders,
    localFolderExpandedIds
  } = useAppContext();

  // Add a useEffect to load folder data if path exists but data doesn't
  useEffect(() => {
    if (currentWatchedFolderPath && watchedFolderData.length === 0) {
      refreshWatchedFolders();
    }
  }, [currentWatchedFolderPath, watchedFolderData.length]);

  const handleWatchFolder = async () => {
    try {
      setIsLoading(true);
      const folderPath = await invoke<string>("select_folder");

      console.log("Selected folder:", folderPath);

      if (folderPath) {
        setCurrentWatchedFolderPath(folderPath);

        const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
        setwatchedFolderData(folderContents);
        setSelectedFiles([]);

        // Explicitly save state after folder selection
        // This helps ensure the folder path is saved immediately
        await invoke("save_app_state", {
          currentFolder: folderPath,
          selectedFiles: [],
          expandedIds: watchedFolderExpandedIds,
          localExpandedIds: localFolderExpandedIds
        });

        console.log("Saved state after folder selection:", {
          currentFolder: folderPath
        });
      }
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
      {!currentWatchedFolderPath || watchedFolderData.length === 0 ? (
        <div className="container mx-auto h-[85vh] flex items-center justify-center">
          <Button onClick={handleWatchFolder}><Eye className="mr-2" />Watch Folder</Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column (1/3) - Tree Views */}
          <div className="col-span-1 space-y-4">
            <UserFoldersView />
            <div>
              <FolderToolbar />
              <div className="border rounded p-2">
                <TreeView
                  data={watchedFolderData}
                  onSelectChange={handleSelectChange}
                  selectedItemIds={selectedFiles}
                  defaultLeafIcon={FileUser}
                  expandedIds={watchedFolderExpandedIds}
                  onExpandedIdsChange={setwatchedFolderExpandedIds}
                />
              </div>
            </div>


          </div>

          {/* Right Column (2/3) - Selected Files */}
          <div className="col-span-2">
            <SelectedFolders />
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderView;