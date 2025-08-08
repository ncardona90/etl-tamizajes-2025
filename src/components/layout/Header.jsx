import SyncStatusIndicator from '../shared/SyncStatusIndicator';
import useAuth from '../../hooks/useAuth';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between bg-white shadow p-4">
      <h1 className="font-bold">Tamizaje</h1>
      <div className="flex items-center space-x-4">
        <SyncStatusIndicator />
        {user && (
          <button className="text-sm text-red-600" onClick={logout}>
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
}
