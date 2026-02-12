import { useState } from "react";
import { Link } from "react-router-dom";
import { FileUp, CheckCircle, AlertTriangle, Train, ArrowLeft, Upload, X, FileText } from "lucide-react";
import { importJMRI } from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const JMRIImport = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const xmlFiles = selectedFiles.filter(f => f.name.endsWith('.xml'));
    
    if (xmlFiles.length === 0) {
      toast.error("Por favor selecciona archivos XML de JMRI");
      return;
    }

    // Read file contents
    const fileData = await Promise.all(
      xmlFiles.map(async (file) => {
        const content = await file.text();
        return {
          name: file.name,
          content: content
        };
      })
    );

    setFiles(fileData);
    setResult(null);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (files.length === 0) {
      toast.error("No hay archivos para importar");
      return;
    }

    setLoading(true);
    try {
      const contents = files.map(f => f.content);
      const response = await importJMRI(contents);
      setResult(response.data);
      
      if (response.data.success) {
        toast.success(`${response.data.imported_count} locomotoras importadas`);
      } else {
        toast.error("No se pudo importar ninguna locomotora");
      }
    } catch (error) {
      console.error("Error importing:", error);
      toast.error("Error al importar archivos JMRI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" data-testid="jmri-import-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/backup">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <FileUp className="w-8 h-8 text-orange-600" />
            Importar desde JMRI
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            Importa tus locomotoras desde archivos XML de JMRI
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
          <h3 className="font-heading text-sm font-semibold uppercase text-blue-800 mb-2">
            ¿Cómo funciona?
          </h3>
          <ul className="font-body text-sm text-blue-700 space-y-1">
            <li>• Los archivos XML de JMRI se encuentran en la carpeta <code className="bg-blue-100 px-1">roster</code></li>
            <li>• Se importará: marca, modelo, matrícula, dirección DCC, decodificador y CVs</li>
            <li>• Puedes seleccionar múltiples archivos a la vez</li>
          </ul>
        </div>

        {/* File Selection */}
        <div className="bg-white border border-slate-200 p-6 mb-6">
          <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4">
            Seleccionar Archivos
          </h2>
          
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-slate-300 p-8 text-center hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <span className="font-mono text-sm text-slate-500 block">
                Haz clic para seleccionar archivos XML
              </span>
              <span className="font-mono text-xs text-slate-400 block mt-1">
                Puedes seleccionar múltiples archivos
              </span>
            </div>
            <input
              type="file"
              accept=".xml"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              data-testid="jmri-file-input"
            />
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="font-mono text-xs uppercase text-slate-500 mb-3">
                Archivos seleccionados ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200"
                    data-testid={`file-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <span className="font-mono text-sm text-slate-700">{file.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Import Button */}
        {files.length > 0 && !result && (
          <Button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 font-mono uppercase tracking-widest text-xs gap-2 py-6"
            data-testid="import-btn"
          >
            <FileUp className="w-5 h-5" />
            {loading ? "Importando..." : `Importar ${files.length} archivo${files.length > 1 ? 's' : ''}`}
          </Button>
        )}

        {/* Results */}
        {result && (
          <div className={`border p-6 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <h3 className={`font-heading text-lg font-semibold uppercase ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? 'Importación Completada' : 'Importación con Errores'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white p-4 border border-green-200">
                <p className="font-mono text-2xl font-bold text-green-700">{result.imported_count}</p>
                <p className="font-mono text-xs uppercase text-green-600">Importadas</p>
              </div>
              <div className="bg-white p-4 border border-amber-200">
                <p className="font-mono text-2xl font-bold text-amber-700">{result.skipped_count}</p>
                <p className="font-mono text-xs uppercase text-amber-600">Omitidas</p>
              </div>
            </div>

            {/* Imported Locomotives */}
            {result.locomotives && result.locomotives.length > 0 && (
              <div className="mb-4">
                <h4 className="font-mono text-xs uppercase text-slate-500 mb-2">Locomotoras importadas:</h4>
                <div className="space-y-2">
                  {result.locomotives.map((loco, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-2 border border-green-200">
                      <Train className="w-4 h-4 text-green-600" />
                      <span className="font-mono text-sm">
                        <strong>{loco.brand}</strong> {loco.model} - DCC: {loco.dcc_address}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h4 className="font-mono text-xs uppercase text-red-500 mb-2">Errores:</h4>
                <div className="space-y-1">
                  {result.errors.map((error, index) => (
                    <p key={index} className="font-mono text-xs text-red-600">{error}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              <Link to="/locomotives" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs gap-2">
                  <Train className="w-4 h-4" />
                  Ver Locomotoras
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([]);
                  setResult(null);
                }}
                className="font-mono uppercase tracking-widest text-xs"
              >
                Importar Más
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JMRIImport;
