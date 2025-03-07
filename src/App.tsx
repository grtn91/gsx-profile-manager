import { Toaster } from "sonner";
import "./components/css/App.css"
import Header from './components/layouts/Header';
import { GsxProfilesTable } from './features/profile-table/components/data-table';
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { ShieldAlert } from "lucide-react";
import UpdateChecker from "./components/layouts/UpdateChecker";

function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const localDev = import.meta.env.MODE === 'development';

  useEffect(() => {
    // Check if the app is running with admin rights
    const checkAdminStatus = async () => {
      if (localDev) {
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      try {
        const hasAdminRights = await invoke<boolean>("is_admin");
        setIsAdmin(hasAdminRights);
      } catch (error) {
        console.error("Failed to check admin status:", error);
        // Default to true if we can't check to avoid blocking the app
        setIsAdmin(true);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const handleRestartAsAdmin = async () => {
    try {
      await invoke("restart_as_admin");
    } catch (error) {
      console.error("Failed to restart as admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Administrator Rights Required</h2>
          <p className="text-gray-600 mb-6">
            This application needs administrator permissions to create symbolic links for GSX profiles. Please restart the application as an administrator.
          </p>
          <Button
            onClick={handleRestartAsAdmin}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Restart as Administrator
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <UpdateChecker />
      <div className="sticky top-0 z-10 bg-background shadow-sm">
        <Header />
      </div>
      <div className="flex-grow overflow-auto h-w-full">
        <div className="p-10">
          <GsxProfilesTable />
          <Toaster />
        </div>
      </div>
    </div>
  );
}

export default App;