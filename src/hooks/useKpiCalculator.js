import { useMemo } from 'react';
import { calcularIMC } from '../lib/calculations';

// Calcula indicadores clave a partir de la lista de tamizajes
export function useKpiCalculator(tamizajes = []) {
  return useMemo(() => {
    const total = tamizajes.length || 0;
    const imcPromedio = total
      ? tamizajes.reduce((acc, t) => acc + (t.imc || calcularIMC(t.peso, t.talla)), 0) / total
      : 0;

    return {
      totalTamizajes: total,
      imcPromedio: Number(imcPromedio.toFixed(2)),
    };
  }, [tamizajes]);
}

export default useKpiCalculator;
