import { TreeDataItem, TreeView } from './ui/tree-view';
import { useAppContext } from "../context/AppContext";
import { FileIcon, Loader2 } from "lucide-react";
import { UserFoldersToolbar } from './UserFoldersToolbar';
import { useState } from 'react';

export function UserFoldersView() {
  const {
    isLoading,
    localFolderData,
    localFolderExpandedIds,
    setlocalFolderExpandedIds,
    globalSelectedFiles,
    setGlobalSelectedFiles
  } = useAppContext();

  // Add state for toggling tree view visibility
  const [isTreeVisible, setIsTreeVisible] = useState(true);

  // Handle select change in user folders tree
  const handleSelectChange = (item: TreeDataItem) => {
    if (!item) return;

    // Only handle files (items without children)
    if (!item.children) {
      // If already selected, remove it, otherwise add it
      const isSelected = globalSelectedFiles.includes(item.id);
      if (isSelected) {
        setGlobalSelectedFiles(globalSelectedFiles.filter(id => id !== item.id));
      } else {
        setGlobalSelectedFiles([...globalSelectedFiles, item.id]);
      }
    }
  };

  return (
    <div>
      <UserFoldersToolbar
        isTreeVisible={isTreeVisible}
        setIsTreeVisible={setIsTreeVisible}
      />
      {isTreeVisible && (
        <div className="border rounded p-2 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <TreeView
            data={localFolderData}
            expandedIds={localFolderExpandedIds}
            onExpandedIdsChange={setlocalFolderExpandedIds}
            onSelectChange={handleSelectChange}
            selectedItemIds={globalSelectedFiles}
            defaultLeafIcon={FileIcon}
          />
        </div>
      )}
    </div>
  );
}

export default UserFoldersView;