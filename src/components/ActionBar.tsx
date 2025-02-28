import { useAppContext } from "../context/AppContext";
import { Button } from "./ui/button";
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { CheckCircle, Trash2 } from "lucide-react";

export function ActionBar() {
  const { selectedFiles, setSelectedFiles } = useAppContext();
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateProfiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one profile to activate");
      return;
    }
    
    try {
      setIsActivating(true);
      const result = await invoke<string>("activate_profiles", { selectedFiles });
      toast.success(result);
    } catch (error) {
      toast.error(`Failed to activate profiles: ${error}`);
      console.error("Error activating profiles:", error);
    } finally {
      setIsActivating(false);
    }
  };
  
  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 py-3 px-4 backdrop-blur-sm bg-background/80 border-t shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-3">
            {selectedFiles.length} files selected
          </span>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={selectedFiles.length === 0}
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
          
          <Button 
            onClick={handleActivateProfiles}
            disabled={selectedFiles.length === 0 || isActivating}
            className="flex items-center"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isActivating ? "Activating..." : "Apply Profiles"}
          </Button>
        </div>
      </div>
    </div>
  );
}