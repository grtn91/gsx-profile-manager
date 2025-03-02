import { useAppContext } from "../context/AppContext";
import { FolderLock, FolderOpen, FolderOpenDot, FolderMinus, ChevronDown, ChevronUp } from "lucide-react";
import { toggleExpandAll, expandToSelected, areAllSelectedPathsExpanded } from "./utils/treeViewUtils";
import { ButtonWithTooltip } from "./ui/button-with-tooltip";
import { Dispatch, SetStateAction } from "react";

interface UserFoldersToolbarProps {
  isTreeVisible: boolean;
  setIsTreeVisible: Dispatch<SetStateAction<boolean>>;
}

export function UserFoldersToolbar({
  isTreeVisible,
  setIsTreeVisible
}: UserFoldersToolbarProps) {
  const {
    localFolderData,
    localFolderExpandedIds,
    setlocalFolderExpandedIds,
    globalSelectedFiles,
    isLoading
  } = useAppContext();

  // Handle expand all folders - use utility function
  const handleExpandAll = () => {
    try {
      console.log("Expanding all folders");
      // Show tree view if it's hidden
      if (!isTreeVisible) {
        setIsTreeVisible(true);
      }
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

  // Handle expand to selected - use utility function
  const handleExpandToSelected = () => {
    try {
      console.log("Expanding to selected items");
      // Show tree view if it's hidden
      if (!isTreeVisible) {
        setIsTreeVisible(true);
      }
      expandToSelected(
        localFolderData,
        globalSelectedFiles,
        localFolderExpandedIds,
        setlocalFolderExpandedIds,
        true // Always include root node
      );
    } catch (error) {
      console.error("Error expanding to selected folders:", error);
    }
  };

  // Handle close all folders
  const handleCloseAll = () => {
    try {
      console.log("Closing all folders");
      setlocalFolderExpandedIds([]);
    } catch (error) {
      console.error("Error closing folders:", error);
    }
  };

  return (
    <div className="mb-4 border rounded-md p-3 bg-muted/30">
      <div className="flex flex-col">
        {/* Header row with title and toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center text-sm overflow-hidden mr-2">
            <FolderLock className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
            <div className="font-medium text-muted-foreground">
              GSX-PM Store
            </div>
          </div>
          <ButtonWithTooltip
            className="h-7 w-7"
            variant="ghost"
            onClick={() => setIsTreeVisible(!isTreeVisible)}
            tooltip={isTreeVisible ? "Hide folders" : "Show folders"}
            icon={isTreeVisible ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Button row */}
        <div className="flex space-x-1">
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
            onClick={handleExpandToSelected}
            disabled={isLoading || (isTreeVisible && areAllSelectedPathsExpanded(
              localFolderData,
              globalSelectedFiles,
              localFolderExpandedIds
            ))}
            tooltip="Expand folders with selected profiles"
            icon={<FolderOpenDot className="h-3.5 w-3.5" />}
          />

          <ButtonWithTooltip
            className="h-7 w-7"
            variant="ghost"
            onClick={handleCloseAll}
            disabled={isLoading}
            tooltip="Close all folders"
            icon={<FolderMinus className="h-3.5 w-3.5" />}
          />
        </div>
      </div>
    </div>
  );
}