import { useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import CalculationService from '../services/calculationService'

const firebaseConfig = {
  apiKey: 'AIzaSyDtMpyp2GW_PuE26yRvuxvzZ6nRXlmAJJI',
  authDomain: 'tamizajese-etl.firebaseapp.com',
  projectId: 'tamizajese-etl',
  storageBucket: 'tamizajese-etl.appspot.com',
  messagingSenderId: '802752430955',
  appId: '1:802752430955:web:43588180dbdc64d1b4822e',
  measurementId: 'G-JSKGJLTRDH'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const options = {
  entorno_intervencion: ['Hogar', 'Educativo', 'Comunitario', 'Laboral', 'Institucional'],
  tipo_doc: ['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Otro'],
  sexo_asignado_nacimiento: ['Masculino', 'Femenino'],
  genero_identificado: ['Masculino', 'Femenino', 'Transgénero', 'Transformista', 'Travesti', 'Transgenerista', 'Transexual', 'No binario', 'Fluido'],
  orientacion_sexual: ['Heterosexual', 'Homosexual', 'Bisexual', 'Pansexual', 'Asexual'],
  grupo_etnico: ['Ninguno', 'Otro', 'Indígena', 'Rrom', 'NARP'],
  poblacion_condicion_situacion: ['Ninguna', 'Persona con discapacidad', 'Víctima del conflicto armado', 'Habitante de y en calle', 'Persona privada de la libertad', 'Campesino', 'Madre Cabeza de Hogar'],
  poblacion_migrante: ['No aplica', 'Regular', 'Irregular'],
  tiene_seres_sintientes: ['No', 'Si'],
  tipo_aseguramiento: ['Contributivo', 'Subsidiado', 'Sin Aseguramiento', 'Régimen Especial'],
  actividad_fisica: ['Si', 'No'],
  frecuencia_frutas_verduras: ['Todos los días', 'NO todos los días'],
  medicacion_hipertension: ['Si', 'No'],
  glucosa_alta_historico: ['Si', 'No'],
  antecedentes_familiares_diabetes: ['No', 'Sí: abuelos, tía, tío, primo hermano', 'Sí: padres, hermanos o hijos'],
  es_diabetico: ['Si', 'No'],
  tipo_diabetes: ['N/A', '1', '2', 'Gestacional'],
  fuma: ['Si', 'No'],
  enfermedad_cardiovascular_renal_colesterol: ['No', 'Si']
}

const initialData = {
  fecha_intervencion: '',
  entorno_intervencion: 'Comunitario',
  lugar_intervencion: '',
  hora_inicial_intervencion: '',
  hora_final_intervencion: '',
  codigo_tamizaje_manual: '',
  nombres: '',
  apellidos: '',
  tipo_doc: 'Cédula de Ciudadanía',
  numero_documento: '',
  nacionalidad: 'Colombiana',
  fecha_nacimiento: '',
  sexo_asignado_nacimiento: 'Masculino',
  genero_identificado: '',
  orientacion_sexual: '',
  grupo_etnico: 'Ninguno',
  otro_grupo_etnico: '',
  poblacion_condicion_situacion: 'Ninguna',
  poblacion_migrante: 'No aplica',
  tiene_seres_sintientes: 'No',
  telefono_contacto: '',
  correo_electronico: '',
  direccion_residencia: '',
  comuna: '',
  barrio_corregimiento_vereda: '',
  eps: '',
  tipo_aseguramiento: 'Subsidiado',
  estrato_socioeconomico: '',
  talla: '',
  peso: '',
  presion_sistolica: '',
  presion_diastolica: '',
  circunferencia_abdominal: '',
  actividad_fisica: 'No',
  frecuencia_frutas_verduras: 'NO todos los días',
  medicacion_hipertension: 'No',
  glucosa_alta_historico: 'No',
  antecedentes_familiares_diabetes: 'No',
  es_diabetico: 'No',
  tipo_diabetes: 'N/A',
  fuma: 'No',
  enfermedad_cardiovascular_renal_colesterol: 'No',
  observaciones: ''
}

export default function TamizajeForm() {
  const [formData, setFormData] = useState(() => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    return { ...initialData, fecha_intervencion: `${day}/${month}/${year}` }
  })
  const [currentUser, setCurrentUser] = useState(null)
  const [results, setResults] = useState({})
  const [gpsStatus, setGpsStatus] = useState('Capturando ubicación...')
  const [notification, setNotification] = useState(null)
  const calc = new CalculationService()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) setCurrentUser(user)
      else signInAnonymously(auth).catch(console.error)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocalización no soportada.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFormData(p => ({ ...p, latitud: pos.coords.latitude, longitud: pos.coords.longitude }))
        setGpsStatus('Ubicación capturada con éxito.')
      },
      () => setGpsStatus('No se pudo obtener la ubicación.')
    )
  }, [])

  useEffect(() => {
    const age = calc.calculateAge(formData.fecha_nacimiento)
    const imc = calc.calculateIMC(parseFloat(formData.peso), parseFloat(formData.talla))
    const imcClass = calc.classifyIMC(imc)
    const findrisc = calc.calculateAndClassifyFINDRISC({
      age,
      imc,
      waistCircumference: parseFloat(formData.circunferencia_abdominal),
      gender: formData.sexo_asignado_nacimiento,
      physicalActivity: formData.actividad_fisica,
      eatsFruitsAndVegs: formData.frecuencia_frutas_verduras,
      htaMedication: formData.medicacion_hipertension,
      highGlucoseHistory: formData.glucosa_alta_historico,
      familyDiabetesHistory: formData.antecedentes_familiares_diabetes
    })
    const oms = calc.calculateAndClassifyWHORisk({
      age,
      gender: formData.sexo_asignado_nacimiento,
      systolicPressure: parseInt(formData.presion_sistolica, 10),
      smokes: formData.fuma,
      isDiabetic: formData.es_diabetico,
      hasPreviousCVD: formData.enfermedad_cardiovascular_renal_colesterol
    })
    setResults({ edad: age, imc, imcClass, findrisc, oms })
  }, [formData])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!currentUser) {
      setNotification({ type: 'error', message: 'Error de autenticación. Intente nuevamente.' })
      return
    }
    try {
      await addDoc(collection(db, 'tamizajes'), {
        ...formData,
        edad: results.edad,
        imc: results.imc ? Number(results.imc.toFixed(2)) : null,
        clasificacion_imc: results.imcClass,
        puntaje_findrisc_calculado: results.findrisc?.puntaje,
        riesgo_findrisc: results.findrisc?.clasificacion,
        riesgo_cardiovascular_oms_porcentaje: results.oms?.riesgoPorcentaje,
        clasificacion_riesgo_cardiovascular_oms: results.oms?.clasificacionRiesgo,
        createdAt: serverTimestamp(),
        uploadedBy: currentUser.displayName || `WebUser-${currentUser.uid.substring(0, 8)}`
      })
      setNotification({ type: 'success', message: 'El tamizaje ha sido guardado correctamente.' })
      setFormData(initialData)
    } catch (err) {
      setNotification({ type: 'error', message: `Error al guardar: ${err.message}` })
    }
  }

  const getColorForRisk = classification => {
    if (!classification) return 'text-gray-800'
    const text = classification.toLowerCase()
    if (text.includes('obesidad') || text.includes('muy alto') || text.includes('alto')) return 'text-red-600'
    if (text.includes('sobrepeso') || text.includes('moderado') || text.includes('ligeramente')) return 'text-orange-500'
    if (text.includes('normal') || text.includes('bajo')) return 'text-green-600'
    return 'text-gray-800'
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="lg:grid lg:grid-cols-5 lg:gap-8">
        <main className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="px-4 py-5 sm:p-8">
              <header className="mb-8">
                <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Formulario de Tamizaje</h1>
                <p className="mt-1 text-sm text-gray-500">Complete los datos para realizar el cálculo de riesgo.</p>
              </header>

              <div className="mb-8 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <i className="fas fa-location-arrow text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">{gpsStatus}</span>
              </div>

              <div className="space-y-10">
                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">1. Información General</legend>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="fecha_intervencion" className="block text-sm font-medium leading-6 text-gray-900">Fecha Intervención*</label>
                      <input type="text" id="fecha_intervencion" name="fecha_intervencion" value={formData.fecha_intervencion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="entorno_intervencion" className="block text-sm font-medium leading-6 text-gray-900">Entorno Intervención*</label>
                      <select id="entorno_intervencion" name="entorno_intervencion" value={formData.entorno_intervencion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.entorno_intervencion.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-full">
                      <label htmlFor="lugar_intervencion" className="block text-sm font-medium leading-6 text-gray-900">Lugar Intervención</label>
                      <input type="text" id="lugar_intervencion" name="lugar_intervencion" value={formData.lugar_intervencion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="hora_inicial_intervencion" className="block text-sm font-medium leading-6 text-gray-900">Hora Inicial</label>
                      <input type="time" id="hora_inicial_intervencion" name="hora_inicial_intervencion" value={formData.hora_inicial_intervencion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="hora_final_intervencion" className="block text-sm font-medium leading-6 text-gray-900">Hora Final</label>
                      <input type="time" id="hora_final_intervencion" name="hora_final_intervencion" value={formData.hora_final_intervencion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="codigo_tamizaje_manual" className="block text-sm font-medium leading-6 text-gray-900">Código Manual</label>
                      <input type="text" id="codigo_tamizaje_manual" name="codigo_tamizaje_manual" value={formData.codigo_tamizaje_manual} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">2. Datos del Participante</legend>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="nombres" className="block text-sm font-medium leading-6 text-gray-900">Nombres*</label>
                      <input type="text" id="nombres" name="nombres" value={formData.nombres} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="apellidos" className="block text-sm font-medium leading-6 text-gray-900">Apellidos*</label>
                      <input type="text" id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="tipo_doc" className="block text-sm font-medium leading-6 text-gray-900">Tipo Documento*</label>
                      <select id="tipo_doc" name="tipo_doc" value={formData.tipo_doc} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.tipo_doc.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="numero_documento" className="block text-sm font-medium leading-6 text-gray-900">Número Documento*</label>
                      <input type="number" id="numero_documento" name="numero_documento" value={formData.numero_documento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="nacionalidad" className="block text-sm font-medium leading-6 text-gray-900">Nacionalidad*</label>
                      <input type="text" id="nacionalidad" name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="fecha_nacimiento" className="block text-sm font-medium leading-6 text-gray-900">Fecha Nacimiento*</label>
                      <input type="text" id="fecha_nacimiento" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} placeholder="dd/mm/aaaa" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="sexo_asignado_nacimiento" className="block text-sm font-medium leading-6 text-gray-900">Sexo Asignado al Nacer*</label>
                      <select id="sexo_asignado_nacimiento" name="sexo_asignado_nacimiento" value={formData.sexo_asignado_nacimiento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.sexo_asignado_nacimiento.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="genero_identificado" className="block text-sm font-medium leading-6 text-gray-900">Género con el que se identifica</label>
                      <select id="genero_identificado" name="genero_identificado" value={formData.genero_identificado} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">Seleccione...</option>
                        {options.genero_identificado.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="orientacion_sexual" className="block text-sm font-medium leading-6 text-gray-900">Orientación Sexual</label>
                      <select id="orientacion_sexual" name="orientacion_sexual" value={formData.orientacion_sexual} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        <option value="">Seleccione...</option>
                        {options.orientacion_sexual.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="grupo_etnico" className="block text-sm font-medium leading-6 text-gray-900">Grupo Étnico*</label>
                      <select id="grupo_etnico" name="grupo_etnico" value={formData.grupo_etnico} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.grupo_etnico.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    {formData.grupo_etnico === 'Otro' && (
                      <div className="sm:col-span-3">
                        <label htmlFor="otro_grupo_etnico" className="block text-sm font-medium leading-6 text-gray-900">Especifique Otro Grupo Étnico</label>
                        <input type="text" id="otro_grupo_etnico" name="otro_grupo_etnico" value={formData.otro_grupo_etnico} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                      </div>
                    )}
                    <div className="sm:col-span-3">
                      <label htmlFor="poblacion_condicion_situacion" className="block text-sm font-medium leading-6 text-gray-900">Población Condición/Situación*</label>
                      <select id="poblacion_condicion_situacion" name="poblacion_condicion_situacion" value={formData.poblacion_condicion_situacion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.poblacion_condicion_situacion.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="poblacion_migrante" className="block text-sm font-medium leading-6 text-gray-900">Población Migrante*</label>
                      <select id="poblacion_migrante" name="poblacion_migrante" value={formData.poblacion_migrante} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.poblacion_migrante.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="tiene_seres_sintientes" className="block text-sm font-medium leading-6 text-gray-900">Tiene seres sintientes*</label>
                      <select id="tiene_seres_sintientes" name="tiene_seres_sintientes" value={formData.tiene_seres_sintientes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.tiene_seres_sintientes.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">3. Contacto y Ubicación</legend>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="telefono_contacto" className="block text-sm font-medium leading-6 text-gray-900">Teléfono*</label>
                      <input type="tel" id="telefono_contacto" name="telefono_contacto" value={formData.telefono_contacto} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="correo_electronico" className="block text-sm font-medium leading-6 text-gray-900">Correo Electrónico</label>
                      <input type="email" id="correo_electronico" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="sm:col-span-full">
                      <label htmlFor="direccion_residencia" className="block text-sm font-medium leading-6 text-gray-900">Dirección</label>
                      <input type="text" id="direccion_residencia" name="direccion_residencia" value={formData.direccion_residencia} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="comuna" className="block text-sm font-medium leading-6 text-gray-900">Comuna*</label>
                      <input type="text" id="comuna" name="comuna" value={formData.comuna} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="barrio_corregimiento_vereda" className="block text-sm font-medium leading-6 text-gray-900">Barrio/Vereda*</label>
                      <input type="text" id="barrio_corregimiento_vereda" name="barrio_corregimiento_vereda" value={formData.barrio_corregimiento_vereda} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="eps" className="block text-sm font-medium leading-6 text-gray-900">EPS*</label>
                      <input type="text" id="eps" name="eps" value={formData.eps} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="tipo_aseguramiento" className="block text-sm font-medium leading-6 text-gray-900">Tipo Aseguramiento</label>
                      <select id="tipo_aseguramiento" name="tipo_aseguramiento" value={formData.tipo_aseguramiento} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.tipo_aseguramiento.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="estrato_socioeconomico" className="block text-sm font-medium leading-6 text-gray-900">Estrato</label>
                      <input type="number" id="estrato_socioeconomico" name="estrato_socioeconomico" value={formData.estrato_socioeconomico} onChange={handleChange} min="0" max="6" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">4. Medidas Antropométricas</legend>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="talla" className="block text-sm font-medium leading-6 text-gray-900">Talla (cm)*</label>
                      <input type="number" step="0.1" id="talla" name="talla" value={formData.talla} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="peso" className="block text-sm font-medium leading-6 text-gray-900">Peso (Kg)*</label>
                      <input type="number" step="0.1" id="peso" name="peso" value={formData.peso} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="presion_sistolica" className="block text-sm font-medium leading-6 text-gray-900">Presión Sistólica (mmHg)*</label>
                      <input type="number" id="presion_sistolica" name="presion_sistolica" value={formData.presion_sistolica} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="presion_diastolica" className="block text-sm font-medium leading-6 text-gray-900">Presión Diastólica (mmHg)*</label>
                      <input type="number" id="presion_diastolica" name="presion_diastolica" value={formData.presion_diastolica} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="circunferencia_abdominal" className="block text-sm font-medium leading-6 text-gray-900">Circunferencia Abdominal (cm)</label>
                      <input type="number" id="circunferencia_abdominal" name="circunferencia_abdominal" value={formData.circunferencia_abdominal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">5. Factores de Riesgo y Hábitos</legend>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="actividad_fisica" className="block text-sm font-medium leading-6 text-gray-900">Actividad Física &gt;30min/día?*</label>
                      <select id="actividad_fisica" name="actividad_fisica" value={formData.actividad_fisica} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.actividad_fisica.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="frecuencia_frutas_verduras" className="block text-sm font-medium leading-6 text-gray-900">Consume Frutas/Verduras Diariamente?*</label>
                      <select id="frecuencia_frutas_verduras" name="frecuencia_frutas_verduras" value={formData.frecuencia_frutas_verduras} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.frecuencia_frutas_verduras.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="medicacion_hipertension" className="block text-sm font-medium leading-6 text-gray-900">Toma Medicamentos para HTA?*</label>
                      <select id="medicacion_hipertension" name="medicacion_hipertension" value={formData.medicacion_hipertension} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.medicacion_hipertension.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="glucosa_alta_historico" className="block text-sm font-medium leading-6 text-gray-900">Historial de Glucosa Alta?*</label>
                      <select id="glucosa_alta_historico" name="glucosa_alta_historico" value={formData.glucosa_alta_historico} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.glucosa_alta_historico.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="antecedentes_familiares_diabetes" className="block text-sm font-medium leading-6 text-gray-900">Antecedentes Familiares de Diabetes?*</label>
                      <select id="antecedentes_familiares_diabetes" name="antecedentes_familiares_diabetes" value={formData.antecedentes_familiares_diabetes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.antecedentes_familiares_diabetes.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="fuma" className="block text-sm font-medium leading-6 text-gray-900">¿Fuma actualmente?*</label>
                      <select id="fuma" name="fuma" value={formData.fuma} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.fuma.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor="es_diabetico" className="block text-sm font-medium leading-6 text-gray-900">¿Diagnosticado con Diabetes?*</label>
                      <select id="es_diabetico" name="es_diabetico" value={formData.es_diabetico} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.es_diabetico.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    {formData.es_diabetico === 'Si' && (
                      <div className="sm:col-span-3">
                        <label htmlFor="tipo_diabetes" className="block text-sm font-medium leading-6 text-gray-900">Tipo de Diabetes</label>
                        <select id="tipo_diabetes" name="tipo_diabetes" value={formData.tipo_diabetes} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                          {options.tipo_diabetes.map(opt => <option key={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="sm:col-span-full">
                      <label htmlFor="enfermedad_cardiovascular_renal_colesterol" className="block text-sm font-medium leading-6 text-gray-900">¿Tiene ECV, ERC o Hipercolesterolemia?*</label>
                      <select id="enfermedad_cardiovascular_renal_colesterol" name="enfermedad_cardiovascular_renal_colesterol" value={formData.enfermedad_cardiovascular_renal_colesterol} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                        {options.enfermedad_cardiovascular_renal_colesterol.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="text-lg font-semibold leading-6 text-indigo-700 border-b border-indigo-200 pb-2 w-full">6. Observaciones</legend>
                  <div className="mt-6">
                    <textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleChange} rows="4" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="Añada cualquier observación adicional aquí..." />
                  </div>
                </fieldset>
              </div>
            </div>
            <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
              <button type="submit" className="w-full sm:w-auto rounded-md bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                Guardar Tamizaje
              </button>
            </div>
          </form>
        </main>
        <aside className="lg:col-span-2 mt-8 lg:mt-0">
          <div className="sticky top-8 bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900">Resultados Calculados</h2>
              <p className="mt-1 text-sm text-gray-500">Los valores se actualizan en tiempo real.</p>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-600">Edad</span>
                  <span className="font-bold text-lg text-gray-800">{results.edad !== null && results.edad !== undefined ? `${results.edad} años` : '-- años'}</span>
                </div>
                <hr />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-600">IMC</span>
                  <span className="font-bold text-lg text-gray-800">{results.imc ? results.imc.toFixed(1) : '--'}</span>
                </div>
                <div className={`text-right font-semibold ${getColorForRisk(results.imcClass)}`}>{results.imcClass || '--'}</div>
                <hr />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-600">Riesgo FINDRISC</span>
                  <span className="font-bold text-lg text-gray-800">{results.findrisc ? `${results.findrisc.puntaje} Puntos` : '-- Puntos'}</span>
                </div>
                <div className={`text-right font-semibold ${getColorForRisk(results.findrisc?.clasificacion)}`}>{results.findrisc?.clasificacion || '--'}</div>
                <hr />
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-gray-600">Riesgo Cardiovascular (OMS)</span>
                  <span className="font-bold text-lg text-gray-800">{results.oms?.riesgoPorcentaje || '--'}</span>
                </div>
                <div className={`text-right font-semibold ${getColorForRisk(results.oms?.clasificacionRiesgo)}`}>{results.oms?.clasificacionRiesgo || '--'}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {notification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${notification.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                <i className={`fas ${notification.type === 'success' ? 'fa-check text-green-600' : 'fa-times text-red-600'} text-2xl`}></i>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">{notification.type === 'success' ? '¡Éxito!' : 'Error'}</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{notification.message}</p>
              </div>
              <div className="items-center px-4 py-3">
                <button onClick={() => setNotification(null)} className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

