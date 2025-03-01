import { useAppContext } from "@/context/AppContext";
import { Folder, Check, X as XIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SelectedFolders() {
  const { selectedFiles, setSelectedFiles } = useAppContext();

  // Helper function to group files by parent folder
  const getGroupedFiles = () => {
    // Group files by parent folder (one level up from immediate parent)
    const fileGroups: Record<string, string[]> = {};

    selectedFiles.forEach(path => {
      // Extract parent folder path
      const lastSlashIndex = path.lastIndexOf('/');
      const lastBackslashIndex = path.lastIndexOf('\\');
      const lastSeparatorIndex = Math.max(lastSlashIndex, lastBackslashIndex);
      
      if (lastSeparatorIndex !== -1) {
        const parentPath = path.substring(0, lastSeparatorIndex);
        
        // Get parent of parent (one level up)
        const parentLastSlashIndex = parentPath.lastIndexOf('/');
        const parentLastBackslashIndex = parentPath.lastIndexOf('\\');
        const parentLastSeparatorIndex = Math.max(parentLastSlashIndex, parentLastBackslashIndex);
        
        if (parentLastSeparatorIndex !== -1) {
          const grandparentPath = parentPath.substring(0, parentLastSeparatorIndex);
          
          // Use grandparent path as the key
          if (!fileGroups[grandparentPath]) {
            fileGroups[grandparentPath] = [];
          }
          fileGroups[grandparentPath].push(path);
        } else {
          // Fallback to parent if no grandparent found
          if (!fileGroups[parentPath]) {
            fileGroups[parentPath] = [];
          }
          fileGroups[parentPath].push(path);
        }
      } else {
        // No folder separator found, use "Other" as group
        if (!fileGroups["Other"]) {
          fileGroups["Other"] = [];
        }
        fileGroups["Other"].push(path);
      }
    });
    
    // Sort groups by folder name
    return Object.entries(fileGroups).sort((a, b) => {
      const folderNameA = a[0].split(/[\/\\]/).pop() || a[0];
      const folderNameB = b[0].split(/[\/\\]/).pop() || b[0];
      return folderNameA.localeCompare(folderNameB);
    });
  };

  // Helper to remove a file from selection
  const removeFile = (path: string) => {
    setSelectedFiles(selectedFiles.filter(id => id !== path));
  };

  return (
    <div className="border rounded col-span-2 p-2 flex flex-col self-start">
      <h3 className="font-medium mb-2">Selected Files: {selectedFiles.length}</h3>
      
      {selectedFiles.length > 0 ? (
        <ul className="text-sm">
          <AnimatePresence>
            {getGroupedFiles().map(([folderPath, files]) => {
              // Get folder name (last part of the path)
              const folderName = folderPath.split(/[\/\\]/).pop() || folderPath;
              
              // Sort files alphabetically within each group
              const sortedFiles = [...files].sort((a, b) => {
                const fileNameA = a.split(/[\/\\]/).pop() || a;
                const fileNameB = b.split(/[\/\\]/).pop() || b;
                return fileNameA.localeCompare(fileNameB);
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
                    <span className="truncate">{folderName}</span>
                  </div>
                  
                  {sortedFiles.map(path => (
                    <motion.li
                      key={path}
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
                        {path.split(/[\/\\]/).pop()}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(path);
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