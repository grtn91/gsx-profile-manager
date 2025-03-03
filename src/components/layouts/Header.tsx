import { Settings, User, UploadCloud, Play } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import logoSvg from '@/assets/gsx-manager-logo.svg';
import { ButtonWithTooltip } from "../ui/button-with-tooltip";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfileUploader from "@/features/profile-uploader/components/profile-uploader";

function Header() {
  // State to control the visibility of the profile uploader modal
  const [showProfileUploader, setShowProfileUploader] = useState(false);

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
          <span>Upload Profile</span>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex items-center gap-2"
        >
          <Play className="h-5 w-5" />
          <span>Apply Profiles</span>
        </Button>
      </div>

      {/* Navigation on the right */}
      <nav>
        {/* Version badge - Use a div wrapper instead of asChild */}
        <ButtonWithTooltip
          variant="ghost"
          tooltip={<a href="mailto:m.groten@yahoo.de">info@groten.cloud</a>}
          icon={<Badge className="mr-4" variant="secondary">v1.0.3</Badge>}
        />

        {/* Support link */}
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(badgeVariants({ variant: "default" }), "mr-2.5")}
        >
          Support me
        </a>

        {/* Settings button - Now using regular button without asChild */}
        <ButtonWithTooltip
          variant="outline"
          className="h-9 w-9 mr-2"
          disabled
          tooltip="Coming soon"
          icon={<Settings className="h-5 w-5" />}
        />

        {/* User button - Now using regular button without asChild */}
        <ButtonWithTooltip
          variant="outline"
          className="h-9 w-9 mr-2"
          disabled
          tooltip="Coming soon"
          icon={<User className="h-5 w-5" />}
        />
      </nav>

      {/* Profile Uploader Modal */}
      <Dialog open={showProfileUploader} onOpenChange={setShowProfileUploader}>
        <DialogContent className="min-w-fit">
          <DialogHeader>
            <DialogTitle>Upload GSX Profile</DialogTitle>
          </DialogHeader>
          <ProfileUploader />
        </DialogContent>
      </Dialog>
    </header>
  );
}

export default Header;