import CalculationService from '../services/calculationService.js'

/**
 * Representa un registro de Tamizaje y encapsula la lógica de
 * normalización y cálculo de campos derivados.
 */
export default class Tamizaje {
  constructor(params) {
    Object.assign(this, params)
  }

  /**
   * Crea una instancia de Tamizaje a partir de un objeto literal
   * y realiza los cálculos y normalizaciones necesarias.
   */
  static fromMap(map = {}) {
    const calc = new CalculationService()

    const safeInt = (val, fb = 0) => {
      const n = parseInt(val, 10)
      return Number.isNaN(n) ? fb : n
    }
    const safeDouble = (val, fb = 0.0) => {
      const n = parseFloat(val)
      return Number.isNaN(n) ? fb : n
    }
    const safeDate = val => {
      const d = new Date(val)
      return Number.isNaN(d.getTime()) ? null : d
    }

    const docId = (map.numero_documento ?? '').toString().trim()
    if (!docId) throw new Error('El número de documento no puede ser nulo o vacío.')

    const fechaNacimientoRaw = safeDate(map.fecha_nacimiento)
    const pesoRaw = safeDouble(map.peso)
    const tallaCmRaw = safeDouble(map.talla)
    const presionSistolicaRaw = safeInt(map.presion_sistolica)
    const circunferenciaAbdominalRaw =
      map.circunferencia_abdominal === undefined
        ? null
        : safeDouble(map.circunferencia_abdominal)

    const sexoNormalizado = Tamizaje.#normalizeSexo(map.sexo_asignado_nacimiento)
    const actividadFisicaNormalizado = Tamizaje.#normalizeSiNo(map.actividad_fisica)
    const medicacionHtaNormalizado = Tamizaje.#normalizeSiNo(map.medicacion_hipertension)
    const glucosaAltaNormalizado = Tamizaje.#normalizeSiNo(map.glucosa_alta_historico)
    const esDiabeticoNormalizado = Tamizaje.#normalizeSiNo(map.es_diabetico)
    const fumaNormalizado = Tamizaje.#normalizeSiNo(map.fuma)
    const enfermedadCardioNormalizado = Tamizaje.#normalizeSiNo(map.enfermedad_cardiovascular_renal_colesterol)

    const edadCalculada = fechaNacimientoRaw
      ? calc.calculateAge(
          `${fechaNacimientoRaw.getDate().toString().padStart(2, '0')}/` +
            `${(fechaNacimientoRaw.getMonth() + 1).toString().padStart(2, '0')}/` +
            `${fechaNacimientoRaw.getFullYear()}`,
        )
      : safeInt(map.edad)

    const tallaEnMetros = tallaCmRaw > 3 ? tallaCmRaw / 100 : tallaCmRaw
    const imcCalculado = calc.calculateIMC(pesoRaw, tallaEnMetros * 100)
    const clasificacionImcCalculada = calc.classifyIMC(imcCalculado)

    const findrisc = calc.calculateAndClassifyFINDRISC({
      age: edadCalculada,
      imc: imcCalculado,
      waistCircumference: circunferenciaAbdominalRaw,
      gender: sexoNormalizado,
      physicalActivity: actividadFisicaNormalizado,
      eatsFruitsAndVegs: map.frecuencia_frutas_verduras,
      htaMedication: medicacionHtaNormalizado,
      highGlucoseHistory: glucosaAltaNormalizado,
      familyDiabetesHistory: map.antecedentes_familiares_diabetes,
    })

    const whoRisk = calc.calculateAndClassifyWHORisk({
      age: edadCalculada,
      gender: sexoNormalizado,
      systolicPressure: presionSistolicaRaw,
      smokes: fumaNormalizado,
      isDiabetic: esDiabeticoNormalizado,
      hasPreviousCVD: enfermedadCardioNormalizado,
    })

    return new Tamizaje({
      uploadedBy: map.uploaded_by ?? 'Desconocido',
      id: docId,
      sourceFile: map._sourceFile ?? 'N/A',
      fechaIntervencion: safeDate(map.fecha_intervencion),
      lugarIntervencion: map.lugar_intervencion ?? '',
      entornoIntervencion: map.entorno_intervencion ?? '',
      horaInicialIntervencion: map.hora_inicial_intervencion ?? '',
      horaFinalIntervencion: map.hora_final_intervencion ?? '',
      codigoTamizajeManual: map.codigo_tamizaje_manual,

      nombres: map.nombres ?? '',
      apellidos: map.apellidos ?? '',
      tipoDoc: map.tipo_doc ?? '',
      numeroDocumento: docId,
      nacionalidad: map.nacionalidad ?? '',
      fechaNacimiento: fechaNacimientoRaw,
      edad: edadCalculada,
      sexoAsignadoNacimiento: sexoNormalizado,
      generoIdentificado: map.genero_identificado ?? '',
      orientacionSexual: map.orientacion_sexual,
      grupoEtnico: map.grupo_etnico ?? '',
      otroGrupoEtnico: map.otro_grupo_etnico,
      poblacionCondicionSituacion: map.poblacion_condicion_situacion ?? '',
      poblacionMigrante: map.poblacion_migrante ?? '',
      estratoSocioeconomico: map.estrato_socioeconomico,
      latitud: map.latitud !== undefined ? Number(map.latitud) : null,
      longitud: map.longitud !== undefined ? Number(map.longitud) : null,

      correoElectronico: map.correo_electronico,
      telefonoContacto: (map.telefono_contacto ?? '').toString(),
      direccionResidencia: map.direccion_residencia,
      barrioCorregimientoVereda: map.barrio_corregimiento_vereda ?? '',
      comuna: Tamizaje.#normalizeBarrio(map.comuna),
      eps: Tamizaje.#normalizeEps(map.eps),
      eapb: map.eapb,
      tipoAseguramiento: map.tipo_aseguramiento,

      talla: tallaCmRaw,
      peso: pesoRaw,
      imc: imcCalculado,
      clasificacionImc: clasificacionImcCalculada,
      presionSistolica: presionSistolicaRaw,
      presionDiastolica: safeInt(map.presion_diastolica),
      circunferenciaAbdominal: circunferenciaAbdominalRaw,

      actividadFisica: actividadFisicaNormalizado,
      frecuenciaFrutasVerduras: map.frecuencia_frutas_verduras ?? '',
      medicacionHipertension: medicacionHtaNormalizado,
      glucosaAltaHistorico: glucosaAltaNormalizado,
      antecedentesFamiliaresDiabetes: map.antecedentes_familiares_diabetes ?? '',
      esDiabetico: esDiabeticoNormalizado,
      tipoDiabetes: map.tipo_diabetes,
      fuma: fumaNormalizado,
      tieneSeresSintientes: Tamizaje.#normalizeSiNo(map.tiene_seres_sintientes),
      enfermedadCardiovascularRenalColesterol: enfermedadCardioNormalizado,

      puntajeFindriscCalculado: findrisc.puntaje,
      riesgoFindrisc: findrisc.clasificacion,
      riesgoCardiovascularOmsPorcentaje: whoRisk.riesgoPorcentaje,
      clasificacionRiesgoCardiovascularOms: whoRisk.clasificacionRiesgo,
      observaciones: map.observaciones,
      fechaRegistroBd: map.fecha_registro_bd ? safeDate(map.fecha_registro_bd) : new Date(),
    })
  }

