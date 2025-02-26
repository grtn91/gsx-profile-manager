import { FolderView } from "./components/FolderView";
import "./css/App.css";
import { Button } from "./components/ui/button";
import { Settings, User } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

function App() {
  

  return (
    <main className="container mx-auto p-4">
      <header className="flex flex-row justify-between">
        <h1 className="text-3xl font-bold mb-4">
          GSX Profile Manager
        </h1>
        <nav>
          <Badge className="mr-2.5" variant="secondary">v.0.0.1-alpha.2</Badge>
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
  );
}

export default App;
