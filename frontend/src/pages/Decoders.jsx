import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu, Plus, Search, Trash2, Edit, Volume2, Zap } from "lucide-react";
import { getDecoders, deleteDecoder } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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

const Decoders = () => {
  const navigate = useNavigate();
  const [decoders, setDecoders] = useState([]);
  const [filteredDecoders, setFilteredDecoders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchDecoders = async () => {
    try {
      const response = await getDecoders();
      setDecoders(response.data);
      setFilteredDecoders(response.data);
    } catch (error) {
      console.error("Error fetching decoders:", error);
      toast.error("Error al cargar los decodificadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecoders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = decoders.filter(
        (dec) =>
          dec.brand?.toLowerCase().includes(term) ||
          dec.model?.toLowerCase().includes(term) ||
          dec.type?.toLowerCase().includes(term)
      );
      setFilteredDecoders(filtered);
    } else {
      setFilteredDecoders(decoders);
    }
  }, [searchTerm, decoders]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDecoder(deleteId);
      toast.success("Decodificador eliminado correctamente");
      fetchDecoders();
    } catch (error) {
      toast.error("Error al eliminar el decodificador");
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "sound":
        return <Volume2 className="w-4 h-4 text-amber-500" />;
      case "basic":
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-500" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <div className="skeleton h-10 w-48"></div>
          <div className="skeleton h-10 w-40"></div>
        </div>
        <div className="skeleton h-96 w-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="decoders-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Cpu className="w-10 h-10 text-blue-600" />
            Decodificadores
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            {filteredDecoders.length} decodificadores registrados
          </p>
        </div>
        <Link to="/decoders/new">
          <Button
            className="bg-blue-600 hover:bg-blue-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="new-decoder-btn"
          >
            <Plus className="w-4 h-4" />
            Nuevo Decodificador
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por marca, modelo o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-mono text-sm border-slate-300 rounded-none"
            data-testid="search-decoders"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredDecoders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecoders.map((decoder) => (
            <div
              key={decoder.id}
              className="ticket-card p-6"
              data-testid={`decoder-card-${decoder.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 flex items-center justify-center ${
                    decoder.sound_capable ? "bg-amber-50" : "bg-blue-50"
                  }`}>
                    {decoder.sound_capable ? (
                      <Volume2 className="w-6 h-6 text-amber-600" />
                    ) : (
                      <Cpu className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">
                      {decoder.brand}
                    </h3>
                    <p className="font-mono text-sm text-slate-600">{decoder.model}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/decoders/${decoder.id}/edit`)}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                    data-testid={`edit-decoder-${decoder.id}`}
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(decoder.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50"
                    data-testid={`delete-decoder-${decoder.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Tipo</span>
                  <span className="flex items-center gap-2 font-mono text-sm">
                    {getTypeIcon(decoder.type)}
                    <span className="capitalize">{decoder.type}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Interfaz</span>
                  <span className="font-mono text-sm bg-slate-100 px-2 py-0.5">
                    {decoder.interface}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Escala</span>
                  <span className="font-mono text-sm">{decoder.scale}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Funciones</span>
                  <span className="font-mono text-sm">F0-F{decoder.max_functions}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="font-mono text-xs uppercase text-slate-500">Sonido</span>
                  {decoder.sound_capable ? (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 font-mono text-xs uppercase">
                      Sí
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 font-mono text-xs uppercase">
                      No
                    </span>
                  )}
                </div>
              </div>

              {decoder.notes && (
                <p className="mt-4 pt-4 border-t border-slate-200 font-body text-sm text-slate-600">
                  {decoder.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200">
          <div className="empty-state py-20">
            <Cpu className="w-20 h-20 mx-auto empty-state-icon" />
            <p className="empty-state-text mt-4">
              {searchTerm
                ? "No se encontraron decodificadores con ese criterio"
                : "No hay decodificadores registrados"}
            </p>
            {!searchTerm && (
              <Link to="/decoders/new">
                <Button className="mt-6 bg-blue-600 hover:bg-blue-700 font-mono uppercase tracking-widest text-xs">
                  Añadir Primer Decodificador
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              ¿Estás seguro de que deseas eliminar este decodificador? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono uppercase tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-delete-decoder-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Decoders;
