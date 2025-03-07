import { useState, useEffect } from "react";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";

export default function UpdateChecker() {
    const [updateAvailable, setUpdateAvailable] = useState<{ version: string, body: string } | null>(null);
    const [checking, setChecking] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadComplete, setDownloadComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkForUpdates = async () => {
        setChecking(true);
        setError(null);

        try {
            const update = await check();
            if (update) {
                setUpdateAvailable({
                    version: update.version,
                    body: update.body ?? ""
                });
            } else {
                setUpdateAvailable(null);
            }
        } catch (err) {
            console.error("Failed to check for updates:", err);
            setError("Failed to check for updates. Please try again later.");
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        checkForUpdates();
    }, []);

    const handleUpdate = async () => {
        if (!updateAvailable) return;

        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            const update = await check();
            if (!update) {
                setError("Update no longer available");
                setDownloading(false);
                return;
            }

            let downloaded = 0;
            let contentLength = 0;

            await update.downloadAndInstall((event: any) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength;
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        const percentage = (downloaded / contentLength) * 100;
                        setProgress(Math.round(percentage));
                        break;
                    case 'Finished':
                        setDownloadComplete(true);
                        break;
                }
            });

            // Give the user a moment to see the "Complete" message before relaunch
            setTimeout(async () => {
                await relaunch();
            }, 2000);

        } catch (err) {
            console.error("Failed to download and install update:", err);
            setError("Failed to download and install update. Please try again later.");
            setDownloading(false);
        }
    };

    // If not checking and no update is available, don't render anything
    if (!checking && !updateAvailable && !error) {
        return null;
    }

    return (
        <Dialog open={!!(updateAvailable || checking || error)} onOpenChange={() => {
            // Only allow closing if we're not in the middle of downloading
            if (!downloading) {
                setUpdateAvailable(null);
                setError(null);
            }
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {checking ? "Checking for Updates" :
                            error ? "Update Error" :
                                downloadComplete ? "Update Complete" :
                                    "Update Available"}
                    </DialogTitle>
                    <DialogDescription>
                        {checking ? (
                            "Please wait while we check for updates..."
                        ) : error ? (
                            error
                        ) : downloadComplete ? (
                            "Update has been installed. Application will restart momentarily."
                        ) : updateAvailable ? (
                            <>
                                <p className="mb-2">A new version is available: v{updateAvailable.version}</p>
                                <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded text-sm">
                                    <p className="whitespace-pre-line">{updateAvailable.body}</p>
                                </div>
                            </>
                        ) : null}
                    </DialogDescription>
                </DialogHeader>

                {checking && (
                    <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                )}

                {downloading && !downloadComplete && (
                    <div className="space-y-4 py-4">
                        <Progress value={progress} className="h-2" />
                        <p className="text-center text-sm text-gray-500">
                            Downloading update: {progress}%
                        </p>
                    </div>
                )}

                {downloadComplete && (
                    <div className="flex items-center justify-center py-4">
                        <CheckCircle2 className="h-12 w-12 text-green-500" />
                    </div>
                )}

                <DialogFooter>
                    {error && (
                        <Button onClick={checkForUpdates}>
                            Try Again
                        </Button>
                    )}

                    {updateAvailable && !downloading && !downloadComplete && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setUpdateAvailable(null)}
                                disabled={downloading}
                            >
                                Skip Update
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={downloading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download and Install
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}