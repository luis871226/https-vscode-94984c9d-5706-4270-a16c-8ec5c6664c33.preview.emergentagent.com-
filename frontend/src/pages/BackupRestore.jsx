import { useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { createBackup, restoreBackup } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { toast } from "sonner";

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const response = await createBackup();
      const backup = response.data;
      
      // Create and download file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `railway-collection-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Backup descargado correctamente");
    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Error al crear el backup");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowRestoreDialog(true);
    }
  };

  const handleRestore = async () => {
    if (!pendingFile) return;
    
    setLoading(true);
    setShowRestoreDialog(false);
    
    try {
      const text = await pendingFile.text();
      const data = JSON.parse(text);
      
      // Validate backup structure
      if (!data.version || !data.locomotives || !data.rolling_stock || !data.decoders || !data.sound_projects) {
        throw new Error("Formato de backup inválido");
      }
      
      const response = await restoreBackup(data);
      setRestoreResult(response.data.restored);
      toast.success("Backup restaurado correctamente");
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error(error.message || "Error al restaurar el backup");
    } finally {
      setLoading(false);
      setPendingFile(null);
    }
  };

  return (
    <div className="animate-fade-in" data-testid="backup-restore-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
          <Database className="w-10 h-10 text-purple-600" />
          Backup y Restauración
        </h1>
        <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
          Guarda y recupera toda tu colección
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        {/* Backup Section */}
        <div className="bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-green-50 flex items-center justify-center">
              <Download className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold uppercase tracking-tight text-slate-800">
                Crear Backup
              </h2>
              <p className="font-mono text-xs text-slate-500 uppercase">
                Descargar copia de seguridad
              </p>
            </div>
          </div>
          
          <p className="font-body text-sm text-slate-600 mb-6">
            Descarga un archivo JSON con toda la información de tu colección: locomotoras, vagones, decodificadores y proyectos de sonido.
          </p>
          
          <Button
            onClick={handleBackup}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="create-backup-btn"
          >
            <Download className="w-4 h-4" />
            {loading ? "Creando backup..." : "Descargar Backup"}
          </Button>
        </div>

        {/* Restore Section */}
        <div className="bg-white border border-slate-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-amber-50 flex items-center justify-center">
              <Upload className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold uppercase tracking-tight text-slate-800">
                Restaurar Backup
              </h2>
              <p className="font-mono text-xs text-slate-500 uppercase">
                Cargar copia de seguridad
              </p>
            </div>
          </div>
          
          <p className="font-body text-sm text-slate-600 mb-4">
            Restaura tu colección desde un archivo de backup previamente guardado.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="font-mono text-xs text-amber-700">
              Atención: Restaurar reemplazará TODOS los datos actuales con los del backup.
            </p>
          </div>
          
          <label className="block">
            <Button
              variant="outline"
              disabled={loading}
              className="w-full font-mono uppercase tracking-widest text-xs gap-2 border-amber-300 hover:bg-amber-50"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
                {loading ? "Restaurando..." : "Seleccionar archivo..."}
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="restore-file-input"
            />
          </label>
        </div>
      </div>

      {/* Restore Result */}
      {restoreResult && (
        <div className="mt-8 max-w-4xl">
          <div className="bg-green-50 border border-green-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-heading text-lg font-semibold uppercase text-green-800">
                Backup Restaurado
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-green-200">
                <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.locomotives}</p>
                <p className="font-mono text-xs uppercase text-green-600">Locomotoras</p>
              </div>
              <div className="bg-white p-4 border border-green-200">
                <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.rolling_stock}</p>
                <p className="font-mono text-xs uppercase text-green-600">Vagones/Coches</p>
              </div>
              <div className="bg-white p-4 border border-green-200">
                <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.decoders}</p>
                <p className="font-mono text-xs uppercase text-green-600">Decodificadores</p>
              </div>
              <div className="bg-white p-4 border border-green-200">
                <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.sound_projects}</p>
                <p className="font-mono text-xs uppercase text-green-600">Proyectos Sonido</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar Restauración
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              ¿Estás seguro de que deseas restaurar este backup? 
              <strong className="block mt-2 text-red-600">
                Todos los datos actuales serán reemplazados por los del archivo de backup.
              </strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="font-mono uppercase tracking-widest text-xs"
              onClick={() => setPendingFile(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-amber-600 hover:bg-amber-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-restore-btn"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackupRestore;
