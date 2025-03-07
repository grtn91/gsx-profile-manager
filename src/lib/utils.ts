import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useRef } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useOnceCall(cb: CallableFunction, condition = true) {
  const isCalledRef = useRef(false);

  useEffect(() => {
    if (condition && !isCalledRef.current) {
      isCalledRef.current = true;
      cb();
    }
  }, [cb, condition]);
}

// Helper function to get a clean relative path, removing the dynamic first folder
export const getRelativePath = (path: string): string => {
  // Normalize path to use forward slashes for consistency
  const normalizedPath = path.replace(/\\/g, '/');

  const appDirIndex = normalizedPath.indexOf("gsx-profiles");
  if (appDirIndex !== -1) {
    // Get everything after "gsx-profiles"
    const afterAppDir = normalizedPath.substring(appDirIndex);

    // Split the path by slashes to get components
    const pathParts = afterAppDir.split('/');

    // If we have enough parts (gsx-profiles/continent/...)
    if (pathParts.length >= 2) {
      // Return everything starting from the continent part (index 1)
      return pathParts.slice(1).join('/');
    }

    // Fallback to the original behavior
    return afterAppDir;
  }
  return normalizedPath;
};

