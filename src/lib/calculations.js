// Funciones utilitarias para cálculos del formulario

export function calcularIMC(peso, talla) {
  if (!peso || !talla) return 0;
  const imc = peso / (talla * talla);
  return Number(imc.toFixed(2));
}

export function clasificarIMC(imc) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  return 'Obesidad';
}

export default { calcularIMC, clasificarIMC };
