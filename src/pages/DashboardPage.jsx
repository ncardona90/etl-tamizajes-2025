import KpiGrid from '../components/dashboard/KpiGrid';
import MainChart from '../components/dashboard/MainChart';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import useTamizajes from '../hooks/useTamizajes';
import useKpiCalculator from '../hooks/useKpiCalculator';

export default function DashboardPage() {
  const { tamizajes } = useTamizajes();
  const kpis = useKpiCalculator(tamizajes || []);
  const chartData = (tamizajes || []).map((t) => ({
    name: t.fecha_intervencion,
    value: t.imc,
  }));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-4 space-y-4 overflow-auto">
          <KpiGrid kpis={kpis} />
          <MainChart data={chartData} />
        </main>
      </div>
    </div>
  );
}
