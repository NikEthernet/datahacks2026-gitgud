import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { EnergyMix } from './historicalLoader';

interface Props {
  userMix: EnergyMix;
  historicalMix: EnergyMix;
  year: number;
}

const LABELS: Record<keyof EnergyMix, string> = {
  coal: 'Coal',
  naturalGas: 'Natural Gas',
  petroleum: 'Petroleum',
  nuclear: 'Nuclear',
  hydro: 'Hydro',
  renewables: 'Renewables',
  other: 'Other',
};

export default function ComparisonChart({ userMix, historicalMix, year }: Props) {
  const sources: (keyof EnergyMix)[] = [
    'coal', 'naturalGas', 'petroleum', 'nuclear', 'hydro', 'renewables', 'other',
  ];

  const data = sources.map((source) => ({
    source: LABELS[source],
    Your: Number(userMix[source].toFixed(2)),
    Historical: Number(historicalMix[source].toFixed(2)),
  }));

  return (
    <div className="comparison-chart">
      <h3>Your mix vs. actual {year} mix</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="source" />
          <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Your" fill="#4ade80" />
          <Bar dataKey="Historical" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
