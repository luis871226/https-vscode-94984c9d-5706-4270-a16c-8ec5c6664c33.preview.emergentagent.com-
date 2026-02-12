import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, deleteWishlistItem, moveWishlistToCollection } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';
import { Plus, Trash2, ShoppingCart, ExternalLink, Edit, Star } from 'lucide-react';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moveDialog, setMoveDialog] = useState({ open: false, item: null });
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasePrice, setPurchasePrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const response = await getWishlist();
      setItems(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar la lista de deseos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este item de la lista de deseos?')) {
      try {
        await deleteWishlistItem(id);
        toast({ title: 'Eliminado', description: 'Item eliminado de la lista de deseos' });
        loadWishlist();
      } catch (error) {
        toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
      }
    }
  };

  const openMoveDialog = (item) => {
    setMoveDialog({ open: true, item });
    setPurchasePrice(item.estimated_price || '');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const handleMoveToCollection = async () => {
    try {
      await moveWishlistToCollection(
        moveDialog.item.id,
        purchaseDate,
        purchasePrice ? parseFloat(purchasePrice) : null
      );
      toast({ title: 'Movido', description: 'Item añadido a tu colección' });
      setMoveDialog({ open: false, item: null });
      loadWishlist();
    } catch (error) {
      toast({ title: 'Error', description: 'Error al mover a la colección', variant: 'destructive' });
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 1: return <Badge className="bg-red-500">Alta</Badge>;
      case 2: return <Badge className="bg-yellow-500">Media</Badge>;
      case 3: return <Badge className="bg-green-500">Baja</Badge>;
      default: return <Badge>-</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'locomotora': return <Badge className="bg-blue-600">Locomotora</Badge>;
      case 'vagon': return <Badge className="bg-green-600">Vagón</Badge>;
      case 'accesorio': return <Badge className="bg-purple-600">Accesorio</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lista de Deseos</h1>
          <p className="text-gray-600 mt-1">
            {items.length} items • Valor estimado: {totalValue.toFixed(2)}€
          </p>
        </div>
        <Button asChild>
          <Link to="/wishlist/new" data-testid="add-wishlist-btn">
            <Plus className="w-4 h-4 mr-2" />
            Añadir Item
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Lista de deseos vacía</h3>
            <p className="text-gray-500 mt-2">Añade los modelos que quieres comprar</p>
            <Button asChild className="mt-4">
              <Link to="/wishlist/new">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Primer Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Precio Est.</TableHead>
                  <TableHead>Tienda</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.sort((a, b) => a.priority - b.priority).map((item) => (
                  <TableRow key={item.id} data-testid={`wishlist-row-${item.id}`}>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>{getTypeBadge(item.item_type)}</TableCell>
                    <TableCell className="font-medium">{item.brand}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell className="font-mono text-sm">{item.reference}</TableCell>
                    <TableCell>
                      {item.estimated_price ? `${item.estimated_price.toFixed(2)}€` : '-'}
                    </TableCell>
                    <TableCell>
                      {item.url ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {item.store || 'Ver'} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        item.store || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMoveDialog(item)}
                        title="Comprado - Mover a colección"
                        data-testid={`move-btn-${item.id}`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/wishlist/${item.id}/edit`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`delete-btn-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Move to Collection Dialog */}
      <Dialog open={moveDialog.open} onOpenChange={(open) => setMoveDialog({ open, item: moveDialog.item })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover a Colección</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              ¿Has comprado <strong>{moveDialog.item?.brand} {moveDialog.item?.model}</strong>?
            </p>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Fecha de compra</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Precio final (€)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                placeholder={moveDialog.item?.estimated_price?.toString() || '0.00'}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialog({ open: false, item: null })}>
              Cancelar
            </Button>
            <Button onClick={handleMoveToCollection} data-testid="confirm-move-btn">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Añadir a Colección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
