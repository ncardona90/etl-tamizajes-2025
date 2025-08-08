import Dexie from 'dexie';

export const db = new Dexie('HealthScreeningDB');

// Definición de la tabla de tamizajes en IndexedDB
// Contiene solo algunos campos de ejemplo; el resto se puede extender según el formulario

db.version(1).stores({
  tamizajes: `
    ++local_id,
    firestore_id,
    sync_status,
    last_modified,
    numero_documento,
    nombre_completo,
    fecha_intervencion,
    edad,
    genero,
    imc,
    riesgo_cardiovascular,
    riesgo_findrisc
  `,
});

export default db;
