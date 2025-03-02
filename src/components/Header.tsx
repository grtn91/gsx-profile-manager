import { Settings, User } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import logoSvg from '../assets/gsx-manager-logo.svg';
import { ButtonWithTooltip } from "./ui/button-with-tooltip";

function Header() {
  return (
    <header className="flex flex-row justify-between mb-5 p-4 bg-gray-100">
      <img src={logoSvg} alt="Logo" width={150} height={100} />

      <nav>
        {/* Version badge - Use a div wrapper instead of asChild */}
        <ButtonWithTooltip
          variant="ghost"
          tooltip={<a href="mailto:m.groten@yahoo.de">info@groten.cloud</a>}
          icon={<Badge className="mr-2.5" variant="secondary">v1.0.3</Badge>}
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
    </header>
  );
}

export default Header;