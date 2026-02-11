import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrainTrack, Plus, Search, Filter, Trash2, Edit, Eye } from "lucide-react";
import { getRollingStock, deleteRollingStock } from "../lib/api";
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

const stockTypeLabels = {
  vagon_mercancias: "Vagón Mercancías",
  coche_viajeros: "Coche Viajeros",
  furgon: "Furgón",
  otro: "Otro",
};

const RollingStock = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  const fetchStock = async () => {
    try {
      const response = await getRollingStock();
      setStock(response.data);
      setFilteredStock(response.data);
    } catch (error) {
      console.error("Error fetching rolling stock:", error);
      toast.error("Error al cargar los vagones/coches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    let filtered = [...stock];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.brand?.toLowerCase().includes(term) ||
          item.model?.toLowerCase().includes(term) ||
          item.reference?.toLowerCase().includes(term) ||
          item.railway_company?.toLowerCase().includes(term)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((item) => item.stock_type === filterType);
    }

    if (filterCondition !== "all") {
      filtered = filtered.filter((item) => item.condition === filterCondition);
    }

    setFilteredStock(filtered);
  }, [searchTerm, filterType, filterCondition, stock]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteRollingStock(deleteId);
      toast.success("Material rodante eliminado correctamente");
      fetchStock();
    } catch (error) {
      toast.error("Error al eliminar");
    } finally {
      setDeleteId(null);
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
    <div className="animate-fade-in" data-testid="rolling-stock-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <TrainTrack className="w-10 h-10 text-green-600" />
            Vagones y Coches
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            {filteredStock.length} de {stock.length} unidades
          </p>
        </div>
        <Link to="/rolling-stock/new">
          <Button 
            className="bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="new-rolling-stock-btn"
          >
            <Plus className="w-4 h-4" />
            Nuevo Vagón/Coche
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
              data-testid="search-rolling-stock"
            />
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger 
              className="w-[180px] font-mono text-xs uppercase rounded-none border-slate-300"
              data-testid="filter-type"
            >
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="vagon_mercancias">Vagón Mercancías</SelectItem>
              <SelectItem value="coche_viajeros">Coche Viajeros</SelectItem>
              <SelectItem value="furgon">Furgón</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
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
      {filteredStock.length > 0 ? (
        <div className="bg-white border border-slate-200 overflow-x-auto">
          <table className="w-full railway-table">
            <thead>
              <tr>
                <th className="text-left">Foto</th>
                <th className="text-left">Marca / Modelo</th>
                <th className="text-left">Referencia</th>
                <th className="text-left">Tipo</th>
                <th className="text-left">Compañía</th>
                <th className="text-left">Época</th>
                <th className="text-left">Estado</th>
                <th className="text-right">Precio</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr 
                  key={item.id} 
                  className="data-row"
                  data-testid={`rolling-stock-row-${item.id}`}
                >
                  <td className="w-16">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.model}
                        className="w-12 h-12 object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 flex items-center justify-center border border-slate-200">
                        <TrainTrack className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900">{item.brand}</span>
                    <br />
                    <span className="text-slate-500 text-xs">{item.model}</span>
                  </td>
                  <td className="text-slate-600">{item.reference}</td>
                  <td>
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 text-xs uppercase font-mono">
                      {stockTypeLabels[item.stock_type] || item.stock_type}
                    </span>
                  </td>
                  <td>
                    {item.railway_company ? (
                      <span className="badge badge-company">{item.railway_company}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-slate-600 text-xs">
                    {item.era ? `Época ${item.era}` : "-"}
                  </td>
                  <td>
                    <span className="flex items-center">
                      <span className={`status-indicator status-${item.condition}`}></span>
                      <span className="capitalize text-xs">{item.condition}</span>
                    </span>
                  </td>
                  <td className="text-right text-slate-900">
                    {item.price ? `€${item.price.toFixed(2)}` : "-"}
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/rolling-stock/${item.id}`)}
                        className="h-8 w-8 p-0 hover:bg-slate-100"
                        data-testid={`view-stock-${item.id}`}
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/rolling-stock/${item.id}/edit`)}
                        className="h-8 w-8 p-0 hover:bg-green-50"
                        data-testid={`edit-stock-${item.id}`}
                      >
                        <Edit className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(item.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50"
                        data-testid={`delete-stock-${item.id}`}
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
            <TrainTrack className="w-20 h-20 mx-auto empty-state-icon" />
            <p className="empty-state-text mt-4">
              {searchTerm || filterType !== "all" || filterCondition !== "all"
                ? "No se encontraron resultados con los filtros aplicados"
                : "No hay vagones ni coches en la colección"}
            </p>
            {!searchTerm && filterType === "all" && filterCondition === "all" && (
              <Link to="/rolling-stock/new">
                <Button className="mt-6 bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs">
                  Añadir Primer Vagón/Coche
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
              ¿Estás seguro de que deseas eliminar este material rodante? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono uppercase tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-delete-stock-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RollingStock;
