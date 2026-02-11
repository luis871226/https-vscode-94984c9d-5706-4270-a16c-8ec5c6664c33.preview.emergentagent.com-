import { useState, useEffect } from "react";
import { Download, Upload, AlertTriangle, CheckCircle, Database, Clock, Settings, Trash2, Bell, BellOff } from "lucide-react";
import { createBackup, restoreBackup, getBackupHistory, clearBackupHistory, getBackupSettings, saveBackupSettings } from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
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
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [restoreResult, setRestoreResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [settings, setSettings] = useState({
    reminder_enabled: false,
    reminder_frequency: "weekly",
    last_reminder_shown: null
  });

  useEffect(() => {
    fetchHistory();
    fetchSettings();
    checkReminder();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getBackupHistory();
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await getBackupSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const checkReminder = () => {
    // Check localStorage for last backup reminder
    const lastBackup = localStorage.getItem('lastBackupDate');
    const reminderEnabled = localStorage.getItem('backupReminderEnabled') === 'true';
    const frequency = localStorage.getItem('backupReminderFrequency') || 'weekly';
    
    if (reminderEnabled && lastBackup) {
      const lastDate = new Date(lastBackup);
      const now = new Date();
      const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      
      let shouldRemind = false;
      if (frequency === 'daily' && diffDays >= 1) shouldRemind = true;
      if (frequency === 'weekly' && diffDays >= 7) shouldRemind = true;
      if (frequency === 'monthly' && diffDays >= 30) shouldRemind = true;
      
      if (shouldRemind) {
        toast.warning(
          `Han pasado ${diffDays} días desde tu último backup. ¡Es hora de hacer uno nuevo!`,
          { duration: 10000 }
        );
      }
    }
  };

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
      
      // Update localStorage for reminder
      localStorage.setItem('lastBackupDate', new Date().toISOString());
      
      toast.success("Backup descargado correctamente");
      fetchHistory(); // Refresh history
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
    // Reset input
    e.target.value = '';
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
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast.error(error.message || "Error al restaurar el backup");
    } finally {
      setLoading(false);
      setPendingFile(null);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearBackupHistory();
      setHistory([]);
      toast.success("Historial eliminado");
    } catch (error) {
      toast.error("Error al eliminar el historial");
    } finally {
      setShowClearHistoryDialog(false);
    }
  };

  const handleSettingsChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage for client-side reminder
    if (key === 'reminder_enabled') {
      localStorage.setItem('backupReminderEnabled', value.toString());
    }
    if (key === 'reminder_frequency') {
      localStorage.setItem('backupReminderFrequency', value);
    }
    
    try {
      await saveBackupSettings(newSettings);
      toast.success("Configuración guardada");
    } catch (error) {
      toast.error("Error al guardar configuración");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays === 1) return `Hace 1 día`;
    return `Hace ${diffDays} días`;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup Section */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-50 flex items-center justify-center">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800">
                    Crear Backup
                  </h2>
                  <p className="font-mono text-xs text-slate-500 uppercase">
                    Descargar copia
                  </p>
                </div>
              </div>
              
              <p className="font-body text-sm text-slate-600 mb-4">
                Descarga un archivo JSON con toda tu colección.
              </p>
              
              <Button
                onClick={handleBackup}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs gap-2"
                data-testid="create-backup-btn"
              >
                <Download className="w-4 h-4" />
                {loading ? "Creando..." : "Descargar Backup"}
              </Button>
            </div>

            {/* Restore Section */}
            <div className="bg-white border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-amber-50 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800">
                    Restaurar
                  </h2>
                  <p className="font-mono text-xs text-slate-500 uppercase">
                    Cargar backup
                  </p>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-2 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="font-mono text-[10px] text-amber-700">
                  Reemplazará todos los datos actuales
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
                    {loading ? "Restaurando..." : "Seleccionar archivo"}
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

          {/* Reminder Settings */}
          <div className="bg-white border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-50 flex items-center justify-center">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800">
                  Recordatorio de Backup
                </h2>
                <p className="font-mono text-xs text-slate-500 uppercase">
                  Configura alertas automáticas
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.reminder_enabled}
                  onCheckedChange={(checked) => handleSettingsChange('reminder_enabled', checked)}
                  data-testid="reminder-switch"
                />
                <div className="flex items-center gap-2">
                  {settings.reminder_enabled ? (
                    <Bell className="w-4 h-4 text-blue-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="font-mono text-sm">
                    {settings.reminder_enabled ? "Activado" : "Desactivado"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase text-slate-500">Frecuencia:</span>
                <Select
                  value={settings.reminder_frequency}
                  onValueChange={(value) => handleSettingsChange('reminder_frequency', value)}
                  disabled={!settings.reminder_enabled}
                >
                  <SelectTrigger 
                    className="w-[140px] font-mono text-xs uppercase rounded-none border-slate-300"
                    data-testid="reminder-frequency"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {settings.reminder_enabled && (
              <p className="font-mono text-xs text-slate-500 mt-4">
                Recibirás un recordatorio {
                  settings.reminder_frequency === 'daily' ? 'cada día' :
                  settings.reminder_frequency === 'weekly' ? 'cada semana' :
                  'cada mes'
                } si no has hecho backup.
              </p>
            )}
          </div>

          {/* Restore Result */}
          {restoreResult && (
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
                  <p className="font-mono text-xs uppercase text-green-600">Vagones</p>
                </div>
                <div className="bg-white p-4 border border-green-200">
                  <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.decoders}</p>
                  <p className="font-mono text-xs uppercase text-green-600">Decodificadores</p>
                </div>
                <div className="bg-white p-4 border border-green-200">
                  <p className="font-mono text-2xl font-bold text-green-700">{restoreResult.sound_projects}</p>
                  <p className="font-mono text-xs uppercase text-green-600">Sonidos</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - History */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <h2 className="font-heading text-sm font-semibold uppercase tracking-tight text-slate-800">
                  Historial
                </h2>
              </div>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearHistoryDialog(true)}
                  className="h-8 w-8 p-0 hover:bg-red-50"
                  data-testid="clear-history-btn"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>
            
            <div className="max-h-[500px] overflow-y-auto">
              {historyLoading ? (
                <div className="p-4">
                  <div className="skeleton h-16 w-full mb-2"></div>
                  <div className="skeleton h-16 w-full mb-2"></div>
                  <div className="skeleton h-16 w-full"></div>
                </div>
              ) : history.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {history.map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className={`p-4 ${index === 0 ? 'bg-purple-50' : ''}`}
                      data-testid={`history-entry-${entry.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-mono text-xs uppercase px-2 py-0.5 ${
                          entry.type === 'manual' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {entry.type === 'manual' ? 'Backup' : 'Restauración'}
                        </span>
                        {index === 0 && (
                          <span className="font-mono text-[10px] text-purple-600 uppercase">
                            Último
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-slate-600 mb-1">
                        {formatDate(entry.created_at)}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400">
                        {getTimeSince(entry.created_at)}
                      </p>
                      <div className="flex gap-2 mt-2 text-[10px] font-mono text-slate-500">
                        <span>{entry.locomotives_count} loc</span>
                        <span>•</span>
                        <span>{entry.rolling_stock_count} vag</span>
                        <span>•</span>
                        <span>{entry.decoders_count} dec</span>
                        <span>•</span>
                        <span>{entry.sound_projects_count} son</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <p className="font-mono text-xs text-slate-400 uppercase">
                    Sin historial
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 mt-1">
                    Haz tu primer backup
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                Todos los datos actuales serán reemplazados.
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

      {/* Confirm Clear History Dialog */}
      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">
              Eliminar Historial
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              ¿Estás seguro de que deseas eliminar todo el historial de backups?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono uppercase tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearHistory}
              className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-clear-history-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BackupRestore;
