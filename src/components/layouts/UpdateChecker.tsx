import { useState, useEffect } from "react";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, RefreshCw, CheckCircle2, ChevronDown } from "lucide-react";
import { getUserProfile, updateUserProfile } from "@/lib/db";
import type { UserProfile } from "@/types/userProfile";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UpdateChecker() {
    const [updateAvailable, setUpdateAvailable] = useState<{ version: string, body: string } | null>(null);
    const [checking, setChecking] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [downloadComplete, setDownloadComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updateObject, setUpdateObject] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
        // Load user profile first
        const loadUserProfile = async () => {
            const profile = await getUserProfile();
            setUserProfile(profile);

            // Check if updates should be skipped
            if (profile?.skipUpdate && profile.skipUpdateUntil && new Date(profile.skipUpdateUntil) > new Date()) {
                console.log(`Skipping update check until ${profile.skipUpdateUntil}`);
                setChecking(false);
            } else {
                // If skip period expired, reset skip settings
                if (profile?.skipUpdate) {
                    await updateUserProfile({
                        skipUpdate: false,
                        skipUpdateUntil: null
                    });
                }
                checkForUpdates();
            }
        };

        loadUserProfile();
    }, []);

    const handleSkipUpdate = async (duration: '7days' | '30days' | 'forever') => {
        let skipUpdateUntil: Date | null = null;

        if (duration === '7days') {
            skipUpdateUntil = new Date();
            skipUpdateUntil.setDate(skipUpdateUntil.getDate() + 7);
        } else if (duration === '30days') {
            skipUpdateUntil = new Date();
            skipUpdateUntil.setDate(skipUpdateUntil.getDate() + 30);
        } else if (duration === 'forever') {
            // Set to a very far future date - effectively forever
            skipUpdateUntil = new Date(8640000000000000); // Max date
        }

        try {
            await updateUserProfile({
                skipUpdate: true,
                skipUpdateUntil
            });

            console.log(`Updates will be skipped until ${skipUpdateUntil?.toISOString()}`);
            setUpdateAvailable(null); // Close the dialog
        } catch (err) {
            console.error("Failed to save skip update preference:", err);
        }
    };

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
                {/* Dialog header, description, etc. (unchanged) */}

                <DialogFooter>
                    {error && (
                        <Button onClick={checkForUpdates}>
                            Try Again
                        </Button>
                    )}

                    {updateAvailable && !downloading && !downloadComplete && (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" disabled={downloading}>
                                        Skip Update <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleSkipUpdate('7days')}>
                                        Skip for 7 days
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSkipUpdate('30days')}>
                                        Skip for 30 days
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSkipUpdate('forever')}>
                                        Skip forever
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

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