import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import useTamizajes from '../hooks/useTamizajes';

export default function TamizajeListPage() {
  const { tamizajes } = useTamizajes();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-4 overflow-auto">
          <table className="w-full text-left border">
            <thead>
              <tr>
                <th className="p-2 border-b">Documento</th>
                <th className="p-2 border-b">Nombre</th>
                <th className="p-2 border-b">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(tamizajes || []).map((t) => (
                <tr key={t.local_id} className="border-b">
                  <td className="p-2">{t.numero_documento}</td>
                  <td className="p-2">{t.nombre_completo}</td>
                  <td className="p-2">{t.sync_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}
