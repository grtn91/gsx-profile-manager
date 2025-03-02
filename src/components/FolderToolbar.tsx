import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "@/context/AppContext";
import { Folder, FolderOpen, FolderOpenDot, FolderMinus, FolderSync, X } from "lucide-react";
import { toggleExpandAll, expandToSelected, areAllSelectedPathsExpanded } from "@/components/utils/treeViewUtils";
import { ButtonWithTooltip } from "./ui/button-with-tooltip";

export function FolderToolbar() {
  const {
    isLoading,
    setIsLoading,
    currentWatchedFolderPath: currentFolderPath,
    setCurrentWatchedFolderPath: setCurrentFolderPath,
    globalSelectedFiles: selectedFiles,
    setGlobalSelectedFiles: setSelectedFiles,
    watchedFolderData,
    setwatchedFolderData,
    watchedFolderExpandedIds,
    setwatchedFolderExpandedIds
  } = useAppContext();

  const handleStopWatching = async () => {
    // Clear UI state
    setwatchedFolderData([]);
    setSelectedFiles([]);
    setCurrentFolderPath("");
    setwatchedFolderExpandedIds([]);

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
      // Get the data from your backend
      const rawFolderContents = await invoke<any[]>("read_folder_contents", { folderPath: currentFolderPath });

      // Transform the data to match the expected TreeDataItem type
      const folderContents = rawFolderContents.map(item => ({
        ...item,
        path: item.path || item.id, // Add missing path if not present
        isDirectory: item.isDirectory || item.children?.length > 0 || false // Add isDirectory if not present
      }));

      setwatchedFolderData(folderContents);
    } catch (error) {
      console.error("Error refreshing folder contents:", error);
    } finally {
      setIsLoading(false);
    }
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
          <ButtonWithTooltip
            variant="ghost"
            className="h-7 w-7"
            onClick={() => toggleExpandAll(watchedFolderData, watchedFolderExpandedIds, setwatchedFolderExpandedIds)}
            disabled={isLoading}
            tooltip="Expand all folders"
            icon={<FolderOpen className="h-3.5 w-3.5" />}
          />
          <ButtonWithTooltip
            variant="ghost"
            className="h-7 w-7"
            onClick={() => expandToSelected(
              watchedFolderData,
              selectedFiles,
              watchedFolderExpandedIds,
              setwatchedFolderExpandedIds
            )}
            disabled={isLoading || areAllSelectedPathsExpanded(
              watchedFolderData,
              selectedFiles,
              watchedFolderExpandedIds
            )}
            tooltip="Expand all folders with selected profiles"
            icon={<FolderOpenDot className="h-3.5 w-3.5" />}
          />

          <ButtonWithTooltip
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setwatchedFolderExpandedIds([])}
            tooltip="Close all folders"
            icon={<FolderMinus className="h-3.5 w-3.5" />}
          />

          <ButtonWithTooltip
            variant="ghost"
            className="h-7 w-7"
            onClick={handleRefreshFolder}
            tooltip="Refresh watched folder"
            icon={<FolderSync className="h-3.5 w-3.5" />}
            disabled={isLoading}
          />

          <ButtonWithTooltip
            variant="ghost"
            className="h-7 w-7"
            onClick={handleStopWatching}
            tooltip="Stop watching folder and select new folde"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={isLoading}
          />

        </div>
      </div>
    </div>
  );
}

export default FolderToolbar;