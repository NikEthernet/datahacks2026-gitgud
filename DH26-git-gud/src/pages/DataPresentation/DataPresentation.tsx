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
    loadSeaLevel()
      .then(d => {
        console.log('Total rows:', d.rowCount);
        console.log('First 3 rows:', d.data.slice(0, 3));
        setSeaData(d.data);
      })
      .catch(err => console.error('loadSeaLevel failed:', err));
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

      {/* ── Dataset 1: U.S. Energy Consumption ── */}
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
          visible and will be modeled in-game using real life events implemented
          throughout the game. 
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
          and petroleum are roughly 100× dirtier than nuclear or wind which is the same
          ratio used when calculating the player's in-game emissions score.
        </p>
      </section>

      {/* ── Dataset 3: Sea Level (Cleaned_Sea_Level_Variation.csv + Sea_Level_Rise_Formatted.csv) ── */}
      <section className="dp-section">
        <h2>Dataset 3: Sea-Level Change (Scripps + CSIRO)</h2>
        <div className="dp-chart">
          {seaData.length === 0 ? (
            <p className="dp-placeholder">Loading sea-level data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={seaData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e1dd" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  interval={23}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Sea Level (mm)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="combinedSealevel"
                  name="Mean Sea Level (mm)"
                  stroke="#f9a03f"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p>
          Derived by combining two datasets: sea surface height (SSH) anomalies
          from Scripps Oceanography's Gulf of Mexico measurements
          (Cleaned_Sea_Level_Variation.csv), and mean monthly sea level (MSL)
          from CSIRO's global tide gauge record (Sea_Level_Rise_Formatted.csv).
          Both are in millimetres and are plotted together per month. Only months
          present in both datasets are shown. The MSL is scaled to not include seasonal
          changes but we decided to implement the scripps sea level variation data 
          to help simulate the Gulf of Mexico's coast of the USA.
        </p>
      </section>

      {/* ── Dataset 4: LCOE Trends (Energy Technology LCOE Trends.csv) ── */}
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
          This graphs gives us some impactful insights into the cost of energy,
          especially solar power. This data along with other sets inform our costs that we
          innput into the game, year to year. Oil is not included in this data set due to the extreme
          volatility that oil markets have in response to global/local events. Instead, we implemented a
          dataset that had the PPI of crude oil and the general cost of coal to scale the cost of coal
          throughout our game. 
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