  toMap() {
    return {
      uploaded_by: this.uploadedBy,
      fecha_intervencion: this.fechaIntervencion?.toISOString(),
      lugar_intervencion: this.lugarIntervencion,
      entorno_intervencion: this.entornoIntervencion,
      hora_inicial_intervencion: this.horaInicialIntervencion,
      hora_final_intervencion: this.horaFinalIntervencion,
      codigo_tamizaje_manual: this.codigoTamizajeManual,
      nombres: this.nombres,
      apellidos: this.apellidos,
      tipo_doc: this.tipoDoc,
      numero_documento: this.numeroDocumento,
      nacionalidad: this.nacionalidad,
      fecha_nacimiento: this.fechaNacimiento?.toISOString(),
      edad: this.edad,
      sexo_asignado_nacimiento: this.sexoAsignadoNacimiento,
      genero_identificado: this.generoIdentificado,
      orientacion_sexual: this.orientacionSexual,
      grupo_etnico: this.grupoEtnico,
      otro_grupo_etnico: this.otroGrupoEtnico,
      poblacion_condicion_situacion: this.poblacionCondicionSituacion,
      poblacion_migrante: this.poblacionMigrante,
      tiene_seres_sintientes: this.tieneSeresSintientes,
      correo_electronico: this.correoElectronico,
      telefono_contacto: this.telefonoContacto,
      direccion_residencia: this.direccionResidencia,
      barrio_corregimiento_vereda: this.barrioCorregimientoVereda,
      comuna: this.comuna,
      eapb: this.eapb,
      tipo_aseguramiento: this.tipoAseguramiento,
      eps: this.eps,
      talla: this.talla,
      peso: this.peso,
      imc: this.imc,
      clasificacion_imc: this.clasificacionImc,
      presion_sistolica: this.presionSistolica,
      presion_diastolica: this.presionDiastolica,
      circunferencia_abdominal: this.circunferenciaAbdominal,
      actividad_fisica: this.actividadFisica,
      frecuencia_frutas_verduras: this.frecuenciaFrutasVerduras,
      medicacion_hipertension: this.medicacionHipertension,
      glucosa_alta_historico: this.glucosaAltaHistorico,
      antecedentes_familiares_diabetes: this.antecedentesFamiliaresDiabetes,
      es_diabetico: this.esDiabetico,
      tipo_diabetes: this.tipoDiabetes,
      fuma: this.fuma,
      puntaje_findrisc_calculado: this.puntajeFindriscCalculado,
      riesgo_findrisc: this.riesgoFindrisc,
      enfermedad_cardiovascular_renal_colesterol: this.enfermedadCardiovascularRenalColesterol,
      riesgo_cardiovascular_oms_porcentaje: this.riesgoCardiovascularOmsPorcentaje,
      clasificacion_riesgo_cardiovascular_oms: this.clasificacionRiesgoCardiovascularOms,
      observaciones: this.observaciones,
      fecha_registro_bd: this.fechaRegistroBd,
      estrato_socioeconomico: this.estratoSocioeconomico,
      latitud: this.latitud,
      longitud: this.longitud,
      _sourceFile: this.sourceFile,
    }
  }

