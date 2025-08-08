import KpiCard from './KpiCard';

export default function KpiGrid({ kpis }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Object.entries(kpis).map(([key, value]) => (
        <KpiCard key={key} title={key} value={value} />
      ))}
    </div>
  );
}
