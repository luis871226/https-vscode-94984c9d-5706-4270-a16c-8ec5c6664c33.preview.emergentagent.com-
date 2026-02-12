import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getComposition, createComposition, updateComposition, 
  getLocomotives, getRollingStock 
} from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Save, ArrowLeft, Plus, X, GripVertical, Train, TrainTrack } from 'lucide-react';

export default function CompositionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    service_type: 'pasajeros',
    era: '',
    locomotive_id: '',
    wagons: [],
    notes: '',
  });
  const [locomotives, setLocomotives] = useState([]);
  const [rollingStock, setRollingStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      const [locoRes, stockRes] = await Promise.all([
        getLocomotives(),
        getRollingStock()
      ]);
      setLocomotives(locoRes.data);
      setRollingStock(stockRes.data);

      if (isEditing) {
        const response = await getComposition(id);
        const comp = response.data;
        setFormData({
          name: comp.name || '',
          service_type: comp.service_type || 'pasajeros',
          era: comp.era || '',
          locomotive_id: comp.locomotive_id || '',
          wagons: comp.wagons || [],
          notes: comp.notes || '',
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar datos', variant: 'destructive' });
      navigate('/compositions');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value === 'none' ? '' : value }));
  };

  const addWagon = () => {
    if (rollingStock.length === 0) return;
    const nextPosition = formData.wagons.length + 1;
    setFormData(prev => ({
      ...prev,
      wagons: [...prev.wagons, { wagon_id: '', position: nextPosition }]
    }));
  };

  const updateWagon = (index, wagon_id) => {
    setFormData(prev => ({
      ...prev,
      wagons: prev.wagons.map((w, i) => i === index ? { ...w, wagon_id } : w)
    }));
  };

  const removeWagon = (index) => {
    setFormData(prev => ({
      ...prev,
      wagons: prev.wagons
        .filter((_, i) => i !== index)
        .map((w, i) => ({ ...w, position: i + 1 }))
    }));
  };

  const moveWagon = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.wagons.length) return;
    
    const newWagons = [...formData.wagons];
    [newWagons[index], newWagons[newIndex]] = [newWagons[newIndex], newWagons[index]];
    
    setFormData(prev => ({
      ...prev,
      wagons: newWagons.map((w, i) => ({ ...w, position: i + 1 }))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const data = {
      ...formData,
      locomotive_id: formData.locomotive_id || null,
      era: formData.era || null,
      wagons: formData.wagons.filter(w => w.wagon_id)
    };

    try {
      if (isEditing) {
        await updateComposition(id, data);
        toast({ title: 'Actualizado', description: 'Composición actualizada correctamente' });
      } else {
        await createComposition(data);
        toast({ title: 'Creada', description: 'Composición creada correctamente' });
      }
      navigate('/compositions');
    } catch (error) {
      toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getWagonLabel = (wagon) => {
    if (!wagon) return 'Seleccionar vagón';
    return `${wagon.brand} ${wagon.model} (${wagon.reference})`;
  };

  if (loadingData) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/compositions')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Composición' : 'Nueva Composición'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Composición *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Talgo Pendular Barcelona-Madrid"
                  data-testid="name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Servicio</Label>
                <Select value={formData.service_type} onValueChange={(v) => handleSelectChange('service_type', v)}>
                  <SelectTrigger data-testid="service-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pasajeros">Pasajeros</SelectItem>
                    <SelectItem value="mercancias">Mercancías</SelectItem>
                    <SelectItem value="mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="era">Época</Label>
              <Input
                id="era"
                name="era"
                value={formData.era}
                onChange={handleChange}
                placeholder="Ej: V, VI"
                data-testid="era-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales..."
                rows={2}
                data-testid="notes-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Locomotive Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5" />
              Locomotora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Seleccionar Locomotora</Label>
              <Select 
                value={formData.locomotive_id || 'none'} 
                onValueChange={(v) => handleSelectChange('locomotive_id', v)}
              >
                <SelectTrigger data-testid="locomotive-select">
                  <SelectValue placeholder="Sin locomotora asignada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin locomotora asignada</SelectItem>
                  {locomotives.map((loco) => (
                    <SelectItem key={loco.id} value={loco.id}>
                      {loco.brand} {loco.model} ({loco.reference}) - DCC: {loco.dcc_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locomotives.length === 0 && (
                <p className="text-sm text-slate-500">No hay locomotoras disponibles. Añade una primero.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wagons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrainTrack className="w-5 h-5" />
                Vagones ({formData.wagons.length})
              </span>
              <Button type="button" variant="outline" size="sm" onClick={addWagon} disabled={rollingStock.length === 0}>
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formData.wagons.length === 0 ? (
              <p className="text-center text-slate-500 py-4">
                No hay vagones en esta composición. Pulsa "Añadir" para incluir vagones.
              </p>
            ) : (
              <div className="space-y-2">
                {formData.wagons.map((wagon, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded border"
                    data-testid={`wagon-row-${index}`}
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveWagon(index, -1)}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWagon(index, 1)}
                        disabled={index === formData.wagons.length - 1}
                        className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <span className="font-mono text-sm text-slate-500 w-8">#{wagon.position}</span>
                    <Select 
                      value={wagon.wagon_id || 'none'} 
                      onValueChange={(v) => updateWagon(index, v === 'none' ? '' : v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar vagón" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Seleccionar vagón</SelectItem>
                        {rollingStock.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id}>
                            {stock.brand} {stock.model} ({stock.reference})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWagon(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {rollingStock.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No hay vagones/coches disponibles. Añade material rodante primero.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/compositions')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700" data-testid="save-btn">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
