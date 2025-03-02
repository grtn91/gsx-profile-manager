import { invoke } from "@tauri-apps/api/core";
import { TreeView } from './ui/tree-view';
import { useAppContext } from "../context/AppContext";
import { FileUser } from "lucide-react";
import { FolderToolbar } from "./FolderToolbar";
import { SelectedFolders } from "./SelectedFolders";
import { UserFoldersView } from "./UserFoldersView";
import { useEffect } from "react";
import SetupScreen from "./SetupScreen";

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
    localFolderExpandedIds,
    folderWatchInitialized,
    setFolderWatchInitialized,
    localFolderInitialized,
    setLocalFolderInitialized,
    initializeLocalFolder
  } = useAppContext();

  // Add a useEffect to load folder data if path exists but data doesn't
  useEffect(() => {
    if (currentWatchedFolderPath && watchedFolderData.length === 0) {
      console.log("Loading watched folder data for:", currentWatchedFolderPath);
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
        setFolderWatchInitialized(true); // Mark folder watch as initialized

        const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
        setwatchedFolderData(folderContents);
        setSelectedFiles([]);

        // Explicitly save state after folder selection
        await invoke("save_app_state", {
          currentFolder: folderPath,
          selectedFiles: [],
          expandedIds: watchedFolderExpandedIds,
          localExpandedIds: localFolderExpandedIds,
          folderWatchInitialized: true,
          localFolderInitialized
        });

        console.log("Saved state after folder selection");
      }
    } catch (error) {
      console.error("Error reading folder contents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle item selection in the tree view
  const handleSelectChange = (item: any) => {
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
      {(!folderWatchInitialized && !localFolderInitialized) ? (
        // Show setup screen when nothing is initialized
        <div className="container mx-auto h-[85vh] flex items-center justify-center">
          <SetupScreen
            handleWatchFolder={handleWatchFolder}
            handleInitLocalFolder={initializeLocalFolder}
          />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Left Column (2/3) - Tree Views */}
          <div className="col-span-2 space-y-4">
            {/* Show user folders view with appropriate initialization state */}
            <UserFoldersView />

            {folderWatchInitialized && currentWatchedFolderPath ? (
              // Show watched folder section when initialized
              <div>
                <FolderToolbar
                  showWatchFolderButton={false}
                  onWatchFolder={handleWatchFolder}
                />
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
            ) : (
              // Show folder watch initialization button when not initialized
              <div>
                <FolderToolbar
                  isWatchInitialized={folderWatchInitialized}
                  showWatchFolderButton={true}
                  onWatchFolder={handleWatchFolder}
                />
              </div>
            )}
          </div>

          {/* Right Column (1/3) - Selected Files */}
          <div className="col-span-1">
            <SelectedFolders />
          </div>
        </div>
      )}
    </div>
  );
}