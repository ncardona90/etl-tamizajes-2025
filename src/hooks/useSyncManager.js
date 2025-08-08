import { useEffect, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { db } from '../db';

// Hook encargado de sincronizar los registros locales con Firestore
export function useSyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRecords();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // intento inicial de sincronización
    if (navigator.onLine) {
      syncPendingRecords();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncPendingRecords = async () => {
    const pendings = await db.tamizajes.where('sync_status').equals('pending').toArray();
    for (const item of pendings) {
      try {
        const docRef = await addDoc(collection(firestore, 'tamizajes'), item);
        await db.tamizajes.update(item.local_id, {
          sync_status: 'synced',
          firestore_id: docRef.id,
        });
      } catch (e) {
        console.error('Error syncing record', e);
      }
    }
  };

  return { isOnline, syncPendingRecords };
}

export default useSyncManager;
