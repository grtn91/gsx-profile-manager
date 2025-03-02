import { useAppContext } from "@/context/AppContext";
import { Folder, Check, X as XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDataItem } from "@/types/treeTypes";

export function SelectedFolders() {
  const {
    globalSelectedFiles,
    setGlobalSelectedFiles,
    watchedFolderData,
    localFolderData
  } = useAppContext();

  // Find all selected items from both data trees
  const getSelectedItems = (): TreeDataItem[] => {
    const items: TreeDataItem[] = [];

    // Recursive function to find items by ID
    const findItemsById = (nodes: TreeDataItem[], selectedIds: string[]) => {
      for (const node of nodes) {
        if (selectedIds.includes(node.id)) {
          items.push(node);
        }

        if (node.children && node.children.length > 0) {
          findItemsById(node.children, selectedIds);
        }
      }
    };

    // Search in both watched folders and local folders
    findItemsById(watchedFolderData, globalSelectedFiles);
    findItemsById(localFolderData, globalSelectedFiles);

    return items;
  };

  // Get all selected items
  const selectedItems = getSelectedItems();

  // Helper function to group items by parent folder
  const getGroupedItems = () => {
    // Group files by parent folder 
    const itemGroups: Record<string, TreeDataItem[]> = {};

    selectedItems.forEach(item => {
      const path = item.path;
      const isWatchedFolder = path.includes("GSX Profile"); // Check if it's a watched folder

      const lastSlashIndex = path.lastIndexOf('/');
      const lastBackslashIndex = path.lastIndexOf('\\');
      const lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);

      if (lastSeparatorIndex !== -1) {
        // Get immediate parent folder path
        const parentPath = path.substring(0, lastSeparatorIndex);

        let folderForGrouping;

        if (isWatchedFolder) {
          // For watched folders, go one level above the "GSX Profile Folder"
          const parentLastSlashIndex = parentPath.lastIndexOf('/');
          const parentLastBackslashIndex = parentPath.lastIndexOf('\\');
          const parentLastSeparatorIndex = Math.max(parentLastSlashIndex, parentLastBackslashIndex);

          if (parentLastSeparatorIndex !== -1) {
            // Go to the parent of the parent (one level above)
            const grandparentPath = parentPath.substring(0, parentLastSeparatorIndex);
            folderForGrouping = grandparentPath || parentPath;
          } else {
            folderForGrouping = parentPath;
          }
        } else {
          // For local files, use the immediate parent folder
          folderForGrouping = parentPath;
        }

        // Use the determined folder path as the key
        if (!itemGroups[folderForGrouping]) {
          itemGroups[folderForGrouping] = [];
        }
        itemGroups[folderForGrouping].push(item);
      } else {
        // No folder separator found, use "Other" as group
        if (!itemGroups["Other"]) {
          itemGroups["Other"] = [];
        }
        itemGroups["Other"].push(item);
      }
    });

    // Sort groups by folder name
    return Object.entries(itemGroups).sort((a, b) => {
      // Extract folder name from path for display
      const folderNameA = a[0].split(/[\/\\]/).pop() || a[0];
      const folderNameB = b[0].split(/[\/\\]/).pop() || b[0];
      return folderNameA.localeCompare(folderNameB);
    });
  };

  // Helper to remove an item from selection
  const removeItem = (itemId: string) => {
    setGlobalSelectedFiles(globalSelectedFiles.filter(id => id !== itemId));
  };

  return (
    <div className="border rounded col-span-2 p-2 flex flex-col self-start">
      <h3 className="font-medium mb-2">Selected Files: {globalSelectedFiles.length}</h3>

      {globalSelectedFiles.length > 0 ? (
        <ul className="text-sm">
          <AnimatePresence>
            {getGroupedItems().map(([folderPath, items]) => {
              // Get a more descriptive folder name based on source
              let folderName;
              if (folderPath.includes("GSX Profile")) {
                // For watched folders, show parent folder name with a watched indicator
                folderName = folderPath.split(/[\/\\]/).pop() || folderPath;
                folderName += " (Watched)";
              } else {
                // For local folders, just show the folder name
                folderName = folderPath.split(/[\/\\]/).pop() || folderPath;
              }

              // Sort items alphabetically within each group
              const sortedItems = [...items].sort((a, b) => {
                return a.name.localeCompare(b.name);
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
                    <span className="truncate" title={folderPath}>{folderName}</span>
                  </div>

                  {sortedItems.map(item => (
                    <motion.li
                      key={item.id}
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
                        {item.name}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-200 transition-opacity"
                        title="Remove"
                        aria-label="Remove file from selection"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </motion.li>
                  ))}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="text-sm text-gray-500 flex-grow flex items-center justify-center p-8">
          No files selected
        </div>
      )}
    </div>
  );
}

export default SelectedFolders;