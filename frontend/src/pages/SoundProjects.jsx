import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Volume2, Plus, Search, Trash2, Edit, Music } from "lucide-react";
import { getSoundProjects, deleteSoundProject } from "../lib/api";
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

const SoundProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchProjects = async () => {
    try {
      const response = await getSoundProjects();
      setProjects(response.data);
      setFilteredProjects(response.data);
    } catch (error) {
      console.error("Error fetching sound projects:", error);
      toast.error("Error al cargar los proyectos de sonido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = projects.filter(
        (proj) =>
          proj.name?.toLowerCase().includes(term) ||
          proj.decoder_brand?.toLowerCase().includes(term) ||
          proj.locomotive_type?.toLowerCase().includes(term)
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchTerm, projects]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSoundProject(deleteId);
      toast.success("Proyecto de sonido eliminado correctamente");
      fetchProjects();
    } catch (error) {
      toast.error("Error al eliminar el proyecto de sonido");
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
    <div className="animate-fade-in" data-testid="sound-projects-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Volume2 className="w-10 h-10 text-amber-600" />
            Proyectos de Sonido
          </h1>
          <p className="font-mono text-sm text-slate-500 mt-1 uppercase tracking-wider">
            {filteredProjects.length} proyectos registrados
          </p>
        </div>
        <Link to="/sound-projects/new">
          <Button
            className="bg-amber-600 hover:bg-amber-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="new-sound-project-btn"
          >
            <Plus className="w-4 h-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, marca o tipo de locomotora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 font-mono text-sm border-slate-300 rounded-none"
            data-testid="search-sound-projects"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="ticket-card p-6"
              data-testid={`sound-project-card-${project.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 flex items-center justify-center">
                    <Music className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-slate-900">
                      {project.name}
                    </h3>
                    {project.version && (
                      <p className="font-mono text-xs text-slate-500">v{project.version}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/sound-projects/${project.id}/edit`)}
                    className="h-8 w-8 p-0 hover:bg-amber-50"
                    data-testid={`edit-sound-project-${project.id}`}
                  >
                    <Edit className="w-4 h-4 text-amber-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(project.id)}
                    className="h-8 w-8 p-0 hover:bg-red-50"
                    data-testid={`delete-sound-project-${project.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Decodificador</span>
                  <span className="font-mono text-sm">
                    {project.decoder_brand} {project.decoder_model}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="font-mono text-xs uppercase text-slate-500">Locomotora</span>
                  <span className="font-mono text-sm">{project.locomotive_type}</span>
                </div>
                {project.sounds && project.sounds.length > 0 && (
                  <div className="py-2">
                    <span className="font-mono text-xs uppercase text-slate-500 block mb-2">
                      Sonidos ({project.sounds.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {project.sounds.slice(0, 5).map((sound, index) => (
                        <span
                          key={index}
                          className="bg-amber-50 text-amber-700 px-2 py-0.5 font-mono text-[10px] uppercase"
                        >
                          {sound}
                        </span>
                      ))}
                      {project.sounds.length > 5 && (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 font-mono text-[10px]">
                          +{project.sounds.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {project.notes && (
                <p className="mt-4 pt-4 border-t border-slate-200 font-body text-sm text-slate-600 line-clamp-2">
                  {project.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200">
          <div className="empty-state py-20">
            <Volume2 className="w-20 h-20 mx-auto empty-state-icon" />
            <p className="empty-state-text mt-4">
              {searchTerm
                ? "No se encontraron proyectos con ese criterio"
                : "No hay proyectos de sonido registrados"}
            </p>
            {!searchTerm && (
              <Link to="/sound-projects/new">
                <Button className="mt-6 bg-amber-600 hover:bg-amber-700 font-mono uppercase tracking-widest text-xs">
                  Añadir Primer Proyecto
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
              ¿Estás seguro de que deseas eliminar este proyecto de sonido? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono uppercase tracking-widest text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs"
              data-testid="confirm-delete-sound-project-btn"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SoundProjects;
