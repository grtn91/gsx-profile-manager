import { Button } from "./ui/button";
import { Settings, User } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import logoSvg from '../assets/gsx-manager-logo.svg';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

function Header() {

  return (

      <header className="flex flex-row justify-between mb-5 p-4 bg-gray-100">

        <img src={logoSvg} alt="Logo" width={150} height={100} />

        <nav>
          <Badge className="mr-2.5" variant="secondary">v1.0.2</Badge>
          <a href="https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN" target="_blank" className={cn(
          badgeVariants({ variant: "default" }),
          "mr-2.5")}>Support me</a>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
              <Button disabled variant="outline" size="icon" className="h-9 w-9 mr-2">
                <Settings className="h-5 w-5" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
              <Button disabled variant="outline" size="icon" className="h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </header>
      
  );
}

export default Header;
