import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceDot,
} from 'recharts';
import type { AnnualSnapshot } from '../../game/dataLogger';
import type {
  TotalEnergyConsumptionRow,
  CO2EmissionsBySourceRow,
  LCOETrendRow,
  SeaLevelRow,
} from '../../types/data';
import type { PlantType } from '../../types/game';

const COLORS = {
  orange: '#f9a03f',
  steel: '#415a77',
  ink: '#0d1b2a',
  muted: '#778da9',
  purple: '#8b5cf6',
  grid: '#e0e1dd',
  playerAccent: '#1b5e20',
};

// ------------------------------------------------------------
// Chart 1 — Energy Consumption
// Historical area chart + player's cumulative MWh on secondary axis
// ------------------------------------------------------------
export function EnergyConsumptionChart({
  historical,
  snapshots,
}: {
  historical: TotalEnergyConsumptionRow[];
  snapshots: AnnualSnapshot[];
}) {
  const playerByYear = new Map(
    snapshots.map((s) => [s.year, s.totalEnergyProducedMWh])
  );
  const merged = historical.map((h) => ({
    year: h.year,
    Historical: h.value,
    You: playerByYear.get(h.year) ?? null,
  }));

  return (
    <div className="cmp-chart">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Trillion BTU',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: 'Your MWh',
              angle: 90,
              position: 'insideRight',
              fontSize: 11,
            }}
          />
          <Tooltip />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="Historical"
            name="US consumption (BTU)"
            stroke={COLORS.orange}
            fill={COLORS.orange}
            fillOpacity={0.25}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="You"
            name="Your cumulative MWh"
            stroke={COLORS.playerAccent}
            strokeWidth={2.5}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ------------------------------------------------------------
// Chart 2 — CO2 by Source
// Historical per-source bars + a marker line showing the player's
// effective tons/MWh (total CO2 / total MWh produced)
// ------------------------------------------------------------
export function CO2BySourceChart({
  historical,
  snapshots,
}: {
  historical: CO2EmissionsBySourceRow[];
  snapshots: AnnualSnapshot[];
}) {
  const latest = snapshots[snapshots.length - 1];
  const playerRate =
    latest && latest.totalEnergyProducedMWh > 0
      ? latest.totalCO2EmittedTons / latest.totalEnergyProducedMWh
      : 0;

  const data = historical.map((row) => ({
    source: row.source,
    'tons/MWh': row.tonsPerMWh,
  }));
  // Insert player row at top for visual prominence
  data.unshift({ source: 'Your Mix', 'tons/MWh': playerRate });

  return (
    <div className="cmp-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            label={{
              value: 'tons CO₂ / MWh',
              position: 'insideBottomRight',
              offset: -5,
              fontSize: 11,
            }}
          />
          <YAxis
            type="category"
            dataKey="source"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : v)}
          />
          <Bar
            dataKey="tons/MWh"
            radius={[0, 4, 4, 0]}
            fill={COLORS.steel}
            // Recharts lets us color individual cells via the "fill" of
            // each data point if we pass it, but the simpler trick is
            // to just accept a uniform color here and let the "Your Mix"
            // row stand out via position.
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ------------------------------------------------------------
// Chart 3 — Sea Level
// Historical monthly MSL line + player's projected rise
// ------------------------------------------------------------
export function SeaLevelChart({
  historical,
  snapshots,
}: {
  historical: SeaLevelRow[];
  snapshots: AnnualSnapshot[];
}) {
  // Map player snapshots into a month-keyed format so we can merge
  // them onto the same x-axis. Player snapshots are annual (Jan of
  // each year), so we plot them at "YYYY-01".
  const playerByMonth = new Map(
    snapshots.map((s) => [`${s.year}-01`, s.projectedSeaLevelM * 1000])
    // × 1000 to match the historical dataset's millimeter units
  );

  const merged = historical.map((row) => ({
    month: row.month,
    'Historical (mm)': row.combinedSealevel,
    'Your projected (mm)': playerByMonth.get(row.month) ?? null,
  }));

  return (
    <div className="cmp-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={merged} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11 }}
            interval={47}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: 'mm',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
            }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Historical (mm)"
            stroke={COLORS.orange}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="Your projected (mm)"
            stroke={COLORS.playerAccent}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ------------------------------------------------------------
// Chart 4 — LCOE Trends
// Multi-line historical + ReferenceDots where the player built
// each technology (first build year per type)
// ------------------------------------------------------------
export function LCOETrendsChart({
  historical,
  snapshots,
}: {
  historical: LCOETrendRow[];
  snapshots: AnnualSnapshot[];
}) {
  // For each plant type, find the first year the player had any of them.
  const firstBuildYear: Partial<Record<PlantType, number>> = {};
  for (const s of snapshots) {
    for (const type of Object.keys(s.plantsByType) as PlantType[]) {
      if (s.plantsByType[type] > 0 && firstBuildYear[type] === undefined) {
        firstBuildYear[type] = s.year;
      }
    }
  }

  // Helper to find the LCOE value at a given year for a given technology key.
  const lcoeAt = (
    year: number,
    key: 'solarPV' | 'wind' | 'naturalGas' | 'coal' | 'nuclear'
  ): number | null => {
    const row = historical.find((r) => r.year === year);
    return row ? row[key] : null;
  };

  const markers: Array<{
    year: number;
    value: number;
    label: string;
    color: string;
  }> = [];

  if (firstBuildYear.solar !== undefined) {
    const v = lcoeAt(firstBuildYear.solar, 'solarPV');
    if (v !== null) markers.push({ year: firstBuildYear.solar, value: v, label: 'Solar', color: COLORS.orange });
  }
  if (firstBuildYear.wind !== undefined) {
    const v = lcoeAt(firstBuildYear.wind, 'wind');
    if (v !== null) markers.push({ year: firstBuildYear.wind, value: v, label: 'Wind', color: COLORS.steel });
  }
  if (firstBuildYear.natural_gas !== undefined) {
    const v = lcoeAt(firstBuildYear.natural_gas, 'naturalGas');
    if (v !== null) markers.push({ year: firstBuildYear.natural_gas, value: v, label: 'Gas', color: COLORS.muted });
  }
  if (firstBuildYear.coal !== undefined) {
    const v = lcoeAt(firstBuildYear.coal, 'coal');
    if (v !== null) markers.push({ year: firstBuildYear.coal, value: v, label: 'Coal', color: COLORS.ink });
  }
  if (firstBuildYear.nuclear !== undefined) {
    const v = lcoeAt(firstBuildYear.nuclear, 'nuclear');
    if (v !== null) markers.push({ year: firstBuildYear.nuclear, value: v, label: 'Nuclear', color: COLORS.purple });
  }

  return (
    <div className="cmp-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={historical}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: '$/MWh',
              angle: -90,
              position: 'insideLeft',
              fontSize: 11,
            }}
          />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="solarPV" name="Solar PV" stroke={COLORS.orange} dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="wind" name="Wind" stroke={COLORS.steel} dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="naturalGas" name="Natural Gas" stroke={COLORS.muted} dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="coal" name="Coal" stroke={COLORS.ink} dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="nuclear" name="Nuclear" stroke={COLORS.purple} dot={false} strokeWidth={2} connectNulls />
          {markers.map((m, i) => (
            <ReferenceDot
              key={i}
              x={m.year}
              y={m.value}
              r={6}
              fill={m.color}
              stroke="#fff"
              strokeWidth={2}
              label={{ value: `${m.label} ✓`, position: 'top', fontSize: 10, fill: COLORS.ink }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}