import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <nav className="w-48 bg-gray-100 p-4 space-y-2">
      <Link className="block" to="/dashboard">Dashboard</Link>
      <Link className="block" to="/nuevo">Nuevo Tamizaje</Link>
      <Link className="block" to="/lista">Mis Tamizajes</Link>
    </nav>
  );
}
