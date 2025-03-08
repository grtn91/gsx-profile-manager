import { Settings, User, UploadCloud, Play, RefreshCcw, UserCog, SearchCheck } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import logoSvg from '@/assets/gsx-manager-logo.svg';
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileUploader from "@/features/profile-uploader/components/profile-uploader";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useProfileStore } from "@/store/useGsxProfileStore";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";
import packageJson from "@/../package.json";
import { check } from '@tauri-apps/plugin-updater';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserSettings from "@/features/user-settings/components/user-settings";
import AirportProfileMatcher from "@/features/airport-profile-matcher/components/airportProfileMatcher";
import UpdateChecker from "@/features/update-checker/components/UpdateChecker";

function Header() {
  // State to control the visibility of the profile uploader modal
  const [showProfileUploader, setShowProfileUploader] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [showUpdateChecker, setShowUpdateChecker] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const { getSyncedProfiles } = useProfileStore();

  const [showAirportMatcher, setShowAirportMatcher] = useState(false);

  const handleApplyProfiles = async () => {
    try {
      setIsApplying(true);
      const syncedProfiles = getSyncedProfiles();

      if (syncedProfiles.length === 0) {
        toast.warning("No profiles are currently synced. Please sync at least one profile first.");
        return;
      }

      // Extract all file paths from the synced profiles
      const filePaths = syncedProfiles.flatMap(profile => profile.filePaths);

      // Call the Rust command to activate profiles - Use camelCase for parameter names
      const result = await invoke<string>("activate_profiles", {
        selectedFiles: filePaths // Changed from selected_files to selectedFiles
      });

      toast.success(result);
    } catch (error) {
      toast.error(`Failed to apply profiles: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      setCheckingForUpdates(true);
      toast.info("Checking for updates...");

      const update = await check({
        timeout: 10000,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GSX-Profile-Manager',
        }
      });

      if (update) {
        toast.success(`Update available: v${update.version}`, {
          description: "The update dialog will appear shortly.",
          duration: 5000
        });

        // Store the update data and show the dialog
        setUpdateData(update);
        setShowUpdateChecker(true);
      } else {
        toast.success("You're using the latest version!");
      }
    } catch (error) {
      toast.error(`Failed to check for updates: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCheckingForUpdates(false);
    }
  };

  return (
    <header className="flex flex-row items-center justify-between p-10 bg-gray-100">
      {/* Logo on the left */}
      <img src={logoSvg} alt="Logo" width={150} height={100} />

      {/* Center buttons */}
      <div className="flex space-x-4">
        <Button
          variant="default"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setShowProfileUploader(true)}
        >
          <UploadCloud className="h-5 w-5" />
          <span>Store Profile</span>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => handleApplyProfiles()}
          disabled={isApplying}
        >
          <Play className="h-5 w-5" />
          <span>Symlink Profiles</span>
        </Button>
      </div>

      {/* Navigation on the right */}
      <nav>
        {/* Version badge - Use a div wrapper instead of asChild */}
        <Badge className="mr-4" variant="outline">v{packageJson.version}</Badge>

        {/* Support link */}
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(badgeVariants({ variant: "default" }), "mr-2.5")}
        >
          Support me
        </a>

        {/* Settings button with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size={"icon"} className="h-9 w-9 mr-2">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={handleCheckForUpdates}
              disabled={checkingForUpdates}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              <span>Check for Updates</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowUserSettings(true)}
              className="flex items-center gap-2"
            >
              <UserCog className="h-4 w-4" />
              <span>User Settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User button - Now using regular button without asChild */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant="outline"
              className="h-9 w-9 mr-2"
            ><User className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => setShowAirportMatcher(true)}
              disabled={checkingForUpdates}
              className="flex items-center gap-2"
            >
              <SearchCheck className="h-4 w-4" />
              <span>Check missing profiles</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              disabled={true}
            >
              <UserCog className="h-4 w-4" />
              <span>Get Simbrief Route</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </nav>
      {/* Add the Airport Matcher Modal */}
      <Dialog open={showAirportMatcher} onOpenChange={setShowAirportMatcher}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader className="hidden">
            <DialogTitle>Airport Profile Matcher</DialogTitle>
            <DialogDescription>
              Check your community airports against your stored GSX profiles
            </DialogDescription>
          </DialogHeader>
          <AirportProfileMatcher onClose={() => setShowAirportMatcher(false)} />
        </DialogContent>
      </Dialog>

      {/* Add the Update Checker Modal */}
      <Dialog
        open={showUpdateChecker}
        onOpenChange={setShowUpdateChecker}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Available</DialogTitle>
            <DialogDescription>
              A new version of GSX Profile Manager is available
            </DialogDescription>
          </DialogHeader>
          {updateData && (
            <UpdateChecker
              updateData={updateData}
              onClose={() => setShowUpdateChecker(false)}
            />
          )}
        </DialogContent>
      </Dialog>



      {/* Profile Uploader Modal */}
      <Dialog open={showProfileUploader} onOpenChange={setShowProfileUploader}>
        <DialogContent className="min-w-fit">
          <DialogDescription />
          <div className="hidden">
            <DialogHeader>
              <DialogTitle>Upload GSX Profile</DialogTitle>
            </DialogHeader>
          </div>
          <ProfileUploader onSuccess={() => setShowProfileUploader(false)} />
        </DialogContent>
      </Dialog>

      {/* User Settings Modal */}
      <Dialog open={showUserSettings} onOpenChange={setShowUserSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Settings</DialogTitle>
            <DialogDescription>
              Set your simbrief
            </DialogDescription>
          </DialogHeader>
          <UserSettings onClose={() => setShowUserSettings(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}

export default Header;