import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Train, Save, ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import { getLocomotive, createLocomotive, updateLocomotive, getDecoders, getSoundProjects } from "../lib/api";
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

const LocomotiveForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [decoders, setDecoders] = useState([]);
  const [soundProjects, setSoundProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    reference: "",
    locomotive_type: "electrica",
    dcc_address: 3,
    decoder_brand: "",
    decoder_model: "",
    sound_project: "",
    purchase_date: "",
    price: "",
    condition: "nuevo",
    era: "",
    railway_company: "",
    notes: "",
    photo: "",
    functions: [],
    cv_modifications: [],
  });

  // New function form
  const [newFunction, setNewFunction] = useState({
    function_number: "F0",
    description: "",
    is_sound: false,
  });

  // New CV form
  const [newCV, setNewCV] = useState({
    cv_number: 1,
    value: 0,
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [decodersRes, soundProjectsRes] = await Promise.all([
          getDecoders(),
          getSoundProjects(),
        ]);
        setDecoders(decodersRes.data);
        setSoundProjects(soundProjectsRes.data);

        if (isEditing) {
          const response = await getLocomotive(id);
          const loco = response.data;
          setFormData({
            ...loco,
            price: loco.price || "",
            purchase_date: loco.purchase_date || "",
            functions: loco.functions || [],
            cv_modifications: loco.cv_modifications || [],
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

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

  const addFunction = () => {
    if (!newFunction.description) {
      toast.error("Introduce una descripción para la función");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      functions: [...prev.functions, { ...newFunction }],
    }));
    setNewFunction({ function_number: "F0", description: "", is_sound: false });
  };

  const removeFunction = (index) => {
    setFormData((prev) => ({
      ...prev,
      functions: prev.functions.filter((_, i) => i !== index),
    }));
  };

  const addCV = () => {
    if (!newCV.description) {
      toast.error("Introduce una descripción para el CV");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      cv_modifications: [...prev.cv_modifications, { ...newCV }],
    }));
    setNewCV({ cv_number: 1, value: 0, description: "" });
  };

  const removeCV = (index) => {
    setFormData((prev) => ({
      ...prev,
      cv_modifications: prev.cv_modifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        dcc_address: parseInt(formData.dcc_address) || 3,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      if (isEditing) {
        await updateLocomotive(id, dataToSend);
        toast.success("Locomotora actualizada correctamente");
      } else {
        await createLocomotive(dataToSend);
        toast.success("Locomotora creada correctamente");
      }
      navigate("/locomotives");
    } catch (error) {
      console.error("Error saving locomotive:", error);
      toast.error("Error al guardar la locomotora");
    } finally {
      setSaving(false);
    }
  };

  const functionNumbers = Array.from({ length: 29 }, (_, i) => `F${i}`);
  const eras = ["I", "II", "III", "IV", "V", "VI"];
  const locomotiveTypes = [
    { value: "electrica", label: "Eléctrica" },
    { value: "diesel", label: "Diésel" },
    { value: "vapor", label: "Vapor" },
    { value: "automotor", label: "Automotor" },
    { value: "alta_velocidad", label: "Alta Velocidad" },
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
    <div className="animate-fade-in" data-testid="locomotive-form">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/locomotives">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-3">
            <Train className="w-8 h-8 text-red-600" />
            {isEditing ? "Editar Locomotora" : "Nueva Locomotora"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Información Básica</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="railway-label">Marca *</label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                className="railway-input w-full"
                placeholder="Ej: Arnold, Fleischmann..."
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
                placeholder="Ej: BR 151, 252..."
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
                placeholder="Ej: HN2493"
                data-testid="input-reference"
              />
            </div>
            <div>
              <label className="railway-label">Tipo de Locomotora</label>
              <Select
                value={formData.locomotive_type || "electrica"}
                onValueChange={(value) => handleSelectChange("locomotive_type", value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-locomotive-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locomotiveTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        {/* Technical Info */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Información Técnica DCC</legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="railway-label">Dirección DCC *</label>
              <Input
                name="dcc_address"
                type="number"
                min="1"
                max="9999"
                value={formData.dcc_address}
                onChange={handleChange}
                required
                className="railway-input w-full"
                data-testid="input-dcc-address"
              />
            </div>
            <div>
              <label className="railway-label">Marca Decodificador</label>
              <Input
                name="decoder_brand"
                value={formData.decoder_brand}
                onChange={handleChange}
                className="railway-input w-full"
                placeholder="Ej: ESU, Zimo..."
                data-testid="input-decoder-brand"
              />
            </div>
            <div>
              <label className="railway-label">Modelo Decodificador</label>
              <Input
                name="decoder_model"
                value={formData.decoder_model}
                onChange={handleChange}
                className="railway-input w-full"
                placeholder="Ej: LokSound 5 micro"
                data-testid="input-decoder-model"
              />
            </div>
            <div>
              <label className="railway-label">Proyecto de Sonido</label>
              <Select
                value={formData.sound_project || "none"}
                onValueChange={(value) => handleSelectChange("sound_project", value === "none" ? "" : value)}
              >
                <SelectTrigger className="railway-input" data-testid="select-sound-project">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {soundProjects.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </fieldset>

        {/* Purchase Info */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Información de Compra</legend>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Functions */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Funciones Programadas</legend>
          
          {formData.functions.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full cv-table">
                <thead>
                  <tr>
                    <th>Función</th>
                    <th>Descripción</th>
                    <th>Sonido</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.functions.map((func, index) => (
                    <tr key={index} data-testid={`function-row-${index}`}>
                      <td className="font-bold">{func.function_number}</td>
                      <td>{func.description}</td>
                      <td>
                        {func.is_sound && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 text-xs uppercase">
                            Sonido
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFunction(index)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="railway-label">Función</label>
              <Select
                value={newFunction.function_number}
                onValueChange={(value) => setNewFunction((prev) => ({ ...prev, function_number: value }))}
              >
                <SelectTrigger className="railway-input" data-testid="select-new-function">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {functionNumbers.map((fn) => (
                    <SelectItem key={fn} value={fn}>
                      {fn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="railway-label">Descripción</label>
              <Input
                value={newFunction.description}
                onChange={(e) => setNewFunction((prev) => ({ ...prev, description: e.target.value }))}
                className="railway-input w-full"
                placeholder="Ej: Luces frontales, Silbato..."
                data-testid="input-function-description"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFunction.is_sound}
                  onChange={(e) => setNewFunction((prev) => ({ ...prev, is_sound: e.target.checked }))}
                  className="w-4 h-4"
                  data-testid="checkbox-is-sound"
                />
                <span className="font-mono text-xs uppercase">Sonido</span>
              </label>
              <Button
                type="button"
                onClick={addFunction}
                className="bg-blue-600 hover:bg-blue-700 font-mono uppercase tracking-widest text-xs gap-1"
                data-testid="add-function-btn"
              >
                <Plus className="w-4 h-4" />
                Añadir
              </Button>
            </div>
          </div>
        </fieldset>

        {/* CV Modifications */}
        <fieldset className="form-fieldset">
          <legend className="form-legend">Modificaciones de CV</legend>
          
          {formData.cv_modifications.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full cv-table">
                <thead>
                  <tr>
                    <th>CV</th>
                    <th>Valor</th>
                    <th>Descripción</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.cv_modifications.map((cv, index) => (
                    <tr key={index} data-testid={`cv-row-${index}`}>
                      <td className="font-bold">CV{cv.cv_number}</td>
                      <td>{cv.value}</td>
                      <td>{cv.description}</td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCV(index)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="railway-label">Número CV</label>
              <Input
                type="number"
                min="1"
                max="1024"
                value={newCV.cv_number}
                onChange={(e) => setNewCV((prev) => ({ ...prev, cv_number: parseInt(e.target.value) || 1 }))}
                className="railway-input w-full"
                data-testid="input-cv-number"
              />
            </div>
            <div>
              <label className="railway-label">Valor</label>
              <Input
                type="number"
                min="0"
                max="255"
                value={newCV.value}
                onChange={(e) => setNewCV((prev) => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                className="railway-input w-full"
                data-testid="input-cv-value"
              />
            </div>
            <div>
              <label className="railway-label">Descripción</label>
              <Input
                value={newCV.description}
                onChange={(e) => setNewCV((prev) => ({ ...prev, description: e.target.value }))}
                className="railway-input w-full"
                placeholder="Ej: Volumen motor..."
                data-testid="input-cv-description"
              />
            </div>
            <div>
              <Button
                type="button"
                onClick={addCV}
                className="bg-blue-600 hover:bg-blue-700 font-mono uppercase tracking-widest text-xs gap-1 w-full"
                data-testid="add-cv-btn"
              >
                <Plus className="w-4 h-4" />
                Añadir CV
              </Button>
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
                alt="Locomotora"
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
            placeholder="Notas adicionales sobre la locomotora..."
            data-testid="input-notes"
          />
        </fieldset>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4">
          <Link to="/locomotives">
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
            className="bg-red-600 hover:bg-red-700 font-mono uppercase tracking-widest text-xs gap-2"
            data-testid="submit-locomotive-btn"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LocomotiveForm;
