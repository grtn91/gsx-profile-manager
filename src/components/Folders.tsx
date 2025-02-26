import { Button } from "./ui/button";

function FolderView() {
  

    return (
      <div className="flex gap-4">
        <Button variant="destructive">Clear Profile Folder</Button>
        <Button variant="default">Active selected Profiles</Button>
      </div>
    );
  }
  
  export default FolderView;