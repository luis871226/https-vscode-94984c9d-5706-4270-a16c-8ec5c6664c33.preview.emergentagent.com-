import { useState } from 'react';
import { Link } from 'react-router-dom';
import { importLocomotivesCSV, importRollingStockCSV, getLocomotivesCSVTemplate, getRollingStockCSVTemplate } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { Upload, Download, FileSpreadsheet, Train, TrainTrack, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function CSVImport() {
  const [activeTab, setActiveTab] = useState('locomotives');
  const [csvContent, setCSVContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Error', description: 'Por favor selecciona un archivo CSV', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCSVContent(event.target?.result || '');
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      toast({ title: 'Error', description: 'No hay contenido CSV para importar', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = activeTab === 'locomotives' 
        ? await importLocomotivesCSV(csvContent)
        : await importRollingStockCSV(csvContent);
      
      setResult(response.data);
      
      if (response.data.success) {
        toast({ 
          title: 'Importación completada', 
          description: `${response.data.imported_count} items importados correctamente` 
        });
      } else {
        toast({ 
          title: 'Importación fallida', 
          description: response.data.errors[0] || 'Error desconocido', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al procesar la importación', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setCSVContent('');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="csv-import-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/backup">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-green-600" />
            Importar desde CSV
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1">
            Importa tu colección desde archivos CSV
          </p>
        </div>
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'locomotives' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('locomotives'); clearAll(); }}
          className={activeTab === 'locomotives' ? 'bg-red-600 hover:bg-red-700' : ''}
          data-testid="tab-locomotives"
        >
          <Train className="w-4 h-4 mr-2" />
          Locomotoras
        </Button>
        <Button
          variant={activeTab === 'rolling-stock' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('rolling-stock'); clearAll(); }}
          className={activeTab === 'rolling-stock' ? 'bg-green-600 hover:bg-green-700' : ''}
          data-testid="tab-rolling-stock"
        >
          <TrainTrack className="w-4 h-4 mr-2" />
          Vagones/Coches
        </Button>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle>1. Descargar Plantilla</CardTitle>
          <CardDescription>
            Descarga la plantilla CSV con el formato correcto y ejemplos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a 
            href={activeTab === 'locomotives' ? getLocomotivesCSVTemplate() : getRollingStockCSVTemplate()}
            download
          >
            <Button variant="outline" className="gap-2" data-testid="download-template-btn">
              <Download className="w-4 h-4" />
              Descargar Plantilla {activeTab === 'locomotives' ? 'Locomotoras' : 'Vagones'}
            </Button>
          </a>
          
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="font-mono text-xs text-slate-600 mb-2">Campos requeridos:</p>
            {activeTab === 'locomotives' ? (
              <code className="text-xs text-slate-700">brand, model, reference, dcc_address</code>
            ) : (
              <code className="text-xs text-slate-700">brand, model, reference</code>
            )}
            <p className="font-mono text-xs text-slate-500 mt-2">
              Los demás campos son opcionales.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CSV Input */}
      <Card>
        <CardHeader>
          <CardTitle>2. Cargar Datos CSV</CardTitle>
          <CardDescription>
            Sube un archivo CSV o pega el contenido directamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">Subir archivo CSV</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-2 block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-slate-100 file:text-slate-700
                hover:file:bg-slate-200 cursor-pointer"
              data-testid="file-input"
            />
          </div>

          <div className="text-center text-slate-400">— o —</div>

          {/* Manual Input */}
          <div>
            <Label htmlFor="csv-content">Pegar contenido CSV</Label>
            <Textarea
              id="csv-content"
              value={csvContent}
              onChange={(e) => { setCSVContent(e.target.value); setResult(null); }}
              placeholder={`brand,model,reference${activeTab === 'locomotives' ? ',dcc_address' : ''}\nMarca1,Modelo1,REF001${activeTab === 'locomotives' ? ',3' : ''}\n...`}
              rows={8}
              className="mt-2 font-mono text-sm"
              data-testid="csv-textarea"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={loading || !csvContent.trim()}
              className={activeTab === 'locomotives' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              data-testid="import-btn"
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Importando...' : 'Importar'}
            </Button>
            {csvContent && (
              <Button variant="outline" onClick={clearAll}>
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Resultado de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded">
                <p className="text-2xl font-bold text-green-600">{result.imported_count}</p>
                <p className="text-sm text-green-700">Importados correctamente</p>
              </div>
              <div className="p-4 bg-amber-50 rounded">
                <p className="text-2xl font-bold text-amber-600">{result.skipped_count}</p>
                <p className="text-sm text-amber-700">Omitidos</p>
              </div>
            </div>

            {result.imported_items?.length > 0 && (
              <div className="mb-4">
                <p className="font-semibold mb-2">Items importados:</p>
                <div className="max-h-40 overflow-y-auto">
                  {result.imported_items.map((item, i) => (
                    <div key={i} className="text-sm py-1 border-b">
                      {item.brand} - {item.model} ({item.reference})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors?.length > 0 && (
              <div>
                <p className="font-semibold mb-2 text-red-600">Errores:</p>
                <div className="max-h-40 overflow-y-auto bg-red-50 p-2 rounded">
                  {result.errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-700 py-1">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle>Formato CSV</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTab === 'locomotives' ? (
            <div className="space-y-2 font-mono text-xs">
              <p><strong>Columnas:</strong></p>
              <p>brand, model, reference, locomotive_type, dcc_address, decoder_brand, decoder_model, condition, era, railway_company, purchase_date, price, registration_number, notes</p>
              <p className="mt-2"><strong>Tipos de locomotora:</strong> electrica, diesel, vapor, automotor, alta_velocidad, otro</p>
              <p><strong>Condición:</strong> nuevo, usado, restaurado</p>
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              <p><strong>Columnas:</strong></p>
              <p>brand, model, reference, stock_type, condition, era, railway_company, purchase_date, price, notes</p>
              <p className="mt-2"><strong>Tipos de vagón:</strong> vagon_mercancias, coche_viajeros, furgon, otro</p>
              <p><strong>Condición:</strong> nuevo, usado, restaurado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
