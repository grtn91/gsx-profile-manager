import { FolderView } from "./components/FolderView";
import "./css/App.css";
import { Button } from "./components/ui/button";
import { Settings, User } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppContext } from "./context/AppContext";
import { Spinner } from "./components/ui/spinner";

function App() {

    const {
      isLoading
    } 
    = useAppContext();
  

  return (
    <div>
    {isLoading ? (
      <div className="container mx-auto h-dvh content-center">
        <Spinner size="w-48 h-48"></Spinner>
      </div>
      ) : (
      <main className="container mx-auto p-4">
      <header className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold mb-4">
          GSX Profile Manager
        </h1>
        <nav>
          <Badge className="mr-2.5" variant="secondary">v0.0.3</Badge>
          <a href="https://www.paypal.com/donate/?hosted_button_id=TSPHNJJ58GEGN" target="_blank" className={cn(
          badgeVariants({ variant: "default" }),
          "mr-2.5")}>Support me</a>
          <Button variant="ghost" size="icon" className="h-9 w-9 mr-2">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="h-5 w-5" />
          </Button>
        </nav>
      </header>
      <div className="container">
        <FolderView />
      </div>
      </main>
      )
    }
    </div>
  );
}

export default App;
