import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserProfile, updateUserProfile } from "@/lib/db";
import type { UserProfile } from "@/types/userProfile";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUserProfileStore } from "@/store/useUserProfileStore";

interface UserSettingsProps {
    onClose: () => void;
}

export default function UserSettings({ onClose }: UserSettingsProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [simbriefUsername, setSimbriefUsername] = useState("");
    const [openaiApiKey, setOpenaiApiKey] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userProfile = await getUserProfile();
                setProfile(userProfile);
                setSimbriefUsername(userProfile?.simbriefUsername || "");
                setOpenaiApiKey(userProfile?.openaiApiKey || "");
            } catch (error) {
                console.error("Failed to load user profile:", error);
                toast.error("Failed to load user settings");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const { updateOpenAiApiKey, getOpenAiApiKey } = useUserProfileStore();

    const handleSave = async () => {
        try {
            setSaving(true);

            await updateUserProfile({
                simbriefUsername,
            });

            await updateOpenAiApiKey(openaiApiKey);

            console.log("User profile updated:", profile);

            toast.success("Settings saved successfully");
            onClose();
        } catch (error) {
            console.error("Failed to save user profile:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-4">Loading...</div>;
    }

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="simbrief" className="text-right">
                    SimBrief Username
                </Label>
                <Input
                    id="simbrief"
                    className="col-span-3"
                    value={simbriefUsername}
                    onChange={(e) => setSimbriefUsername(e.target.value)}
                    placeholder="Enter your SimBrief username"
                />
                <Label htmlFor="simbrief" className="text-right">
                    OpenAi Api Key
                </Label>
                <Input
                    id="openaiApiKey"
                    className="col-span-3"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Enter your Open AI API Key"
                />
            </div>

            {/* Add more settings fields here as needed */}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                    Save Changes
                </Button>
            </DialogFooter>
        </div>
    );
}