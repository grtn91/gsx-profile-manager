import { FolderView } from "./components/FolderView";
import "./css/App.css";
import { Button } from "./components/ui/button";
import { Settings, User } from "lucide-react";

function App() {
  

  return (
    <main className="container mx-auto p-4">
      <header>
        <h1 className="text-3xl font-bold mb-4">
          GSX Profile Manager
        </h1>
        <div className="usermenu">
          <Button variant="ghost" size="icon" className="h-9 w-9 mr-2">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <div className="container">
        <FolderView />
      </div>
    </main>
  );
}

export default App;
