import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Volume2, Save, ArrowLeft, Plus, X } from "lucide-react";
import { getSoundProject, createSoundProject, updateSoundProject } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

const SoundProjectForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [newSound, setNewSound] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    decoder_brand: "",
    decoder_model: "",
    locomotive_type: "",
    version: "",
    sounds: [],
    notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      const fetchProject = async () => {
        try {
          const response = await getSoundProject(id);
          setFormData({
            ...response.data,
            sounds: response.data.sounds || [],
          });
        } catch (error) {
          console.error("Error fetching sound project:", error);
          toast.error("Error al cargar el proyecto de sonido");
          navigate("/sound-projects");
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSound = () => {
    if (!newSound.trim()) return;
    if (formData.sounds.includes(newSound.trim())) {
      toast.error("Este sonido ya está en la lista");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      sounds: [...prev.sounds, newSound.trim()],
    }));
    setNewSound("");
  };

  const removeSound = (index) => {
    setFormData((prev) => ({
      ...prev,
      sounds: prev.sounds.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        await updateSoundProject(id, formData);
        toast.success("Proyecto de sonido actualizado correctamente");
      } else {
        await createSoundProject(formData);
        toast.success("Proyecto de sonido creado correctamente");
      }
      navigate("/sound-projects");
    } catch (error) {
      console.error("Error saving sound project:", error);
      toast.error("Error al guardar el proyecto de sonido");
    } finally {
      setSaving(false);
    }
  };

  const commonSounds = [
    "Motor",
    "Silbato",
    "Bocina",
    "Frenos",
    "Compresor",
    "Ventilador",
    "Campana",
    "Acoplamiento",
    "Puertas",
    "Anuncios",
    "Arranque",
    "Parada",
  ];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-10 w-48 mb-8"></div>
        <div className="skeleton h-96 w-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="sound-project-form">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/sound-projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Volume2 className="w-8 h-8 text-amber-600" />
            {isEditing ? "Editar Proyecto" : "Nuevo Proyecto de Sonido"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Información del Proyecto</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="railway-label">Nombre del Proyecto *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: BR 151 DB Cargo v2.0"
                  data-testid="input-project-name"
                />
              </div>
              <div>
                <label className="railway-label">Marca Decodificador *</label>
                <Input
                  name="decoder_brand"
                  value={formData.decoder_brand}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: ESU"
                  data-testid="input-project-decoder-brand"
                />
              </div>
              <div>
                <label className="railway-label">Modelo Decodificador *</label>
                <Input
                  name="decoder_model"
                  value={formData.decoder_model}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: LokSound 5 micro"
                  data-testid="input-project-decoder-model"
                />
              </div>
              <div>
                <label className="railway-label">Tipo de Locomotora *</label>
                <Input
                  name="locomotive_type"
                  value={formData.locomotive_type}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: Eléctrica BR 151"
                  data-testid="input-locomotive-type"
                />
              </div>
              <div>
                <label className="railway-label">Versión</label>
                <Input
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="railway-input w-full"
                  placeholder="Ej: 2.0"
                  data-testid="input-project-version"
                />
              </div>
            </div>
          </fieldset>

          {/* Sounds */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Sonidos Incluidos</legend>
            
            {formData.sounds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {formData.sounds.map((sound, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 font-mono text-xs uppercase"
                    data-testid={`sound-tag-${index}`}
                  >
                    {sound}
                    <button
                      type="button"
                      onClick={() => removeSound(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3 mb-4">
              <Input
                value={newSound}
                onChange={(e) => setNewSound(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSound();
                  }
                }}
                className="railway-input flex-1"
                placeholder="Añadir sonido..."
                data-testid="input-new-sound"
              />
              <Button
                type="button"
                onClick={addSound}
                className="bg-amber-600 hover:bg-amber-700 font-mono uppercase tracking-widest text-xs gap-1"
                data-testid="add-sound-btn"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </Button>
            </div>

            <div>
              <p className="font-mono text-xs uppercase text-slate-500 mb-2">Sonidos comunes:</p>
              <div className="flex flex-wrap gap-2">
                {commonSounds.map((sound) => (
                  <button
                    key={sound}
                    type="button"
                    onClick={() => {
                      if (!formData.sounds.includes(sound)) {
                        setFormData((prev) => ({
                          ...prev,
                          sounds: [...prev.sounds, sound],
                        }));
                      }
                    }}
                    disabled={formData.sounds.includes(sound)}
                    className={`px-2 py-1 font-mono text-[10px] uppercase border transition-colors ${
                      formData.sounds.includes(sound)
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
                    }`}
                  >
                    {sound}
                  </button>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Notes */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Notas</legend>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="railway-input w-full min-h-[100px]"
              placeholder="Notas adicionales sobre el proyecto de sonido..."
              data-testid="input-project-notes"
            />
          </fieldset>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-8">
          <Link to="/sound-projects">
            <Button
              type="button"
              variant="outline"
              className="font-mono uppercase tracking-widest text-xs border-slate-300"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="submit-sound-project-btn"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SoundProjectForm;
