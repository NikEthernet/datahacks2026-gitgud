import { useEffect, useState } from 'react';
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { loadTotalEnergyConsumption, loadCO2EmissionsBySource, loadLCOETrends, loadSeaLevel } from '../../data/loaders';
import type { TotalEnergyConsumptionRow, CO2EmissionsBySourceRow, LCOETrendRow, SeaLevelRow } from '../../types/data';
import './DataPresentation.css';

function DataPresentation() {
  const [energyData, setEnergyData] = useState<TotalEnergyConsumptionRow[]>([]);
  const [co2Data, setCo2Data]       = useState<CO2EmissionsBySourceRow[]>([]);
  const [lcoeData, setLcoeData]     = useState<LCOETrendRow[]>([]);
  const [seaData, setSeaData]       = useState<SeaLevelRow[]>([]);

  useEffect(() => {
    loadTotalEnergyConsumption().then(d => setEnergyData(d.data));
    loadCO2EmissionsBySource().then(d => setCo2Data(d.data));
    loadLCOETrends().then(d => setLcoeData(d.data));
    loadSeaLevel().then(d => setSeaData(d.data));
  }, []);

  return (
    <div className="data-presentation">
      <section className="dp-hero">
        <h1>The Data Behind the Game</h1>
        <p className="dp-subtitle">
          Every mechanic in this simulation is calibrated to real-world measurements.
          Below: the datasets we used, what they reveal, and why they matter.
        </p>
      </section>

      <section className="dp-section">
        <h2>Methodology</h2>
        <p>
          We integrated four primary datasets: U.S. energy consumption from the
          Energy Information Administration (EIA), annual CO₂ emissions by sector,
          sea-level anomalies from Scripps Oceanography, and CalCOFI oceanographic
          sampling data. Each player action in the game is scored against these
          historical baselines.
        </p>
      </section>

      {/* ── Dataset 1: Energy Consumption ── */}
      <section className="dp-section">
        <h2>Dataset 1: U.S. Energy Consumption (EIA)</h2>
        <div className="dp-chart">
          {energyData.length === 0 ? (
            <p className="dp-placeholder">Loading energy data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={energyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e1dd" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Total consumption"
                  stroke="#f9a03f"
                  fill="#f9a03f"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <p>
          Sourced from the EIA's open data API. Covers all major energy sectors
          from 1949 to 2025. The post-1973 plateau and the 2008 dip are both
          visible — and both are modelled as in-game events.
        </p>
      </section>

      {/* ── Dataset 2: CO₂ Emissions by Source ── */}
      <section className="dp-section">
        <h2>Dataset 2: Lifecycle CO₂ Emissions by Source</h2>
        <div className="dp-chart">
          {co2Data.length === 0 ? (
            <p className="dp-placeholder">Loading emissions data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={co2Data} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e1dd" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'tons CO₂ / MWh', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
                />
                <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(3) : v)} />
                <Bar dataKey="tonsPerMWh" name="tons CO₂/MWh" fill="#415a77" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <p>
          Lifecycle emissions per MWh across every plant type in the game. Coal
          and petroleum are roughly 100× dirtier than nuclear or wind — the same
          ratio used when calculating the player's in-game emissions score.
        </p>
      </section>

      {/* ── Dataset 3: Sea Level ── */}
      <section className="dp-section">
        <h2>Dataset 3: Sea-Level Change (Scripps + CSIRO)</h2>
        <div className="dp-chart">
          {seaData.length === 0 ? (
            <p className="dp-placeholder">Loading sea-level data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={seaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e1dd" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Total SSH (m)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Mean MSL (mm)', angle: 90, position: 'insideRight', fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalSSH"
                  name="Total SSH (m)"
                  stroke="#0d1b2a"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="meanMSL"
                  name="Mean MSL (mm)"
                  stroke="#f9a03f"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p>
          Derived by combining two datasets: summed sea surface height (SSH) anomalies
          across all sampled lat/lon points from Scripps Oceanography's Gulf of Mexico
          measurements, and mean monthly sea level (MSL) from CSIRO's global tide gauge
          record. Only years present in both datasets are shown. Rising SSH and MSL
          together confirm the long-term trend that the game's end-state scoring is
          measured against.
        </p>
      </section>

      {/* ── Dataset 4: LCOE Trends ── */}
      <section className="dp-section">
        <h2>Dataset 4: Energy Technology Cost Trends (LCOE)</h2>
        <div className="dp-chart">
          {lcoeData.length === 0 ? (
            <p className="dp-placeholder">Loading LCOE data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={lcoeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e1dd" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="solarPV"    name="Solar PV"    stroke="#f9a03f" dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="wind"       name="Wind"        stroke="#415a77" dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="naturalGas" name="Natural Gas" stroke="#778da9" dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="coal"       name="Coal"        stroke="#0d1b2a" dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="nuclear"    name="Nuclear"     stroke="#8b5cf6" dot={false} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p>
          The solar and wind cost collapse from 2009–2023 is real and dramatic —
          and it's the economic engine behind the game's renewable transition.
          Build costs for every plant type are calibrated directly from this data.
        </p>
      </section>

      <section className="dp-section">
        <h2>How the Data Powers the Game</h2>
        <p>
          Energy plant capacities, build costs, emissions factors, and lifespan
          values all derive from real EIA and NREL specifications. Historical
          events (oil embargoes, nuclear accidents, renewable incentives) trigger
          in the years they actually occurred, with their real-world economic
          and public-opinion effects baked into the game's state transitions.
        </p>
      </section>
    </div>
  );
}

export default DataPresentation;