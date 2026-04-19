import { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  loadTotalEnergyConsumption,
  loadCO2EmissionsBySource,
  loadLCOETrends,
  loadSeaLevel,
} from '../../data/loaders';
import type {
  TotalEnergyConsumptionRow,
  CO2EmissionsBySourceRow,
  LCOETrendRow,
  SeaLevelRow,
} from '../../types/data';
import {
  EnergyConsumptionChart,
  CO2BySourceChart,
  SeaLevelChart,
  LCOETrendsChart,
} from './charts';
import './ComparisonModal.css';

interface Props {
  onClose: () => void;
  dismissible?: boolean;
  title?: string;
}

export default function ComparisonModal({
  onClose,
  dismissible = true,
  title = 'Performance Comparison',
}: Props) {
  const { state, annualSnapshots } = useGame();
  const [energyData, setEnergyData] = useState<TotalEnergyConsumptionRow[]>([]);
  const [co2Data, setCo2Data] = useState<CO2EmissionsBySourceRow[]>([]);
  const [lcoeData, setLcoeData] = useState<LCOETrendRow[]>([]);
  const [seaData, setSeaData] = useState<SeaLevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadTotalEnergyConsumption(),
      loadCO2EmissionsBySource(),
      loadLCOETrends(),
      loadSeaLevel(),
    ])
      .then(([energy, co2, lcoe, sea]) => {
        setEnergyData(energy.data);
        setCo2Data(co2.data);
        setLcoeData(lcoe.data);
        setSeaData(sea.data);
        setLoading(false);
      })
      .catch((e) => {
        console.error('ComparisonModal load error:', e);
        setError('Failed to load comparison data.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, dismissible]);

  return (
    <div
      className="cmp-backdrop"
      onClick={dismissible ? onClose : undefined}
    >
      <div className="cmp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="cmp-header">
          <div>
            <h2 className="cmp-title">{title}</h2>
            <p className="cmp-subtitle">
              {state.currentYear} · {annualSnapshots.length} year
              {annualSnapshots.length === 1 ? '' : 's'} on record
            </p>
          </div>
          {dismissible && (
            <button className="cmp-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </header>

        <div className="cmp-body">
          {loading && <p className="cmp-status">Loading historical data…</p>}
          {error && <p className="cmp-status cmp-error">{error}</p>}

          {!loading && !error && (
            <>
              <section className="cmp-section">
                <h3 className="cmp-section-title">
                  U.S. Energy Consumption
                </h3>
                <p className="cmp-section-sub">
                  Historical primary-energy consumption (trillion BTU) with
                  your cumulative MWh overlaid on the right axis.
                </p>
                <EnergyConsumptionChart
                  historical={energyData}
                  snapshots={annualSnapshots}
                />
              </section>

              <section className="cmp-section">
                <h3 className="cmp-section-title">
                  Lifecycle CO₂ by Source
                </h3>
                <p className="cmp-section-sub">
                  Your effective emissions rate sits among the source-level
                  lifecycle values used to score your run.
                </p>
                <CO2BySourceChart
                  historical={co2Data}
                  snapshots={annualSnapshots}
                />
              </section>

              <section className="cmp-section">
                <h3 className="cmp-section-title">Sea Level</h3>
                <p className="cmp-section-sub">
                  Historical mean sea level vs. your projected rise (from
                  cumulative CO₂).
                </p>
                <SeaLevelChart
                  historical={seaData}
                  snapshots={annualSnapshots}
                />
              </section>

              <section className="cmp-section">
                <h3 className="cmp-section-title">
                  Energy Technology Cost Trends
                </h3>
                <p className="cmp-section-sub">
                  LCOE curves for each technology, with markers showing when
                  you built plants of that type.
                </p>
                <LCOETrendsChart
                  historical={lcoeData}
                  snapshots={annualSnapshots}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}