import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Cpu, Save, ArrowLeft, Volume2 } from "lucide-react";
import { getDecoder, createDecoder, updateDecoder } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const DecoderForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    type: "basic",
    scale: "N",
    interface: "NEM651",
    sound_capable: false,
    max_functions: 28,
    notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      const fetchDecoder = async () => {
        try {
          const response = await getDecoder(id);
          setFormData(response.data);
        } catch (error) {
          console.error("Error fetching decoder:", error);
          toast.error("Error al cargar el decodificador");
          navigate("/decoders");
        } finally {
          setLoading(false);
        }
      };
      fetchDecoder();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        max_functions: parseInt(formData.max_functions) || 28,
      };

      if (isEditing) {
        await updateDecoder(id, dataToSend);
        toast.success("Decodificador actualizado correctamente");
      } else {
        await createDecoder(dataToSend);
        toast.success("Decodificador creado correctamente");
      }
      navigate("/decoders");
    } catch (error) {
      console.error("Error saving decoder:", error);
      toast.error("Error al guardar el decodificador");
    } finally {
      setSaving(false);
    }
  };

  const interfaces = [
    "NEM651",
    "NEM652",
    "Next18",
    "PluX8",
    "PluX12",
    "PluX16",
    "PluX22",
    "21MTC",
    "Wired",
    "Direct",
  ];

  const decoderTypes = [
    { value: "basic", label: "Básico" },
    { value: "sound", label: "Sonido" },
    { value: "multiprotocol", label: "Multiprotocolo" },
    { value: "function", label: "Solo Funciones" },
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
    <div className="animate-fade-in" data-testid="decoder-form">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/decoders">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-600" />
            {isEditing ? "Editar Decodificador" : "Nuevo Decodificador"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Información del Decodificador</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="railway-label">Marca *</label>
                <Input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: ESU, Zimo, Lenz..."
                  data-testid="input-decoder-brand"
                />
              </div>
              <div>
                <label className="railway-label">Modelo *</label>
                <Input
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="railway-input w-full"
                  placeholder="Ej: LokSound 5 micro"
                  data-testid="input-decoder-model"
                />
              </div>
            </div>
          </fieldset>

          {/* Technical Specs */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Especificaciones Técnicas</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="railway-label">Tipo</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger className="railway-input" data-testid="select-decoder-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {decoderTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="railway-label">Escala</label>
                <Select
                  value={formData.scale}
                  onValueChange={(value) => handleSelectChange("scale", value)}
                >
                  <SelectTrigger className="railway-input" data-testid="select-decoder-scale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">N (1:160)</SelectItem>
                    <SelectItem value="H0">H0 (1:87)</SelectItem>
                    <SelectItem value="TT">TT (1:120)</SelectItem>
                    <SelectItem value="Z">Z (1:220)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="railway-label">Interfaz / Conector</label>
                <Select
                  value={formData.interface}
                  onValueChange={(value) => handleSelectChange("interface", value)}
                >
                  <SelectTrigger className="railway-input" data-testid="select-decoder-interface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {interfaces.map((iface) => (
                      <SelectItem key={iface} value={iface}>
                        {iface}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="railway-label">Máx. Funciones</label>
                <Input
                  name="max_functions"
                  type="number"
                  min="0"
                  max="68"
                  value={formData.max_functions}
                  onChange={handleChange}
                  className="railway-input w-full"
                  data-testid="input-max-functions"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center space-x-3">
              <Checkbox
                id="sound_capable"
                checked={formData.sound_capable}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, sound_capable: checked }))
                }
                data-testid="checkbox-sound-capable"
              />
              <label
                htmlFor="sound_capable"
                className="flex items-center gap-2 font-mono text-sm uppercase tracking-wider cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-amber-500" />
                Capacidad de Sonido
              </label>
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
              placeholder="Notas adicionales sobre el decodificador..."
              data-testid="input-decoder-notes"
            />
          </fieldset>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-8">
          <Link to="/decoders">
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
            className="bg-blue-600 hover:bg-blue-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="submit-decoder-btn"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DecoderForm;
