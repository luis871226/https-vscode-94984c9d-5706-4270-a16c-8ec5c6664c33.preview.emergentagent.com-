import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Locomotives from "./pages/Locomotives";
import LocomotiveForm from "./pages/LocomotiveForm";
import LocomotiveDetail from "./pages/LocomotiveDetail";
import RollingStock from "./pages/RollingStock";
import RollingStockForm from "./pages/RollingStockForm";
import RollingStockDetail from "./pages/RollingStockDetail";
import Decoders from "./pages/Decoders";
import DecoderForm from "./pages/DecoderForm";
import SoundProjects from "./pages/SoundProjects";
import SoundProjectForm from "./pages/SoundProjectForm";
import BackupRestore from "./pages/BackupRestore";
import JMRIImport from "./pages/JMRIImport";
import "@/App.css";

function App() {
  return (
    <div className="App min-h-screen bg-[#FDFCF8] noise-bg">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="locomotives" element={<Locomotives />} />
            <Route path="locomotives/new" element={<LocomotiveForm />} />
            <Route path="locomotives/:id" element={<LocomotiveDetail />} />
            <Route path="locomotives/:id/edit" element={<LocomotiveForm />} />
            <Route path="rolling-stock" element={<RollingStock />} />
            <Route path="rolling-stock/new" element={<RollingStockForm />} />
            <Route path="rolling-stock/:id" element={<RollingStockDetail />} />
            <Route path="rolling-stock/:id/edit" element={<RollingStockForm />} />
            <Route path="decoders" element={<Decoders />} />
            <Route path="decoders/new" element={<DecoderForm />} />
            <Route path="decoders/:id/edit" element={<DecoderForm />} />
            <Route path="sound-projects" element={<SoundProjects />} />
            <Route path="sound-projects/new" element={<SoundProjectForm />} />
            <Route path="sound-projects/:id/edit" element={<SoundProjectForm />} />
            <Route path="backup" element={<BackupRestore />} />
            <Route path="jmri-import" element={<JMRIImport />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
