import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// Hook para interactuar con la tabla de tamizajes en IndexedDB
export function useTamizajes(filters = {}) {
  const tamizajes = useLiveQuery(async () => {
    let collection = db.tamizajes;
    // Filtros simples por campos clave
    if (filters.numero_documento) {
      collection = collection
        .where('numero_documento')
        .equals(filters.numero_documento);
    }
    return collection.toArray();
  }, [filters]);

  const addTamizaje = async (data) => {
    await db.tamizajes.add({
      ...data,
      sync_status: 'pending',
      last_modified: new Date().toISOString(),
    });
  };

  const updateTamizaje = async (id, data) => {
    await db.tamizajes.update(id, {
      ...data,
      sync_status: 'pending',
      last_modified: new Date().toISOString(),
    });
  };

  return { tamizajes, addTamizaje, updateTamizaje };
}

export default useTamizajes;
