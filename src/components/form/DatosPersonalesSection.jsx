export default function DatosPersonalesSection({ formData, setFormData }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre completo</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={formData.nombre_completo || ''}
          onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Número de documento</label>
        <input
          className="mt-1 w-full border rounded p-2"
          value={formData.numero_documento || ''}
          onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
        />
      </div>
    </div>
  );
}
