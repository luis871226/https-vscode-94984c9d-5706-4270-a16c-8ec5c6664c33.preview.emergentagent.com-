import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCompositions, deleteComposition, duplicateComposition } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { Plus, Trash2, Edit, Eye, Train, TrainTrack, Layers, Copy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export default function Compositions() {
  const [compositions, setCompositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadCompositions();
  }, []);

  const loadCompositions = async () => {
    try {
      const response = await getCompositions();
      setCompositions(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Error al cargar las composiciones', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteComposition(deleteId);
      toast({ title: 'Eliminada', description: 'Composición eliminada correctamente' });
      loadCompositions();
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (id, name) => {
    try {
      const response = await duplicateComposition(id);
      toast({ 
        title: 'Duplicada', 
        description: `Se ha creado "${response.data.new_name}"` 
      });
      loadCompositions();
    } catch (error) {
      toast({ title: 'Error', description: 'Error al duplicar', variant: 'destructive' });
    }
  };

  const getServiceBadge = (type) => {
    switch (type) {
      case 'pasajeros': return <Badge className="bg-blue-600">Pasajeros</Badge>;
      case 'mercancias': return <Badge className="bg-amber-600">Mercancías</Badge>;
      case 'mixto': return <Badge className="bg-purple-600">Mixto</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <div className="animate-fade-in" data-testid="compositions-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Layers className="w-10 h-10 text-purple-600" />
            Composiciones
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            {compositions.length} composiciones de trenes
          </p>
        </div>
        <Link to="/compositions/new">
          <Button 
            className="bg-purple-600 hover:bg-purple-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="new-composition-btn"
          >
            <Plus className="w-4 h-4" />
            Nueva Composición
          </Button>
        </Link>
      </div>

      {compositions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Sin composiciones</h3>
            <p className="text-slate-500 mt-2">Crea tu primera composición de tren</p>
            <Button asChild className="mt-4 bg-purple-600 hover:bg-purple-700">
              <Link to="/compositions/new">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Composición
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {compositions.map((comp) => (
            <Card key={comp.id} className="hover:shadow-lg transition-shadow" data-testid={`composition-${comp.id}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-slate-900">{comp.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getServiceBadge(comp.service_type)}
                      {comp.era && <Badge variant="outline">Época {comp.era}</Badge>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Train className="w-4 h-4" />
                    <span>{comp.locomotive_id ? '1' : '0'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrainTrack className="w-4 h-4" />
                    <span>{comp.wagons?.length || 0} vagones</span>
                  </div>
                </div>

                {comp.notes && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{comp.notes}</p>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/compositions/${comp.id}`)}
                    data-testid={`view-composition-${comp.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(comp.id, comp.name)}
                    className="text-purple-600 hover:text-purple-700"
                    data-testid={`duplicate-composition-${comp.id}`}
                    title="Duplicar composición"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/compositions/${comp.id}/edit`)}
                    data-testid={`edit-composition-${comp.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(comp.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`delete-composition-${comp.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar esta composición? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
