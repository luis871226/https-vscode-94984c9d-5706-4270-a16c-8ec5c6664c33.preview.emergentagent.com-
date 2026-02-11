import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Train, Plus, Search, Filter, Trash2, Edit, Eye } from "lucide-react";
import { getLocomotives, deleteLocomotive } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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

const Locomotives = () => {
  const navigate = useNavigate();
  const [locomotives, setLocomotives] = useState([]);
  const [filteredLocomotives, setFilteredLocomotives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  const fetchLocomotives = async () => {
    try {
      const response = await getLocomotives();
      setLocomotives(response.data);
      setFilteredLocomotives(response.data);
    } catch (error) {
      console.error("Error fetching locomotives:", error);
      toast.error("Error al cargar las locomotoras");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocomotives();
  }, []);

  useEffect(() => {
    let filtered = [...locomotives];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (loco) =>
          loco.brand?.toLowerCase().includes(term) ||
          loco.model?.toLowerCase().includes(term) ||
          loco.reference?.toLowerCase().includes(term) ||
          loco.railway_company?.toLowerCase().includes(term)
      );
    }

    // Brand filter
    if (filterBrand !== "all") {
      filtered = filtered.filter((loco) => loco.brand === filterBrand);
    }

    // Condition filter
    if (filterCondition !== "all") {
      filtered = filtered.filter((loco) => loco.condition === filterCondition);
    }

    setFilteredLocomotives(filtered);
  }, [searchTerm, filterBrand, filterCondition, locomotives]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLocomotive(deleteId);
      toast.success("Locomotora eliminada correctamente");
      fetchLocomotives();
    } catch (error) {
      toast.error("Error al eliminar la locomotora");
    } finally {
      setDeleteId(null);
    }
  };

  const uniqueBrands = [...new Set(locomotives.map((l) => l.brand))].filter(Boolean);

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
    <div className="animate-fade-in" data-testid="locomotives-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Train className="w-10 h-10 text-red-600" />
            Locomotoras
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            {filteredLocomotives.length} de {locomotives.length} locomotoras
          </p>
        </div>
        <Link to="/locomotives/new">
          <Button 
            className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="new-locomotive-btn"
          >
            <Plus className="w-4 h-4" />
            Nueva Locomotora
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="filter-bar flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por marca, modelo, referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono text-sm border-slate-300 rounded-none"
              data-testid="search-input"
            />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger 
              className="w-[160px] font-mono text-xs uppercase rounded-none border-slate-300"
              data-testid="filter-brand"
            >
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {uniqueBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger 
              className="w-[140px] font-mono text-xs uppercase rounded-none border-slate-300"
              data-testid="filter-condition"
            >
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="restaurado">Restaurado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {filteredLocomotives.length > 0 ? (
        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full railway-table">
            <thead>
              <tr>
                <th className="text-left">Foto</th>
                <th className="text-left">Marca / Modelo</th>
                <th className="text-left">Referencia</th>
                <th className="text-center">Dir. DCC</th>
                <th className="text-left">Decodificador</th>
                <th className="text-left">Compañía</th>
                <th className="text-left">Estado</th>
                <th className="text-right">Precio</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocomotives.map((loco) => (
                <tr 
                  key={loco.id} 
                  className="data-row"
                  data-testid={`locomotive-row-${loco.id}`}
                >
                  <td className="w-16">
                    {loco.photo ? (
                      <img
                        src={loco.photo}
                        alt={loco.model}
                        className="w-12 h-12 object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Train className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900">{loco.brand}</span>
                    <br />
                    <span className="text-slate-500 text-xs">{loco.model}</span>
                  </td>
                  <td className="text-slate-600">{loco.reference}</td>
                  <td className="text-center">
                    <span className="bg-slate-100 px-3 py-1 text-xs font-bold">
                      {loco.dcc_address}
                    </span>
                  </td>
                  <td className="text-slate-600 text-xs">
                    {loco.decoder_brand && loco.decoder_model
                      ? `${loco.decoder_brand} ${loco.decoder_model}`
                      : "-"}
                  </td>
                  <td>
                    {loco.railway_company ? (
                      <span className="badge badge-company">{loco.railway_company}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className="flex items-center">
                      <span className={`status-indicator status-${loco.condition}`}></span>
                      <span className="capitalize text-xs">{loco.condition}</span>
                    </span>
                  </td>
                  <td className="text-right text-slate-900">
                    {loco.price ? `€${loco.price.toFixed(2)}` : "-"}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/locomotives/${loco.id}`)}
                        className="h-8 w-8 p-0 hover:bg-slate-100"
                        data-testid={`view-locomotive-${loco.id}`}
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/locomotives/${loco.id}/edit`)}
                        className="h-8 w-8 p-0 hover:bg-blue-50"
                        data-testid={`edit-locomotive-${loco.id}`}
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(loco.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        data-testid={`delete-locomotive-${loco.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-slate-200">
          <div className="empty-state py-20">
            <Train className="w-20 h-20 mx-auto empty-state-icon" />
            <p className="empty-state-text mt-4">
              {searchTerm || filterBrand !== "all" || filterCondition !== "all"
                ? "No se encontraron locomotoras con los filtros aplicados"
                : "No hay locomotoras en la colección"}
            </p>
            {!searchTerm && filterBrand === "all" && filterCondition === "all" && (
              <Link to="/locomotives/new">
                <Button className="mt-6 bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs">
                  Añadir Primera Locomotora
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              ¿Estás seguro de que deseas eliminar esta locomotora? Esta acción no se puede deshacer.
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

export default Locomotives;
