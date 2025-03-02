import { Button } from "@/components/ui/button";
import { Folder, FolderLock } from "lucide-react";

interface SetupScreenProps {
    handleWatchFolder: () => Promise<void>;
    handleInitLocalFolder: () => Promise<void>;
}

export default function SetupScreen({ handleWatchFolder, handleInitLocalFolder }: SetupScreenProps) {
    return (
        <div className="flex flex-col items-center text-center p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-6">Welcome to GSX Profile Manager</h1>
            <p className="text-muted-foreground mb-8">
                To get started, choose one of the options below:
            </p>

            <div className="grid grid-cols-1 gap-6 w-full md:grid-cols-2">
                <div className="flex flex-col items-center border rounded-lg p-6 transition-colors hover:bg-muted/50">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <Folder className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-medium mb-2">Watch a Folder</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Select a folder containing GSX profiles to browse and manage
                    </p>
                    <Button onClick={handleWatchFolder}>
                        Select Folder
                    </Button>
                </div>

                <div className="flex flex-col items-center border rounded-lg p-6 transition-colors hover:bg-muted/50">
                    <div className="rounded-full bg-primary/10 p-3 mb-4">
                        <FolderLock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-lg font-medium mb-2">Initialize Local Storage</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create a local folder structure for organizing your profiles
                    </p>
                    <Button onClick={handleInitLocalFolder}>
                        Initialize Storage
                    </Button>
                </div>
            </div>
        </div>
    );
}