import { useState, useEffect } from 'react';
import { loadTotalEnergyConsumption } from '../../data/loaders';
import {
  getStartingBudgetForYear,
  getSelectableStartYears,
} from '../../game/budgetCalibration';
import type { TotalEnergyConsumptionRow } from '../../types/data';
import './YearSelect.css';

interface YearSelectProps {
  onStart: (year: number, startingMoney: number) => void;
}

function YearSelect({ onStart }: YearSelectProps) {
  const [consumptionData, setConsumptionData] = useState
    TotalEnergyConsumptionRow[]
  >([]);
  const [selectedYear, setSelectedYear] = useState<number>(1949);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTotalEnergyConsumption()
      .then((result) => {
        setConsumptionData(result.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const years = getSelectableStartYears();
  const budget = consumptionData.length
    ? getStartingBudgetForYear(consumptionData, selectedYear)
    : 2000;

  const handleStart = () => onStart(selectedYear, budget);

  return (
    <div className="year-select">
      <div className="year-select-inner">
        <h1 className="year-select-title">Choose Your Starting Era</h1>
        <p className="year-select-subtitle">
          Pick the year you'll begin managing the US energy grid. Your
          starting budget scales with the real energy demand of that era —
          later starts have more capital but a much bigger grid to maintain.
        </p>

        <div className="year-display-card">
          <div className="year-display-year">{selectedYear}</div>
          <div className="year-display-budget">
            Starting Budget:{' '}
            <strong>${(budget / 1000).toFixed(2)}B</strong>
          </div>
          <div className="year-display-note">
            Game ends in December 2025 —{' '}
            <strong>{2025 - selectedYear + 1} years of play</strong>
          </div>
        </div>

        {loading ? (
          <p className="year-loading">Loading historical data…</p>
        ) : (
          <div className="year-grid">
            {years.map((y) => (
              <button
                key={y}
                className={`year-btn ${selectedYear === y ? 'selected' : ''}`}
                onClick={() => setSelectedYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <button
          className="year-start-btn"
          onClick={handleStart}
          disabled={loading}
        >
          ▶ Start in {selectedYear}
        </button>
      </div>
    </div>
  );
}

export default YearSelect;