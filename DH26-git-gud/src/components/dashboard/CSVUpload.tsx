import { useState } from 'react';
import Papa from 'papaparse';
import type { EnergyMix } from './historicalLoader';

interface Props {
  onUpload: (mix: EnergyMix, year: number) => void;
}

export default function CSVUpload({ onUpload }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (result) => {
        const row = (result.data as any[])[0];
        if (!row) {
          setError('CSV is empty');
          return;
        }
        const year = Number(row.Year ?? row.year);
        if (isNaN(year)) {
          setError('Could not find a Year column');
          return;
        }
        const mix: EnergyMix = {
          coal: Number(row.Coal ?? row.coal ?? 0),
          naturalGas: Number(row.NaturalGas ?? row['Natural Gas'] ?? row.Gas ?? 0),
          petroleum: Number(row.Petroleum ?? row.Oil ?? 0),
          nuclear: Number(row.Nuclear ?? 0),
          hydro: Number(row.Hydro ?? row.Hydroelectric ?? 0),
          renewables: Number(row.Renewables ?? row.Solar ?? 0) + Number(row.Wind ?? 0),
          other: Number(row.Other ?? 0),
        };
        onUpload(mix, year);
      },
      error: (err) => setError(err.message),
    });
  };

  return (
    <div className="csv-upload">
      <label className="upload-btn">
        Upload your energy mix CSV
        <input type="file" accept=".csv" onChange={handleFile} hidden />
      </label>
      {filename && <p className="upload-filename">Loaded: {filename}</p>}
      {error && <p className="upload-error">Error: {error}</p>}
      <p className="upload-hint">
        Expected columns: Year, Coal, NaturalGas, Petroleum, Nuclear, Hydro, Renewables, Other
      </p>
    </div>
  );
}
