import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { TrainTrack, Save, ArrowLeft, Upload, X } from "lucide-react";
import { getRollingStockItem, createRollingStock, updateRollingStock } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const RollingStockForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    reference: "",
    stock_type: "coche_viajeros",
    purchase_date: "",
    price: "",
    condition: "nuevo",
    era: "",
    railway_company: "",
    notes: "",
    photo: "",
  });

  useEffect(() => {
    if (isEditing) {
      const fetchData = async () => {
        try {
          const response = await getRollingStockItem(id);
          const item = response.data;
          setFormData({
            ...item,
            price: item.price || "",
            purchase_date: item.purchase_date || "",
          });
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Error al cargar los datos");
          navigate("/rolling-stock");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      if (isEditing) {
        await updateRollingStock(id, dataToSend);
        toast.success("Material rodante actualizado correctamente");
      } else {
        await createRollingStock(dataToSend);
        toast.success("Material rodante creado correctamente");
      }
      navigate("/rolling-stock");
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const eras = ["I", "II", "III", "IV", "V", "VI"];
  const stockTypes = [
    { value: "coche_viajeros", label: "Coche de Viajeros" },
    { value: "vagon_mercancias", label: "Vagón de Mercancías" },
    { value: "furgon", label: "Furgón" },
    { value: "otro", label: "Otro" },
  ];
  const railwayCompanies = ["RENFE", "DB", "SNCF", "FS", "OBB", "SBB", "NS", "NMBS/SNCB", "CP", "DSB", "NSB", "VR", "PKP", "CD", "MAV", "CFR", "BDZ", "TCDD", "JR", "Amtrak", "CN", "CP Rail", "Otra"];

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="skeleton h-10 w-48 mb-8"></div>
        <div className="skeleton h-96 w-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" data-testid="rolling-stock-form">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/rolling-stock">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <TrainTrack className="w-8 h-8 text-green-600" />
            {isEditing ? "Editar Vagón/Coche" : "Nuevo Vagón/Coche"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Basic Info */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Información Básica</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="railway-label">Marca *</label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="railway-input w-full"
                placeholder="Ej: Roco, Fleischmann..."
                data-testid="input-brand"
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
                placeholder="Ej: Talgo III, Corail..."
                data-testid="input-model"
              />
            </div>
            <div>
              <label className="railway-label">Referencia *</label>
              <Input
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                required
                className="railway-input w-full"
                placeholder="Ej: 64211"
                data-testid="input-reference"
              />
            </div>
            <div>
              <label className="railway-label">Tipo</label>
              <Select
                value={formData.stock_type}
                onValueChange={(value) => handleSelectChange("stock_type", value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-stock-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stockTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        {/* Purchase Info */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Información de Compra y Estado</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="railway-label">Fecha de Compra</label>
              <Input
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
                className="railway-input w-full"
                data-testid="input-purchase-date"
              />
            </div>
            <div>
              <label className="railway-label">Precio (€)</label>
              <Input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="railway-input w-full"
                placeholder="0.00"
                data-testid="input-price"
              />
            </div>
            <div>
              <label className="railway-label">Estado</label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleSelectChange("condition", value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                  <SelectItem value="restaurado">Restaurado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="railway-label">Época</label>
              <Select
                value={formData.era || "none"}
                onValueChange={(value) => handleSelectChange("era", value === "none" ? "" : value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-era">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {eras.map((era) => (
                    <SelectItem key={era} value={era}>
                      Época {era}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="railway-label">Compañía Ferroviaria</label>
              <Select
                value={formData.railway_company || "none"}
                onValueChange={(value) => handleSelectChange("railway_company", value === "none" ? "" : value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-railway-company">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {railwayCompanies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        {/* Photo */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Fotografía</legend>
          
          {formData.photo ? (
            <div className="relative inline-block">
              <img
                src={formData.photo}
                alt="Material rodante"
                className="max-w-md h-auto border border-slate-200"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removePhoto}
                className="absolute top-2 right-2 h-8 w-8 p-0"
                data-testid="remove-photo-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="photo-upload block max-w-md cursor-pointer" data-testid="photo-upload">
              <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <span className="font-mono text-sm text-slate-500 block">
                Haz clic para subir una foto
              </span>
              <span className="font-mono text-xs text-slate-400 block mt-1">
                JPG, PNG o WebP
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </fieldset>

        {/* Notes */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Notas</legend>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="railway-input w-full min-h-[100px]"
            placeholder="Notas adicionales..."
            data-testid="input-notes"
          />
        </fieldset>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <Link to="/rolling-stock">
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
            className="bg-green-600 hover:bg-green-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="submit-stock-btn"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RollingStockForm;
