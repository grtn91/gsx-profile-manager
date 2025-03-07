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
    const [updateObject, setUpdateObject] = useState<any>(null);

    const checkForUpdates = async () => {
        setChecking(true);
        setError(null);

        try {
            console.log("Checking for updates...");
            const update = await check({
                timeout: 10000,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GSX-Profile-Manager',
                }
            });
            console.log("Update check result:", update);

            if (update) {
                // Store the full update object for later use
                setUpdateObject(update);

                // Extract version and notes, handling object/string type issues
                const version = String(update.version || "Unknown");

                // Handle the body content which might be an object
                let bodyContent = "";
                if (update.body) {
                    if (typeof update.body === 'string') {
                        bodyContent = update.body;
                    } else {
                        try {
                            bodyContent = JSON.stringify(update.body, null, 2);
                        } catch (e) {
                            bodyContent = "Release notes available. Please see GitHub for details.";
                        }
                    }
                }

                setUpdateAvailable({
                    version,
                    body: bodyContent
                });
            } else {
                setUpdateAvailable(null);
            }
        } catch (err) {
            console.error("Failed to check for updates:", err);
            setError(`Update check failed: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        // Check for updates when component mounts
        checkForUpdates();
    }, []);

    const handleUpdate = async () => {
        if (!updateObject) return;

        setDownloading(true);
        setProgress(0);
        setError(null);

        try {
            let downloaded = 0;
            let contentLength = 0;

            await updateObject.downloadAndInstall((event: any) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength;
                        console.log(`Started downloading ${contentLength} bytes`);
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        const progressPercent = Math.round((downloaded / contentLength) * 100);
                        setProgress(progressPercent);
                        console.log(`Downloaded ${downloaded} of ${contentLength} bytes (${progressPercent}%)`);
                        break;
                    case 'Finished':
                        console.log('Download finished');
                        setProgress(100);
                        setDownloadComplete(true);
                        break;
                }
            });

            console.log('Update installed');
            // Give the user a moment to see the success message before relaunching
            setTimeout(async () => {
                await relaunch();
            }, 2000);

        } catch (err) {
            console.error("Failed to download and install update:", err);
            setError(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
            setDownloading(false);
        }
    };

    // If not checking and no update is available, don't render anything
    if (!checking && !updateAvailable && !error) {
        return null;
    }

    return (
        <Dialog open={!!(updateAvailable || checking || error)} onOpenChange={() => {
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
                                Download & Install
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}