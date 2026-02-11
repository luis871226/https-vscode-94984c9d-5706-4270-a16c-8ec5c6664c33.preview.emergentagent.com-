import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TrainTrack, Edit, Trash2, ArrowLeft, Calendar, Euro, Tag, Building } from "lucide-react";
import { getRollingStockItem, deleteRollingStock } from "../lib/api";
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

const stockTypeLabels = {
  vagon_mercancias: "Vagón Mercancías",
  coche_viajeros: "Coche Viajeros",
  furgon: "Furgón",
  otro: "Otro",
};

const RollingStockDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await getRollingStockItem(id);
        setItem(response.data);
      } catch (error) {
        console.error("Error fetching item:", error);
        toast.error("Error al cargar el material rodante");
        navigate("/rolling-stock");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await deleteRollingStock(id);
      toast.success("Material rodante eliminado correctamente");
      navigate("/rolling-stock");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-10 w-64 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="skeleton h-64 w-full"></div>
          <div className="lg:col-span-2 skeleton h-96 w-full"></div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="animate-fade-in" data-testid="rolling-stock-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/rolling-stock">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900">
              {item.brand} {item.model}
            </h1>
            <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
              Ref: {item.reference}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/rolling-stock/${id}/edit`}>
            <Button
              variant="outline"
              className="font-mono uppercase tracking-widest text-xs gap-2 border-slate-300"
              data-testid="edit-stock-btn"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="delete-stock-btn"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Photo Section */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 p-4">
            {item.photo ? (
              <img
                src={item.photo}
                alt={`${item.brand} ${item.model}`}
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <TrainTrack className="w-24 h-24 text-slate-300" />
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white border border-slate-200 mt-6 p-6">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-slate-600 mb-4">
              Información Rápida
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                  <TrainTrack className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500">Tipo</p>
                  <p className="font-mono text-sm text-slate-900">
                    {stockTypeLabels[item.stock_type] || item.stock_type}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500">Estado</p>
                  <p className="flex items-center gap-2">
                    <span className={`status-indicator status-${item.condition}`}></span>
                    <span className="font-mono text-sm capitalize">{item.condition}</span>
                  </p>
                </div>
              </div>

              {item.price && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                    <Euro className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase text-slate-500">Precio</p>
                    <p className="font-mono text-lg font-bold text-slate-900">€{item.price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {item.purchase_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase text-slate-500">Fecha Compra</p>
                    <p className="font-mono text-sm text-slate-900">{item.purchase_date}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                <TrainTrack className="w-5 h-5 text-green-600" />
                Información General
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Marca</p>
                  <p className="font-mono text-sm text-slate-900">{item.brand}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Modelo</p>
                  <p className="font-mono text-sm text-slate-900">{item.model}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Referencia</p>
                  <p className="font-mono text-sm text-slate-900">{item.reference}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Época</p>
                  <p className="font-mono text-sm text-slate-900">{item.era ? `Época ${item.era}` : "-"}</p>
                </div>
              </div>
              
              {item.railway_company && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-mono text-xs uppercase text-slate-500">Compañía Ferroviaria</p>
                      <span className="badge badge-company mt-1">{item.railway_company}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4">
                Notas
              </h2>
              <p className="font-body text-sm text-slate-700 whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{item.brand} {item.model}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono uppercase tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-delete-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RollingStockDetail;
