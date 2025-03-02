import { useAppContext } from "../context/AppContext";
import { FolderLock, FolderOpen, FolderOpenDot, FolderMinus, FolderPlus } from "lucide-react";
import { toggleExpandAll, expandToSelected, areAllSelectedPathsExpanded } from "./utils/treeViewUtils";
import { ButtonWithTooltip } from "./ui/button-with-tooltip";

interface UserFoldersToolbarProps {
  onInitializeLocalFolder?: () => Promise<void>;
}

export function UserFoldersToolbar({ onInitializeLocalFolder }: UserFoldersToolbarProps) {
  const {
    localFolderData,
    localFolderExpandedIds,
    setlocalFolderExpandedIds,
    globalSelectedFiles,
    isLoading,
    localFolderInitialized,
    initializeLocalFolder
  } = useAppContext();

  // Handle expand all folders - use utility function
  const handleExpandAll = () => {
    try {
      console.log("Expanding all folders");
      toggleExpandAll(
        localFolderData,
        localFolderExpandedIds,
        setlocalFolderExpandedIds,
        true // Always include root node
      );
    } catch (error) {
      console.error("Error expanding folders:", error);
    }
  };

  // Handler for initialization
  const handleInit = async () => {
    if (onInitializeLocalFolder) {
      await onInitializeLocalFolder();
    } else {
      await initializeLocalFolder();
    }
  };

  return (
    <div className="mb-4 border rounded-md p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm overflow-hidden mr-2">
          <FolderLock className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
          <div className="font-medium text-muted-foreground">
            GSX-PM Store
          </div>
        </div>

        {/* Button layout depends on initialization state */}
        {localFolderInitialized ? (
          // Show normal toolbar when initialized
          <div className="flex space-x-1 flex-shrink-0">
            <ButtonWithTooltip
              className="h-7 w-7"
              variant="ghost"
              onClick={handleExpandAll}
              disabled={isLoading}
              tooltip="Expand all folders"
              icon={<FolderOpen className="h-3.5 w-3.5" />}
            />

            <ButtonWithTooltip
              className="h-7 w-7"
              variant="ghost"
              onClick={() => expandToSelected(
                localFolderData,
                globalSelectedFiles,
                localFolderExpandedIds,
                setlocalFolderExpandedIds,
                true
              )}
              disabled={isLoading || areAllSelectedPathsExpanded(
                localFolderData,
                globalSelectedFiles,
                localFolderExpandedIds
              )}
              tooltip="Expand folders with selected profiles"
              icon={<FolderOpenDot className="h-3.5 w-3.5" />}
            />

            <ButtonWithTooltip
              className="h-7 w-7"
              variant="ghost"
              onClick={() => setlocalFolderExpandedIds([])}
              disabled={isLoading}
              tooltip="Close all folders"
              icon={<FolderMinus className="h-3.5 w-3.5" />}
            />
          </div>
        ) : (
          // Show initialize button when not initialized
          <div className="flex space-x-1 flex-shrink-0">
            <ButtonWithTooltip
              className="h-7 w-7"
              variant="ghost"
              onClick={handleInit}
              disabled={isLoading}
              tooltip="Initialize local storage"
              icon={<FolderPlus className="h-3.5 w-3.5" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}