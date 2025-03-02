import { Button } from "./ui/button";
import { CheckCircle, Trash2 } from "lucide-react";


export function ActionBar() {

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 py-3 px-4 backdrop-blur-sm bg-background/80 border-t shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-3">
            files selected
          </span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>

          <Button
            className="flex items-center"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            "Apply Profiles"
          </Button>
        </div>
      </div>
    </div>
  );
}