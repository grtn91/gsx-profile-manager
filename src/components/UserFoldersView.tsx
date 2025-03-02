import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { useAppContext } from "../context/AppContext";
import { FileIcon, FolderPlus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { UserFoldersToolbar } from './UserFoldersToolbar';

export function UserFoldersView() {
  // Get global state from AppContext
  const {
    globalSelectedFiles,
    setGlobalSelectedFiles,
    localFolderData,
    localFolderExpandedIds,
    setlocalFolderExpandedIds,
    refreshLocalFolders,
    isLoading
  } = useAppContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentParentFolder, setCurrentParentFolder] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);

  // Handle adding files to a folder
  const handleAddFiles = async (folderId: string, folderPath: string) => {
    if (isProcessing) return; // Prevent multiple operations

    try {
      setIsProcessing(true);
      setCurrentOperation(`adding-files-${folderId}`);

      // Open file dialog to select files
      const selectedFilePaths = await invoke<string[]>("select_files_for_import");

      if (selectedFilePaths && selectedFilePaths.length > 0) {
        // Import each selected file
        for (const filePath of selectedFilePaths) {
          // Pass both the ID and path - the backend can use whichever it needs
          await invoke("import_file_to_user_folder", {
            sourceFilePath: filePath,
            targetFolderId: folderPath // Use path instead of ID
          });
        }

        await refreshLocalFolders();
        toast.success(`Added ${selectedFilePaths.length} file(s)`);
      }
    } catch (error) {
      toast.error(`Failed to add files: ${error}`);
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };

  // Confirm deletion of an item
  const handleDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setIsDeleteDialogOpen(true);
  };

  // Delete the item
  const handleDeleteItem = async () => {
    if (!itemToDelete || isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentOperation(`deleting-${itemToDelete}`);
      await invoke("delete_user_folder_item", { itemPath: itemToDelete });

      // Find items with this path in the selection and remove them
      // This is more robust than checking by ID
      const itemsToRemove = globalSelectedFiles.filter(id => {
        // Find the item in the data
        const findItemById = (items: TreeDataItem[]): TreeDataItem | undefined => {
          for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
              const found = findItemById(item.children);
              if (found) return found;
            }
          }
          return undefined;
        };

        const item = findItemById([...localFolderData]);
        return item && item.path === itemToDelete;
      });

      if (itemsToRemove.length > 0) {
        setGlobalSelectedFiles(globalSelectedFiles.filter(id => !itemsToRemove.includes(id)));
      }

      await refreshLocalFolders();
      setIsDeleteDialogOpen(false);
      toast.success("Item deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete item: ${error}`);
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };
  // Open the dialog to create a folder at root level
  const handleAddRootFolder = () => {
    setCurrentParentFolder("root");
    setNewFolderName("");
    setIsDialogOpen(true);
  };

  // Open the dialog to create a subfolder
  const handleAddSubfolder = (parentFolderPath: string) => {
    setCurrentParentFolder(parentFolderPath); // Store the path instead of ID
    setNewFolderName("");
    setIsDialogOpen(true);
  };

  // Create the subfolder with the provided name
  const handleCreateSubfolder = async () => {
    if (!newFolderName.trim() || !currentParentFolder || isProcessing) return;

    try {
      setIsProcessing(true);
      setCurrentOperation(`creating-folder-${currentParentFolder}`);

      await invoke("create_subfolder", {
        parentFolderId: currentParentFolder,
        folderName: newFolderName
      });

      // Expand the parent folder to show the new subfolder
      if (!localFolderExpandedIds.includes(currentParentFolder)) {
        setlocalFolderExpandedIds([...localFolderExpandedIds, currentParentFolder]);
      }

      await refreshLocalFolders();
      setNewFolderName("");
      setIsDialogOpen(false);
      toast.success(`Created folder: ${newFolderName}`);
    } catch (error) {
      toast.error(`Failed to create folder: ${error}`);
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
    }
  };

  // Handle item selection in tree view
  const handleSelectChange = (item: TreeDataItem | undefined) => {
    if (!item) return;

    // Only handle files (items without children)
    if (!item.children) {
      const isSelected = globalSelectedFiles.includes(item.id);

      if (isSelected) {
        // Remove from selection
        setGlobalSelectedFiles(globalSelectedFiles.filter(id => id !== item.id));
      } else {
        // Add to selection
        setGlobalSelectedFiles([...globalSelectedFiles, item.id]);
      }
    }
  };

  // Add action buttons to each tree item
  const enhanceTreeItems = (items: TreeDataItem[]): TreeDataItem[] => {
    return items.map(item => {
      const isRootNode = item.id === "root";
      const isActionDisabled = isProcessing && (
        currentOperation === `creating-folder-${item.id}` ||
        currentOperation === `adding-files-${item.id}` ||
        currentOperation === `deleting-${item.id}`
      );

      // Create actions based on item type
      let actionButtons;

      if (isRootNode) {
        actionButtons = (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              handleAddRootFolder();
            }}
            title="Create folder"
            disabled={isProcessing}
          >
            {isProcessing && currentOperation === "creating-folder-root" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderPlus className="h-3.5 w-3.5" />
            )}
          </Button>
        );
      } else if (item.isDirectory) {
        // It's a folder (not root)
        actionButtons = (
          <>
            {/* Add files button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleAddFiles(item.id, item.path);
              }}
              title="Add files to folder"
              disabled={isActionDisabled}
            >
              {isProcessing && currentOperation === `adding-files-${item.id}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Create subfolder button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                handleAddSubfolder(item.path); // Pass both ID and path
              }}
              title="Create subfolder"
              disabled={isActionDisabled}
            >
              {isProcessing && currentOperation === `creating-folder-${item.id}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Delete folder button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteConfirm(item.path);
              }}
              title="Delete folder"
              disabled={isActionDisabled}
            >
              {isProcessing && currentOperation === `deleting-${item.id}` ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </>
        );
      } else {
        // It's a file
        actionButtons = (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteConfirm(item.path); // Use item.path instead of item.id
            }}
            title="Delete file"
            disabled={isActionDisabled}
          >
            {isProcessing && currentOperation === `deleting-${item.id}` ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        );
      }

      // Wrap buttons in a div to prevent click propagation
      const actions = (
        <div
          className="flex items-center justify-end min-w-[84px]"
          onClick={(e) => e.stopPropagation()}
        >
          {actionButtons}
        </div>
      );

      // Process children recursively if they exist
      const enhancedItem = {
        ...item,
        actions
      };

      if (item.children) {
        enhancedItem.children = enhanceTreeItems(item.children);
      }

      return enhancedItem;
    });
  };

  const rootNode = {
    id: "root",
    name: "Root",
    path: "root",
    isDirectory: true,
    children: localFolderData
  };

  // Enhanced tree with the root node and actions
  const enhancedUserFolders = enhanceTreeItems([rootNode]);

  return (
    <div>
      <UserFoldersToolbar />
      <div className="border rounded p-4 relative">
        {isLoading && !isProcessing && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <TreeView
          data={enhancedUserFolders}
          expandedIds={localFolderExpandedIds}
          onExpandedIdsChange={setlocalFolderExpandedIds}
          onSelectChange={handleSelectChange}
          selectedItemIds={globalSelectedFiles}
          defaultLeafIcon={FileIcon}
        />
      </div>

      {/* Dialog for creating folders */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !isProcessing && setIsDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a New Folder</DialogTitle>
            <DialogDescription>
              {currentParentFolder !== "root" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Location: <span className="font-mono">
                    {currentParentFolder?.includes("user_folders")
                      ? currentParentFolder?.substring(currentParentFolder.indexOf("user_folders") + "user_folders".length)
                      : currentParentFolder?.split(/[\/\\]/).slice(-3).join('/')}
                  </span>
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={currentParentFolder === "root"
                  ? "New root folder"
                  : `Enter folder name (in ${currentParentFolder?.split(/[\/\\]/).pop()})`
                }
                autoComplete="off"
                disabled={isProcessing}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline" disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubfolder}
              type="submit"
              disabled={!newFolderName.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Folder...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for confirming deletion */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !isProcessing && setIsDeleteDialogOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {itemToDelete && (
              <p className="text-sm text-muted-foreground mt-2">
                {itemToDelete.split(/[\/\\]/).pop()}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline" disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteItem}
              variant="destructive"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserFoldersView;