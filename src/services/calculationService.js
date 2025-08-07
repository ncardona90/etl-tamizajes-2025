export default class CalculationService {
  // Tablas de riesgo cardiovascular de la OMS
  static _tablaHombreNoDiabeticoNoFumador = [[1, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 4], [3, 4, 4, 5]];
  static _tablaHombreNoDiabeticoFumador = [[1, 2, 3, 4], [2, 3, 4, 4], [3, 4, 4, 5], [4, 4, 5, 5]];
  static _tablaHombreDiabeticoNoFumador = [[2, 3, 4, 4], [3, 4, 4, 5], [4, 4, 5, 5], [4, 5, 5, 5]];
  static _tablaHombreDiabeticoFumador = [[3, 4, 4, 5], [4, 4, 5, 5], [4, 5, 5, 5], [5, 5, 5, 5]];
  static _tablaMujerNoDiabeticaNoFumadora = [[1, 1, 1, 1], [1, 1, 2, 2], [1, 2, 3, 3], [2, 3, 4, 4]];
  static _tablaMujerNoDiabeticaFumadora = [[1, 1, 2, 2], [1, 2, 3, 4], [2, 3, 4, 4], [3, 4, 4, 5]];
  static _tablaMujerDiabeticaNoFumadora = [[1, 2, 3, 4], [2, 3, 4, 4], [3, 4, 4, 5], [4, 4, 5, 5]];
  static _tablaMujerDiabeticaFumadora = [[2, 3, 4, 4], [3, 4, 4, 5], [4, 4, 5, 5], [4, 5, 5, 5]];

  calculateAge(birthDateString) {
    if (!birthDateString || birthDateString.length !== 10) return null;
    const [day, month, year] = birthDateString.split('/');
    const birthDate = new Date(`${year}-${month}-${day}`);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  }

  calculateIMC(weight, heightInCm) {
    if (!weight || !heightInCm || heightInCm <= 0) return 0.0;
    const heightInMeters = heightInCm / 100;
    return weight / (heightInMeters * heightInMeters);
  }

  classifyIMC(imc) {
    if (imc <= 0 || imc === null) return 'N/A';
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25.0) return 'Normal';
    if (imc < 30.0) return 'Sobrepeso';
    if (imc < 35.0) return 'Obesidad Grado I';
    if (imc < 40.0) return 'Obesidad Grado II';
    return 'Obesidad Grado III (Mórbida)';
  }

  calculateAndClassifyFINDRISC({ age, imc, waistCircumference, gender, physicalActivity, eatsFruitsAndVegs, htaMedication, highGlucoseHistory, familyDiabetesHistory }) {
    const requiredParams = [age, imc, waistCircumference, gender, physicalActivity, eatsFruitsAndVegs, htaMedication, highGlucoseHistory, familyDiabetesHistory];
    if (requiredParams.some(p => p === null || p === undefined || p === '')) {
      return { puntaje: 0, clasificacion: 'Datos insuficientes' };
    }

    let score = 0;
    if (age >= 45 && age <= 54) score += 2;
    else if (age >= 55 && age <= 64) score += 3;
    else if (age > 64) score += 4;

    if (imc >= 25 && imc < 30) score += 1;
    else if (imc >= 30) score += 3;

    const isMale = gender.toLowerCase() === 'hombre' || gender.toLowerCase() === 'masculino';
    if (isMale) {
      if (waistCircumference >= 94 && waistCircumference <= 102) score += 3;
      else if (waistCircumference > 102) score += 4;
    } else {
      if (waistCircumference >= 80 && waistCircumference <= 88) score += 3;
      else if (waistCircumference > 88) score += 4;
    }

    if (physicalActivity === 'No') score += 2;
    if (eatsFruitsAndVegs === 'NO todos los días') score += 1;
    if (htaMedication === 'Si') score += 2;
    if (highGlucoseHistory === 'Si') score += 5;

    if (familyDiabetesHistory === 'Sí: padres, hermanos o hijos') score += 5;
    else if (familyDiabetesHistory === 'Sí: abuelos, tía, tío, primo hermano') score += 3;

    let clasificacion;
    if (score < 7) clasificacion = 'Riesgo Bajo';
    else if (score <= 11) clasificacion = 'Ligeramente Elevado';
    else if (score <= 14) clasificacion = 'Riesgo Moderado';
    else if (score <= 20) clasificacion = 'Riesgo Alto';
    else clasificacion = 'Riesgo Muy Alto';

    return { puntaje: score, clasificacion };
  }

  calculateAndClassifyWHORisk({ age, gender, systolicPressure, smokes, isDiabetic, hasPreviousCVD }) {
    const requiredParams = [age, gender, systolicPressure, smokes, isDiabetic, hasPreviousCVD];
    if (requiredParams.some(p => p === null || p === undefined || p === '')) {
      return { riesgoPorcentaje: 'N/A', clasificacionRiesgo: 'Datos insuficientes' };
    }

    if (hasPreviousCVD === 'Si') {
      return { riesgoPorcentaje: '≥40%', clasificacionRiesgo: 'Muy Alto' };
    }

    const isMale = ['Hombre', 'Masculino'].includes(gender);
    const isSmoker = smokes === 'Si';
    const hasDiabetes = isDiabetic === 'Si';

    let table;
    if (isMale) {
      if (hasDiabetes) {
        table = isSmoker ? CalculationService._tablaHombreDiabeticoFumador : CalculationService._tablaHombreDiabeticoNoFumador;
      } else {
        table = isSmoker ? CalculationService._tablaHombreNoDiabeticoFumador : CalculationService._tablaHombreNoDiabeticoNoFumador;
      }
    } else {
      if (hasDiabetes) {
        table = isSmoker ? CalculationService._tablaMujerDiabeticaFumadora : CalculationService._tablaMujerDiabeticaNoFumadora;
      } else {
        table = isSmoker ? CalculationService._tablaMujerNoDiabeticaFumadora : CalculationService._tablaMujerNoDiabeticaNoFumadora;
      }
    }

    const ageIndex = age >= 70 ? 3 : age >= 60 ? 2 : age >= 50 ? 1 : 0;
    const pressureIndex = systolicPressure >= 180 ? 3 : systolicPressure >= 160 ? 2 : systolicPressure >= 140 ? 1 : 0;
    const riskCode = table[ageIndex][pressureIndex];

    switch (riskCode) {
      case 1:
        return { riesgoPorcentaje: '<10%', clasificacionRiesgo: 'Bajo' };
      case 2:
        return { riesgoPorcentaje: '10% a <20%', clasificacionRiesgo: 'Moderado' };
      case 3:
        return { riesgoPorcentaje: '20% a <30%', clasificacionRiesgo: 'Alto' };
      case 4:
        return { riesgoPorcentaje: '30% a <40%', clasificacionRiesgo: 'Alto' };
      case 5:
        return { riesgoPorcentaje: '≥40%', clasificacionRiesgo: 'Muy Alto' };
      default:
        return { riesgoPorcentaje: 'Error', clasificacionRiesgo: 'Error' };
    }
  }
}
