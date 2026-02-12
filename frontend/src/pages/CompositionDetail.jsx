import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getComposition, deleteComposition, duplicateComposition } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Edit, Trash2, Train, TrainTrack, Layers, Copy } from 'lucide-react';
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

export default function CompositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [composition, setComposition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadComposition();
  }, [id]);

  const loadComposition = async () => {
    try {
      const response = await getComposition(id);
      setComposition(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Composición no encontrada', variant: 'destructive' });
      navigate('/compositions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComposition(id);
      toast({ title: 'Eliminada', description: 'Composición eliminada correctamente' });
      navigate('/compositions');
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await duplicateComposition(id);
      toast({ 
        title: 'Duplicada', 
        description: `Se ha creado "${response.data.new_name}"` 
      });
      navigate(`/compositions/${response.data.new_id}`);
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

  if (!composition) return null;

  const locomotive = composition.locomotive_details;
  const wagons = composition.wagons_details || [];

  return (
    <div className="animate-fade-in space-y-6" data-testid="composition-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link to="/compositions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-8 h-8 text-purple-600" />
              {composition.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {getServiceBadge(composition.service_type)}
              {composition.era && <Badge variant="outline">Época {composition.era}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDuplicate}
            className="gap-2"
            data-testid="duplicate-btn"
          >
            <Copy className="w-4 h-4" />
            Duplicar
          </Button>
          <Link to={`/compositions/${id}/edit`}>
            <Button variant="outline" className="gap-2" data-testid="edit-btn">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
            className="gap-2"
            data-testid="delete-btn"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Visual Representation */}
      <Card>
        <CardHeader>
          <CardTitle>Representación Visual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {/* Locomotive */}
            {locomotive ? (
              <Link 
                to={`/locomotives/${locomotive.id}`}
                className="flex-shrink-0 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:border-red-400 transition-colors min-w-[140px]"
              >
                <Train className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-bold text-sm text-center">{locomotive.brand}</p>
                <p className="text-xs text-slate-600 text-center">{locomotive.model}</p>
                <p className="text-xs text-slate-400 text-center mt-1">DCC: {locomotive.dcc_address}</p>
              </Link>
            ) : (
              <div className="flex-shrink-0 p-4 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg min-w-[140px]">
                <Train className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400 text-center">Sin locomotora</p>
              </div>
            )}

            {/* Connection line */}
            {wagons.length > 0 && <div className="w-8 h-1 bg-slate-300 flex-shrink-0"></div>}

            {/* Wagons */}
            {wagons.map((wagon, index) => (
              <div key={wagon.id} className="flex items-center gap-2">
                <Link
                  to={`/rolling-stock/${wagon.id}`}
                  className="flex-shrink-0 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:border-green-400 transition-colors min-w-[130px]"
                >
                  <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {wagon.position}
                  </div>
                  <TrainTrack className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-bold text-sm text-center">{wagon.brand}</p>
                  <p className="text-xs text-slate-600 text-center truncate">{wagon.model}</p>
                </Link>
                {index < wagons.length - 1 && <div className="w-4 h-1 bg-slate-300 flex-shrink-0"></div>}
              </div>
            ))}

            {wagons.length === 0 && !locomotive && (
              <p className="text-slate-500 py-8">Esta composición está vacía</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Locomotive Details */}
      {locomotive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Train className="w-5 h-5 text-red-600" />
              Locomotora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Marca</p>
                <p className="font-semibold">{locomotive.brand}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Modelo</p>
                <p className="font-semibold">{locomotive.model}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Referencia</p>
                <p className="font-mono">{locomotive.reference}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Dirección DCC</p>
                <p className="font-mono font-bold">{locomotive.dcc_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wagons List */}
      {wagons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrainTrack className="w-5 h-5 text-green-600" />
              Vagones/Coches ({wagons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-xs uppercase text-slate-500">Pos.</th>
                    <th className="text-left py-2 px-2 text-xs uppercase text-slate-500">Marca</th>
                    <th className="text-left py-2 px-2 text-xs uppercase text-slate-500">Modelo</th>
                    <th className="text-left py-2 px-2 text-xs uppercase text-slate-500">Referencia</th>
                    <th className="text-left py-2 px-2 text-xs uppercase text-slate-500">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {wagons.map((wagon) => (
                    <tr key={wagon.id} className="border-b hover:bg-slate-50">
                      <td className="py-2 px-2">
                        <span className="bg-purple-100 text-purple-700 font-mono text-sm px-2 py-1 rounded">
                          #{wagon.position}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-semibold">{wagon.brand}</td>
                      <td className="py-2 px-2">{wagon.model}</td>
                      <td className="py-2 px-2 font-mono text-sm">{wagon.reference}</td>
                      <td className="py-2 px-2">
                        <Badge variant="outline">{wagon.stock_type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {composition.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{composition.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la composición "{composition.name}"? Esta acción no se puede deshacer.
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
