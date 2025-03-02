import { TreeDataItem } from '../../types/treeTypes';

// Get all folder IDs for expansion
export function getAllFolderIds(items: TreeDataItem[]): string[] {
  let folderIds: string[] = [];

  const traverse = (items: TreeDataItem[]) => {
    for (const item of items) {
      // Check if item is a directory (has children or explicitly marked as directory)
      if ((item.children && item.children.length > 0) || item.isDirectory) {
        folderIds.push(item.id);
        if (item.children) {
          traverse(item.children);
        }
      }
    }
  };

  traverse(items);
  return folderIds;
}

// Get paths to selected items
export function getPathsToSelectedItems(items: TreeDataItem[], targetIds: string[]): string[] {
  const paths: string[] = [];

  const findPaths = (items: TreeDataItem[], currentPath: string[] = []) => {
    for (const item of items) {
      const newPath = [...currentPath, item.id];

      // If this item is selected, add all parent folders to paths
      if (targetIds.includes(item.id)) {
        paths.push(...currentPath);
      }

      // Continue traversing if this item has children
      if (item.children && item.children.length > 0) {
        findPaths(item.children, newPath);
      }
    }
  };

  findPaths(items);
  return [...new Set(paths)]; // Remove duplicates
}

// Toggle expand all folders or collapse all
export function toggleExpandAll(
  items: TreeDataItem[],
  expandedIds: string[],
  setExpandedIds: (ids: string[]) => void,
  includeRoot: boolean = true
) {
  const allFolderIds = getAllFolderIds(items);

  // Check if all folders are already expanded
  const allExpanded = allFolderIds.every(id => expandedIds.includes(id));

  if (allExpanded) {
    // If all are expanded, collapse all
    setExpandedIds([]);
  } else {
    // If not all expanded, expand all
    const newExpandedIds = includeRoot ? ["root", ...allFolderIds] : allFolderIds;
    setExpandedIds(newExpandedIds);
  }
}

// Expand to selected items
export function expandToSelected(
  items: TreeDataItem[],
  selectedIds: string[],
  expandedIds: string[],
  setExpandedIds: (ids: string[]) => void,
  includeRoot: boolean = true
) {
  if (selectedIds.length === 0) return;

  // Get paths to selected items
  const pathFolders = getPathsToSelectedItems(items, selectedIds);

  // Always include root if requested
  const newExpandedIds = includeRoot
    ? [...new Set(["root", ...expandedIds, ...pathFolders])]
    : [...new Set([...expandedIds, ...pathFolders])];

  setExpandedIds(newExpandedIds);
}

// Check if all selected paths are already expanded
export function areAllSelectedPathsExpanded(
  items: TreeDataItem[],
  selectedIds: string[],
  expandedIds: string[]
): boolean {
  if (selectedIds.length === 0) return true; // Disable if nothing selected

  const pathFolders = getPathsToSelectedItems(items, selectedIds);
  // Also check if root is expanded when needed
  return pathFolders.every(id => expandedIds.includes(id)) &&
    (!pathFolders.length || expandedIds.includes("root"));
}