  // --- Normalización ---
  static #normalizeSiNo(valor) {
    if (valor == null) return 'N/A'
    const texto = valor.toString().trim().toLowerCase()
    if (!texto) return 'N/A'
    const siValues = new Set(['si', 'sí', 'sì', 'sí́'])
    const noValues = new Set(['no', 'nó'])
    if (siValues.has(texto)) return 'Si'
    if (noValues.has(texto)) return 'No'
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  }

  static #normalizeSexo(sexo) {
    if (sexo == null) return 'NO REGISTRA'
    const upper = sexo.toString().trim().toUpperCase()
    if (upper === 'FEMENINO' || upper.includes('INTERSEXUAL')) return 'Mujer'
    if (upper === 'MASCULINO') return 'Hombre'
    return upper
  }

  static #normalizeEps(eps) {
    if (eps == null) return 'N/A'
    const upper = eps.toString().trim().toUpperCase()
    if (!upper) return 'N/A'
    const patterns = {
      'N/A': ['NO APLICA', 'SIN ASEGURAMIENTO', 'NO REPORTA'],
      'NUEVA EPS': ['NUEVA EPS', 'NUEVAEPS'],
      'SURA': ['SURA'],
      // TODO: completar el resto de patrones según la fuente original
    }
    for (const [canon, vars] of Object.entries(patterns)) {
      if (vars.includes(upper)) return canon
    }
    return upper
  }

  static #normalizeBarrio(barrio) {
    if (barrio == null) return 'NO IDENTIFICADO'
    const upper = barrio.toString().trim().toUpperCase()
    if (!upper) return 'N/A'
    const patterns = {
      'N/A': ['NO REFIERE', 'NO SABE'],
      'CAPRI': ['CAPRI'],
      'MOJICA I': ['MOJICA 1', 'MOJICA'],
      // TODO: completar el resto de patrones según la fuente original
    }
    for (const [canon, vars] of Object.entries(patterns)) {
      const all = [canon.toUpperCase(), ...vars]
      if (all.includes(upper)) return canon
    }
    return upper
  }
}
