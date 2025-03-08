import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowDownToLine } from 'lucide-react';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateCheckerProps {
    updateData: any;
    onClose: () => void;
}

export default function UpdateChecker({ updateData, onClose }: UpdateCheckerProps) {
    const [isInstalling, setIsInstalling] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [contentLength, setContentLength] = useState(0);
    const [downloadedBytes, setDownloadedBytes] = useState(0);

    const handleInstallUpdate = async () => {
        try {
            setIsInstalling(true);

            // The updateData object already has the downloadAndInstall method
            await updateData.downloadAndInstall((event: any) => {
                switch (event.event) {
                    case 'Started':
                        setContentLength(event.data.contentLength);
                        toast.info("Download started");
                        break;
                    case 'Progress':
                        const newDownloaded = downloadedBytes + event.data.chunkLength;
                        setDownloadedBytes(newDownloaded);
                        setDownloadProgress((newDownloaded / contentLength) * 100);
                        break;
                    case 'Finished':
                        toast.success("Download complete, installing update...");
                        break;
                }
            });

            // If we reach here, the update is installed but we need to relaunch
            toast.success("Update installed successfully");
            await relaunch();
        } catch (error) {
            setIsInstalling(false);
            toast.error(`Update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Version {updateData.version}</h2>
                <p className="text-muted-foreground">
                    {updateData.body || "New features and improvements available"}
                </p>
            </div>

            {isInstalling ? (
                <div className="space-y-2">
                    <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${downloadProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                        Downloading update: {downloadProgress.toFixed(0)}%
                        {contentLength > 0 && ` (${(downloadedBytes / 1048576).toFixed(2)} MB / ${(contentLength / 1048576).toFixed(2)} MB)`}
                    </p>
                </div>
            ) : (
                <div className="flex justify-center space-x-2">
                    <Button variant="outline" onClick={onClose}>
                        Skip for Now
                    </Button>
                    <Button onClick={handleInstallUpdate} className="flex items-center">
                        <ArrowDownToLine className="mr-2 h-4 w-4" />
                        Install Update
                    </Button>
                </div>
            )}
        </div>
    );
}