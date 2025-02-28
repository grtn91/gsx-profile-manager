import { FolderView } from "./components/FolderView";
import "./css/App.css";
import { Button } from "./components/ui/button";
import { Settings, User, CircleCheckBig } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppContext } from "./context/AppContext";
import { Spinner } from "./components/ui/spinner";
// In your header component
import logoSvg from './assets/gsx-manager-logo.svg';
import { ActionBar } from "./components/ActionBar";
import { Toaster } from "sonner";

function App() {

    const {
      isLoading
    } 
    = useAppContext();
  

  return (
    <div>
    <Toaster 
    position="top-center" 
    duration={2000} 
    closeButton={true}
    icons={{
      "success": <CircleCheckBig />
    }}
    />
    {isLoading ? (
        <div className="container mx-auto h-dvh flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <img src={logoSvg} alt="Logo" width={300} height={200} className="mb-4" />
          <Spinner size="w-30 h-30" />
        </div>
      </div>
      ) : (
      <main>
      <header className="flex flex-row justify-between mb-5 p-4 bg-gray-100">

        <img src={logoSvg} alt="Logo" width={150} height={100} />

        <nav>
          <Badge className="mr-2.5" variant="secondary">v1.0.0</Badge>
          <a href="https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN" target="_blank" className={cn(
          badgeVariants({ variant: "default" }),
          "mr-2.5")}>Support me</a>
          <Button variant="outline" size="icon" className="h-9 w-9 mr-2">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <User className="h-5 w-5" />
          </Button>
        </nav>
      </header>
      <div className="container mx-auto">
        <FolderView />
      </div>
      {/* Add the ActionBar component */}
      <ActionBar />
      </main>
      )
    }
    </div>
  );
}

export default App;
