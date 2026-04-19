import Papa from 'papaparse';

export interface EnergyMix {
  coal: number;
  naturalGas: number;
  petroleum: number;
  nuclear: number;
  hydro: number;
  renewables: number;
  other: number;
}

export interface HistoricalRow {
  year: number;
  mix: EnergyMix;
}

function parseDateToYear(dateStr: string): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 2) return null;
  const yy = parseInt(parts[1], 10);
  if (isNaN(yy)) return null;
  return yy <= 30 ? 2000 + yy : 1900 + yy;
}

export async function loadHistorical(): Promise<HistoricalRow[]> {
  const response = await fetch('/data/Generation_Energy_Percentages_Fixed%20(1).csv');
  const text = await response.text();

  const parsed = Papa.parse<Record<string, any>>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  const byYear = new Map<number, EnergyMix[]>();

  for (const row of parsed.data) {
    const dateValue =
      row[''] ??
      Object.values(row).find(
        (v) => typeof v === 'string' && /^[A-Z][a-z]{2}-\d{2}$/.test(v)
      );

    const year = parseDateToYear(String(dateValue));
    if (year === null) continue;

    const mix: EnergyMix = {
      coal: Number(row['Coal']) || 0,
      naturalGas: Number(row['Natural Gas']) || 0,
      petroleum:
        (Number(row['Petroleum Liquids']) || 0) +
        (Number(row['Petroleum Coke']) || 0),
      nuclear: Number(row['Nuclear']) || 0,
      hydro: Number(row['Hydroelectric']) || 0,
      renewables: Number(row['Other Renewables']) || 0,
      other:
        (Number(row['Other Gasses']) || 0) +
        (Number(row['Hydro-electric storage']) || 0) +
        (Number(row['Other']) || 0),
    };

    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(mix);
  }

  const result: HistoricalRow[] = [];
  for (const [year, months] of byYear.entries()) {
    const avg: EnergyMix = {
      coal: 0, naturalGas: 0, petroleum: 0, nuclear: 0,
      hydro: 0, renewables: 0, other: 0,
    };
    for (const m of months) {
      avg.coal += m.coal;
      avg.naturalGas += m.naturalGas;
      avg.petroleum += m.petroleum;
      avg.nuclear += m.nuclear;
      avg.hydro += m.hydro;
      avg.renewables += m.renewables;
      avg.other += m.other;
    }
    const n = months.length;
    avg.coal /= n;
    avg.naturalGas /= n;
    avg.petroleum /= n;
    avg.nuclear /= n;
    avg.hydro /= n;
    avg.renewables /= n;
    avg.other /= n;
    result.push({ year, mix: avg });
  }

  return result.sort((a, b) => a.year - b.year);
}

export function getHistoricalForYear(
  data: HistoricalRow[],
  year: number
): EnergyMix | null {
  return data.find((r) => r.year === year)?.mix ?? null;
}
