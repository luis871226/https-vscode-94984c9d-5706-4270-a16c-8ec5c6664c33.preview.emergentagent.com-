import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Train, Edit, Trash2, ArrowLeft, Calendar, Euro, Tag, Cpu, Volume2, Hash, Building, FileDown } from "lucide-react";
import { getLocomotive, deleteLocomotive, exportLocomotivePDF } from "../lib/api";
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

const LocomotiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [locomotive, setLocomotive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchLocomotive = async () => {
      try {
        const response = await getLocomotive(id);
        setLocomotive(response.data);
      } catch (error) {
        console.error("Error fetching locomotive:", error);
        toast.error("Error al cargar la locomotora");
        navigate("/locomotives");
      } finally {
        setLoading(false);
      }
    };
    fetchLocomotive();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await deleteLocomotive(id);
      toast.success("Locomotora eliminada correctamente");
      navigate("/locomotives");
    } catch (error) {
      toast.error("Error al eliminar la locomotora");
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

  if (!locomotive) return null;

  return (
    <div className="animate-fade-in" data-testid="locomotive-detail">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link to="/locomotives">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900">
              {locomotive.brand} {locomotive.model}
            </h1>
            <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
              Ref: {locomotive.reference}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a href={exportLocomotivePDF(id)} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="font-mono uppercase tracking-widest text-xs gap-2 border-slate-300"
              data-testid="export-pdf-btn"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </Button>
          </a>
          <Link to={`/locomotives/${id}/edit`}>
            <Button
              variant="outline"
              className="font-mono uppercase tracking-widest text-xs gap-2 border-slate-300"
              data-testid="edit-locomotive-btn"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="delete-locomotive-btn"
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
            {locomotive.photo ? (
              <img
                src={locomotive.photo}
                alt={`${locomotive.brand} ${locomotive.model}`}
                className="w-full h-auto"
              />
            ) : (
              <div className="aspect-square bg-slate-100 flex items-center justify-center">
                <Train className="w-24 h-24 text-slate-300" />
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
                <div className="w-10 h-10 bg-red-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500">Dir. DCC</p>
                  <p className="font-mono text-lg font-bold text-slate-900">{locomotive.dcc_address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500">Estado</p>
                  <p className="flex items-center gap-2">
                    <span className={`status-indicator status-${locomotive.condition}`}></span>
                    <span className="font-mono text-sm capitalize">{locomotive.condition}</span>
                  </p>
                </div>
              </div>

              {locomotive.price && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                    <Euro className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase text-slate-500">Precio</p>
                    <p className="font-mono text-lg font-bold text-slate-900">€{locomotive.price.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {locomotive.purchase_date && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase text-slate-500">Fecha Compra</p>
                    <p className="font-mono text-sm text-slate-900">{locomotive.purchase_date}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prototipo Info */}
          {(locomotive.paint_scheme || locomotive.registration_number || locomotive.prototype_type) && (
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                  <Train className="w-5 h-5 text-red-600" />
                  Prototipo
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {locomotive.paint_scheme && (
                    <div>
                      <p className="font-mono text-xs uppercase text-slate-500 mb-1">Esquema de Pintura</p>
                      <p className="font-mono text-sm text-slate-900">{locomotive.paint_scheme}</p>
                    </div>
                  )}
                  {locomotive.registration_number && (
                    <div>
                      <p className="font-mono text-xs uppercase text-slate-500 mb-1">Matrícula / Número</p>
                      <p className="font-mono text-sm font-bold text-slate-900">{locomotive.registration_number}</p>
                    </div>
                  )}
                  {locomotive.prototype_type && (
                    <div>
                      <p className="font-mono text-xs uppercase text-slate-500 mb-1">Tipo Prototipo</p>
                      <p className="font-mono text-sm text-slate-900">{locomotive.prototype_type}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Technical Info */}
          <div className="bg-white border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                Información Técnica DCC
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Marca Deco</p>
                  <p className="font-mono text-sm text-slate-900">{locomotive.decoder_brand || "-"}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Modelo Deco</p>
                  <p className="font-mono text-sm text-slate-900">{locomotive.decoder_model || "-"}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Proyecto Sonido</p>
                  <p className="font-mono text-sm text-slate-900">{locomotive.sound_project || "-"}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-slate-500 mb-1">Época</p>
                  <p className="font-mono text-sm text-slate-900">{locomotive.era ? `Época ${locomotive.era}` : "-"}</p>
                </div>
              </div>
              
              {locomotive.railway_company && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-mono text-xs uppercase text-slate-500">Compañía Ferroviaria</p>
                      <span className="badge badge-company mt-1">{locomotive.railway_company}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Functions */}
          {locomotive.functions && locomotive.functions.length > 0 && (
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-amber-600" />
                  Funciones Programadas ({locomotive.functions.length})
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {locomotive.functions.map((func, index) => (
                    <div
                      key={index}
                      className={`function-item ${func.is_sound ? "sound" : ""}`}
                      data-testid={`function-${func.function_number}`}
                    >
                      <p className="font-mono text-xs font-bold text-slate-700">{func.function_number}</p>
                      <p className="font-mono text-[10px] text-slate-500 mt-1 truncate" title={func.description}>
                        {func.description}
                      </p>
                      {func.is_sound && (
                        <Volume2 className="w-3 h-3 text-amber-500 mx-auto mt-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CV Modifications */}
          {locomotive.cv_modifications && locomotive.cv_modifications.length > 0 && (
            <div className="bg-white border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800">
                  Modificaciones de CV ({locomotive.cv_modifications.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full cv-table">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left">CV</th>
                      <th className="text-left">Valor</th>
                      <th className="text-left">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locomotive.cv_modifications.map((cv, index) => (
                      <tr key={index} data-testid={`cv-${cv.cv_number}`}>
                        <td className="font-bold">CV{cv.cv_number}</td>
                        <td>{cv.value}</td>
                        <td className="text-slate-600">{cv.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {locomotive.notes && (
            <div className="bg-white border border-slate-200 p-6">
              <h2 className="font-heading text-lg font-semibold uppercase tracking-tight text-slate-800 mb-4">
                Notas
              </h2>
              <p className="font-body text-sm text-slate-700 whitespace-pre-wrap">
                {locomotive.notes}
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
              ¿Estás seguro de que deseas eliminar la locomotora{" "}
              <strong>{locomotive.brand} {locomotive.model}</strong>? Esta acción no se puede deshacer.
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

export default LocomotiveDetail;
