import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TreeView, TreeDataItem } from './ui/tree-view';
import { Button } from "./ui/button";

export function TableDemo() {
  const [data, setData] = useState<TreeDataItem[]>([]);

  const handleWatchFolder = async () => {
    try {
      const folderPath = await invoke<string>("select_folder");
      const folderContents = await invoke<TreeDataItem[]>("read_folder_contents", { folderPath });
      setData(folderContents); 
      console.log(folderContents);
    } catch (error) {
      console.error("Error reading folder contents:", error);
    }
  };

  return (
    <div>
      {data.length === 0 ? (
        <Button onClick={handleWatchFolder}>Watch Folder</Button>
      ) : (
        <TreeView data={data} />
      )}
    </div>
  );
}