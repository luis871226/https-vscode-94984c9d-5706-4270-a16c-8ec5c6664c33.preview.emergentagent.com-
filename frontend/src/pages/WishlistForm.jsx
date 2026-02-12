import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWishlistItem, createWishlistItem, updateWishlistItem } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Save, ArrowLeft } from 'lucide-react';

export default function WishlistForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    item_type: 'locomotora',
    brand: '',
    model: '',
    reference: '',
    estimated_price: '',
    priority: '2',
    store: '',
    url: '',
    notes: '',
    image_url: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    try {
      const response = await getWishlistItem(id);
      const item = response.data;
      setFormData({
        item_type: item.item_type || 'locomotora',
        brand: item.brand || '',
        model: item.model || '',
        reference: item.reference || '',
        estimated_price: item.estimated_price?.toString() || '',
        priority: item.priority?.toString() || '2',
        store: item.store || '',
        url: item.url || '',
        notes: item.notes || '',
        image_url: item.image_url || '',
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar el item', variant: 'destructive' });
      navigate('/wishlist');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      estimated_price: formData.estimated_price ? parseFloat(formData.estimated_price) : null,
      priority: parseInt(formData.priority),
    };

    try {
      if (isEditing) {
        await updateWishlistItem(id, data);
        toast({ title: 'Actualizado', description: 'Item actualizado correctamente' });
      } else {
        await createWishlistItem(data);
        toast({ title: 'Creado', description: 'Item añadido a la lista de deseos' });
      }
      navigate('/wishlist');
    } catch (error) {
      toast({ title: 'Error', description: 'Error al guardar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/wishlist')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Item' : 'Nuevo Item de Deseos'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_type">Tipo</Label>
                <Select value={formData.item_type} onValueChange={(v) => handleSelectChange('item_type', v)}>
                  <SelectTrigger data-testid="item-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="locomotora">Locomotora</SelectItem>
                    <SelectItem value="vagon">Vagón / Coche</SelectItem>
                    <SelectItem value="accesorio">Accesorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={formData.priority} onValueChange={(v) => handleSelectChange('priority', v)}>
                  <SelectTrigger data-testid="priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Alta</SelectItem>
                    <SelectItem value="2">Media</SelectItem>
                    <SelectItem value="3">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Brand and Model */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Roco, Arnold, Electrotren..."
                  data-testid="brand-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Serie 252, 319..."
                  data-testid="model-input"
                />
              </div>
            </div>

            {/* Row 3: Reference and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">Referencia</Label>
                <Input
                  id="reference"
                  name="reference"
                  value={formData.reference}
                  onChange={handleChange}
                  placeholder="Ej: 73692, HN2351..."
                  data-testid="reference-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_price">Precio Estimado (€)</Label>
                <Input
                  id="estimated_price"
                  name="estimated_price"
                  type="number"
                  step="0.01"
                  value={formData.estimated_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  data-testid="price-input"
                />
              </div>
            </div>

            {/* Row 4: Store and URL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="store">Tienda</Label>
                <Input
                  id="store"
                  name="store"
                  value={formData.store}
                  onChange={handleChange}
                  placeholder="Ej: Zaratren, Mabar..."
                  data-testid="store-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL del Producto</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://..."
                  data-testid="url-input"
                />
              </div>
            </div>

            {/* Row 5: Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
                data-testid="image-url-input"
              />
            </div>

            {/* Row 6: Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales sobre este item..."
                rows={3}
                data-testid="notes-input"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/wishlist')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} data-testid="save-btn">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
