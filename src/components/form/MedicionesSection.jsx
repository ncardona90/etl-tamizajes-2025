import { useEffect } from 'react';
import { calcularIMC } from '../../lib/calculations';

export default function MedicionesSection({ formData, setFormData }) {
  const { peso, talla } = formData;

  useEffect(() => {
    if (peso && talla) {
      const imc = calcularIMC(Number(peso), Number(talla));
      setFormData({ ...formData, imc });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peso, talla]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Peso (kg)</label>
        <input
          type="number"
          className="mt-1 w-full border rounded p-2"
          value={peso || ''}
          onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Talla (m)</label>
        <input
          type="number"
          className="mt-1 w-full border rounded p-2"
          value={talla || ''}
          onChange={(e) => setFormData({ ...formData, talla: e.target.value })}
        />
      </div>
      {formData.imc && (
        <p className="text-sm text-gray-700">IMC: {formData.imc}</p>
      )}
    </div>
  );
}
