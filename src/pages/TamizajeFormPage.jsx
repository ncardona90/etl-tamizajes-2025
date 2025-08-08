import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import DatosPersonalesSection from '../components/form/DatosPersonalesSection';
import MedicionesSection from '../components/form/MedicionesSection';
import useTamizajes from '../hooks/useTamizajes';

export default function TamizajeFormPage() {
  const navigate = useNavigate();
  const { addTamizaje } = useTamizajes();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addTamizaje(formData);
    navigate('/lista');
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-4 overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DatosPersonalesSection formData={formData} setFormData={setFormData} />
            <MedicionesSection formData={formData} setFormData={setFormData} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
              Guardar
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
