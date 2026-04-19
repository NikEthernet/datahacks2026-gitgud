import { useEffect, useState } from 'react';
import CSVUpload from './CSVUpload';
import ComparisonChart from './ComparisonChart';
import {
  loadHistorical,
  getHistoricalForYear,
  type EnergyMix,
  type HistoricalRow,
} from './historicalLoader';
import './Dashboard.css';

export default function Dashboard() {
  const [historical, setHistorical] = useState<HistoricalRow[]>([]);
  const [userMix, setUserMix] = useState<EnergyMix | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistorical()
      .then((rows) => {
        setHistorical(rows);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load historical data:', err);
        setLoading(false);
      });
  }, []);

  const handleUpload = (mix: EnergyMix, uploadedYear: number) => {
    setUserMix(mix);
    setYear(uploadedYear);
  };

  const historicalMix =
    year !== null ? getHistoricalForYear(historical, year) : null;

  return (
    <div className="dashboard">
      <h1>Energy Mix Dashboard</h1>
      {loading && <p>Loading historical data...</p>}

      <CSVUpload onUpload={handleUpload} />

      {userMix && year !== null && historicalMix && (
        <ComparisonChart
          userMix={userMix}
          historicalMix={historicalMix}
          year={year}
        />
      )}

      {userMix && year !== null && !historicalMix && (
        <p>No historical data found for year {year}.</p>
      )}
    </div>
  );
}
