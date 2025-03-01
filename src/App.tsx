import { FolderView } from "./components/FolderView";
import "./css/App.css";
import { CircleCheckBig } from "lucide-react";
import { useAppContext } from "./context/AppContext";
import { Spinner } from "./components/ui/spinner";
import logoSvg from './assets/gsx-manager-logo.svg';
import { ActionBar } from "./components/ActionBar";
import { Toaster } from "sonner";
import Header from "./components/Header";


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
      <Header />
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
