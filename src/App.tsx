import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import FolderView from "./components/Folders";
import { TableDemo } from "./components/TableDemo";
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
      <div className="grid grid-cols-1">
      <div className="">
        <TableDemo />
      </div>
      <div className="flex gap-4 mt-3">
        <Button variant="default">Activate Profiles</Button>
        <Button variant="destructive">Clear Profiles</Button>
      </div>
      </div>
    </main>
  );
}

export default App;
