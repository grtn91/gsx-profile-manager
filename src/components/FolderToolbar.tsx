import { ExternalLink, Folder, FolderOpen, FolderSearch, RefreshCw } from "lucide-react";
import { ButtonWithTooltip } from "./ui/button-with-tooltip";
import { useAppContext } from "@/context/AppContext";
import { invoke } from "@tauri-apps/api/core";

// Define the props interface
interface FolderToolbarProps {
  isWatchInitialized?: boolean;
  showWatchFolderButton?: boolean;
  onWatchFolder?: () => Promise<void>;
}

export function FolderToolbar({
  isWatchInitialized = false,
  showWatchFolderButton = false,
  onWatchFolder
}: FolderToolbarProps) {
  const {
    currentWatchedFolderPath,
    refreshWatchedFolders
  } = useAppContext();

  // Add the missing handleOpenFolder function
  const handleOpenFolder = async () => {
    if (!currentWatchedFolderPath) return;

    try {
      await invoke("open_folder_in_explorer", { folderPath: currentWatchedFolderPath });
    } catch (error) {
      console.error("Error opening folder:", error);
    }
  };

  return (
    <div className="mb-4 border rounded-md p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm overflow-hidden mr-2">
          {currentWatchedFolderPath ? (
            <>
              <FolderOpen className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="font-medium text-muted-foreground truncate">
                {currentWatchedFolderPath}
              </div>
            </>
          ) : (
            <>
              <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
              <div className="font-medium text-muted-foreground">
                Watched Folder
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Watch folder button when not initialized */}
          {showWatchFolderButton && onWatchFolder && (
            <ButtonWithTooltip
              variant="ghost"
              onClick={onWatchFolder}
              tooltip={isWatchInitialized ? "Change watched folder" : "Watch a folder"}
              icon={<FolderSearch className="h-4 w-4" />}
            />
          )}

          {/* Only show these buttons when a folder is being watched */}
          {currentWatchedFolderPath && (
            <>
              <ButtonWithTooltip
                variant="ghost"
                onClick={refreshWatchedFolders}
                tooltip="Refresh folder"
                icon={<RefreshCw className="h-4 w-4" />}
              />

              <ButtonWithTooltip
                variant="ghost"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={handleOpenFolder}
                tooltip="Open in explorer"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}