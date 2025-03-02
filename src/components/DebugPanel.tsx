import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "@/context/AppContext";
import { Button } from "./ui/button";

export function DebugPanel() {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [showJson, setShowJson] = useState(false);
    const { folderWatchInitialized, localFolderInitialized } = useAppContext();

    const readSettings = async () => {
        try {
            const content = await invoke<string>("debug_read_app_settings");
            setFileContent(content);
            setShowJson(true);
        } catch (err) {
            console.error("Failed to read settings file:", err);
            setFileContent("Error reading settings file");
            setShowJson(true);
        }
    };

    const getAppDataPath = async () => {
        try {
            const path = await invoke<string>("get_app_data_path");
            setFileContent(`App data is stored at: ${path}`);
            setShowJson(true);
        } catch (err) {
            console.error("Failed to get app data path:", err);
            setFileContent("Error getting app data path");
            setShowJson(true);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 bg-background border p-4 rounded-lg shadow-lg w-96 z-50">
            <h3 className="font-semibold mb-2">Debug Panel</h3>
            <div className="text-sm mb-2">
                <div>folderWatchInitialized: {folderWatchInitialized ? "true" : "false"}</div>
                <div>localFolderInitialized: {localFolderInitialized ? "true" : "false"}</div>
            </div>
            <div className="flex space-x-2 mb-2">
                <Button size="sm" variant="outline" onClick={readSettings}>
                    Read Settings File
                </Button>
                <Button size="sm" variant="outline" onClick={getAppDataPath}>
                    Get App Data Path
                </Button>
                {showJson && (
                    <Button size="sm" variant="outline" onClick={() => setShowJson(false)}>
                        Hide
                    </Button>
                )}
            </div>
            {showJson && fileContent && (
                <div className="mt-2 p-2 bg-muted rounded-md text-xs overflow-auto max-h-60">
                    <pre>{fileContent}</pre>
                </div>
            )}
        </div>
    );
}