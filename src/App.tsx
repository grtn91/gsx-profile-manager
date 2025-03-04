import { Toaster } from "sonner";
import "./components/css/App.css"
import Header from './components/layouts/Header';
import { GsxProfilesTable } from './features/profile-table/components/data-table';

function App() {
  return (
    <>
      <Header />
      <div className="bg-black-100">
        <div className="p-10">
          <GsxProfilesTable />
          <Toaster />
        </div>
      </div>
    </>
  );
}

export default App;