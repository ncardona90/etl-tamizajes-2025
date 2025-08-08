import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function MainChart({ data = [] }) {
  return (
    <div className="h-64 bg-white rounded shadow p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#1d4ed8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
