import { Toaster } from "sonner";
import "./components/css/App.css"
import Header from './components/layouts/Header';
import { GsxProfilesTable } from './features/profile-table/components/data-table';
import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Spinner } from "./components/ui/spinner";

function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const localDev = import.meta.env.MODE === 'development';

  // Combine the two effects into one to avoid race conditions
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First check admin status
        let adminStatus = true; // Default to true for safety

        if (!localDev) {
          try {
            adminStatus = await invoke<boolean>("is_admin");
            console.log("Admin check result:", adminStatus);
          } catch (error) {
            console.error("Admin check failed:", error);
          }
        }

        setIsAdmin(adminStatus);

        // If we have admin rights, load the stores
        if (adminStatus) {
          // Simulate loading stores or do real loading
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } finally {
        // Only set loading to false when everything is done
        setLoading(false);
      }
    };

    initializeApp();
  }, [localDev]);

  const handleRestartAsAdmin = async () => {
    try {
      await invoke("restart_as_admin");
    } catch (error) {
      console.error("Failed to restart as admin:", error);
    }
  };

  // Show loading spinner when either loading is true OR admin status is still unknown
  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-600 text-xl">Initializing application...</p>
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

          {/* Add bypass button for users having issues */}
          <Button
            onClick={() => {
              localStorage.setItem('gsx-bypass-admin-check', 'true');
              setIsAdmin(true);
            }}
            variant="outline"
            className="w-full mt-2"
          >
            Continue Anyway (Not Recommended)
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
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