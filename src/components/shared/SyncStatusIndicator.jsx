import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import useSyncManager from '../../hooks/useSyncManager';

export default function SyncStatusIndicator() {
  const { isOnline } = useSyncManager();
  const pending = useLiveQuery(
    () => db.tamizajes.where('sync_status').equals('pending').count(),
    [],
    0,
  );

  return (
    <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
      {isOnline ? 'Online' : 'Offline'} {pending > 0 && `(${pending})`}
    </span>
  );
}
