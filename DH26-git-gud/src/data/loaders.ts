import Papa from 'papaparse';
import type {
  GenerationMixRow,
  TotalEnergyConsumptionRow,
  SolarLCOERow,
  PPIRow,
  SolarConsumptionRow,
  CO2EmissionsBySourceRow,
  LCOETrendRow,
  SeaLevelRow,
  LoadedDataset,
} from '../types/data';

// ============================================================
// BASE FETCHER — just grabs raw CSV text
// ============================================================

/**
 * Fetches raw CSV text from public/data/.
 * Each loader parses the text itself using whatever logic it needs.
 */
async function fetchCSV(fileName: string): Promise<string> {
  const response = await fetch(`/data/${fileName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${fileName}: ${response.status}`);
  }
  return response.text();
}

/**
 * Wraps loaded data with metadata.
 */
function wrapDataset<T>(data: T[], fileName: string): LoadedDataset<T> {
  return {
    data,
    loadedAt: new Date(),
    rowCount: data.length,
    sourceFile: fileName,
  };
}

// ============================================================
// GENERATION MIX LOADER (Jan-01 date format)
// ============================================================

function parseShortDate(shortDate: string): { year: number; month: number } | null {
  const match = /^([A-Za-z]{3})-(\d{2})$/.exec(shortDate.trim());
  if (!match) return null;

  const monthMap: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const month = monthMap[match[1]];
  if (!month) return null;

  const yearSuffix = parseInt(match[2], 10);
  const year = 2000 + yearSuffix;
  return { year, month };
}

export async function loadGenerationMix(): Promise<LoadedDataset<GenerationMixRow>> {
  const text = await fetchCSV('Generation_Energy_Percentages_Fixed (1).csv');

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: GenerationMixRow[] = [];
        for (const row of results.data) {
          const dateStr = row[''];
          if (!dateStr) continue;

          const parsed = parseShortDate(dateStr);
          if (!parsed) continue;

          rows.push({
            year: parsed.year,
            month: parsed.month,
            all: parseFloat(row['All']) || 0,
            coal: parseFloat(row['Coal']) || 0,
            petroleumLiquids: parseFloat(row['Petroleum Liquids']) || 0,
            petroleumCoke: parseFloat(row['Petroleum Coke']) || 0,
            naturalGas: parseFloat(row['Natural Gas']) || 0,
            otherGases: parseFloat(row['Other Gasses']) || 0,
            nuclear: parseFloat(row['Nuclear']) || 0,
            hydroelectric: parseFloat(row['Hydroelectric']) || 0,
            otherRenewables: parseFloat(row['Other Renewables']) || 0,
            hydroelectricStorage: parseFloat(row['Hydro-electric storage']) || 0,
            other: parseFloat(row['Other']) || 0,
          });
        }
        resolve(wrapDataset(rows, 'Generation_Energy_Percentages_Fixed (1).csv'));
      },
      error: reject,
    });
  });
}

// ============================================================
// TOTAL ENERGY CONSUMPTION LOADER
// ============================================================

export async function loadTotalEnergyConsumption(): Promise<
  LoadedDataset<TotalEnergyConsumptionRow>
> {
  const text = await fetchCSV('energy_data_total_updated.csv');

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: TotalEnergyConsumptionRow[] = results.data
          .filter((r) => r.period && r.value)
          .map((r) => ({
            year: Number(r.period),
            msn: String(r.msn),
            description: String(r.seriesDescription),
            value: Number(r.value),
            unit: String(r.unit),
          }));
        resolve(wrapDataset(rows, 'energy_data_total_updated.csv'));
      },
      error: reject,
    });
  });
}

// ============================================================
// SOLAR LCOE (1990-2025 extrapolated)
// ============================================================

export async function loadSolarLCOE(): Promise<LoadedDataset<SolarLCOERow>> {
  const text = await fetchCSV('Solar_LCOE_1990_2025_Extrapolated.csv');

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: SolarLCOERow[] = results.data
          .filter((r) => r.Year)
          .map((r) => ({
            year: Number(r.Year),
            lcoePerKWh: Number(r['LCOE (2023 USD/kWh)']),
          }));
        resolve(wrapDataset(rows, 'Solar_LCOE_1990_2025_Extrapolated.csv'));
      },
      error: reject,
    });
  });
}

// ============================================================
// PPI LOADERS (coal, gas, petroleum, industrial)
// ============================================================

async function loadPPI(
  fileName: string,
  nominalColumn: string,
  indexColumn: string
): Promise<LoadedDataset<PPIRow>> {
  const text = await fetchCSV(fileName);

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: PPIRow[] = results.data
          .filter((r) => r.date)
          .map((r) => ({
            date: String(r.date),
            year: Number(r.year),
            month: Number(r.month),
            decade: Number(r.decade),
            nominal: Number(r[nominalColumn]),
            index2024base: Number(r[indexColumn]),
            momPct: r.mom_pct ? Number(r.mom_pct) : null,
            yoyPct: r.yoy_pct ? Number(r.yoy_pct) : null,
            rollingVol12m: r.rolling_vol_12m ? Number(r.rolling_vol_12m) : null,
            shock: String(r.shock).toLowerCase() === 'true',
            direction: (r.direction || 'flat') as 'up' | 'down' | 'flat',
            event: r.event || null,
          }));
        resolve(wrapDataset(rows, fileName));
      },
      error: reject,
    });
  });
}

export const loadCoalPPI = () =>
  loadPPI('coal_ppi_enriched.csv', 'coal_ppi_nominal', 'coal_index_2024base');

export const loadGasPPI = () =>
  loadPPI('gas_ppi_enriched.csv', 'gas_ppi', 'gas_index_2024base');

export const loadPetroleumPPI = () =>
  loadPPI('petroleum_ppi_enriched.csv', 'petroleum_ppi_nominal', 'petroleum_index_2024base');

export const loadIndustrialPPI = () =>
  loadPPI('industrial_power_ppi_enriched.csv', 'industrial_ppi_nominal', 'industrial_index_2024base');

// ============================================================
// SOLAR CONSUMPTION LOADER
// ============================================================

export async function loadSolarConsumption(): Promise<
  LoadedDataset<SolarConsumptionRow>
> {
  const text = await fetchCSV('SolarPowerConsumption.csv');

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: SolarConsumptionRow[] = [];
        for (const r of results.data) {
          const yyyymm = String(r.YYYYMM || '');
          if (yyyymm.length !== 6) continue;

          const year = Number(yyyymm.substring(0, 4));
          const month = Number(yyyymm.substring(4, 6));

          // Skip month 13 (annual totals in this dataset)
          if (month < 1 || month > 12) continue;

          const rawValue = String(r.Value || '');
          const parsed = rawValue === 'Not Available' ? null : Number(rawValue);
          const value = parsed !== null && isNaN(parsed) ? null : parsed;

          rows.push({
            msn: String(r.MSN),
            year,
            month,
            value,
            description: String(r.Description),
            unit: String(r.Unit),
          });
        }
        resolve(wrapDataset(rows, 'SolarPowerConsumption.csv'));
      },
      error: reject,
    });
  });
}


// ============================================================
// CO2 EMISSIONS BY SOURCE LOADER
// ============================================================

function normalizeSourceName(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith('coal')) return 'coal';
  if (trimmed.startsWith('oil') || trimmed.includes('petroleum')) return 'petroleum';
  if (trimmed.startsWith('natural gas')) return 'natural_gas';
  if (trimmed.startsWith('solar')) return 'solar';
  if (trimmed.startsWith('wind')) return 'wind';
  if (trimmed.startsWith('hydro')) return 'hydro';
  if (trimmed.startsWith('nuclear')) return 'nuclear';
  if (trimmed.startsWith('geothermal')) return 'geothermal';
  return trimmed;
}

function parseNumberWithCommas(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

export async function loadCO2EmissionsBySource(): Promise<
  LoadedDataset<CO2EmissionsBySourceRow>
> {
  const text = await fetchCSV(
    'Energy Source CO2 Emissions Comparison - Energy Source CO2 Emissions Comparison.csv'
  );

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: CO2EmissionsBySourceRow[] = [];
        for (const r of results.data) {
          const source = r['Energy Source'];
          const emissionsRaw = r['Lifecycle Emissions (kg/MWh)'];
          if (!source || !emissionsRaw) continue;

          const kgPerMWh = parseNumberWithCommas(emissionsRaw);
          if (isNaN(kgPerMWh)) continue;

          rows.push({
            source: normalizeSourceName(source),
            tonsPerMWh: kgPerMWh / 1000,
          });
        }
        resolve(wrapDataset(rows, 'co2_emissions_by_source.csv'));
      },
      error: reject,
    });
  });
}

// ============================================================
// LCOE TRENDS LOADER
// ============================================================

function parseDollarValue(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,]/g, '').trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export async function loadLCOETrends(): Promise<LoadedDataset<LCOETrendRow>> {
  const text = await fetchCSV(
    'Energy Technology LCOE Trends - Energy Technology LCOE Trends.csv'
  );

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: LCOETrendRow[] = results.data
          .filter((r) => r.Year)
          .map((r) => ({
            year: Number(r.Year),
            solarPV: parseDollarValue(r['Solar PV($/MWh)']),
            wind: parseDollarValue(r['Wind($/MWh)']),
            naturalGas: parseDollarValue(r['Natural Gas ($/MWh)']),
            coal: parseDollarValue(r['Coal($/MWh)']),
            nuclear: parseDollarValue(r['Nuclear($/MWh)']),
          }));
        resolve(wrapDataset(rows, 'lcoe_trends.csv'));
      },
      error: reject,
    });
  });
}
//SEA LEVEL 
export async function loadSeaLevel(): Promise<LoadedDataset<SeaLevelRow>> {
  const [csvA, csvB] = await Promise.all([
    fetchCSV('Cleaned_Sea_Level_Variation.csv'),
    fetchCSV('Sea_Level_Rise_Formatted.csv'),
  ]);

  // --- Sum ssh per year from Cleaned_Sea_Level_Variation.csv ---
  // "Month" column format: "1993-01"
  const sshByYear = new Map<number, number>();

  await new Promise<void>((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvA, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        for (const r of results.data) {
          const year = parseInt((r['Month'] ?? '').slice(0, 4), 10);
          const ssh = parseFloat(r['ssh']);
          if (isNaN(year) || isNaN(ssh)) continue;
          sshByYear.set(year, (sshByYear.get(year) ?? 0) + ssh);
        }
        resolve();
      },
      error: reject,
    });
  });

  // --- Average Monthly_MSL per year from Sea_Level_Rise_Formatted.csv ---
  // "Date" column format: "1993.0417" (decimal year)
  const mslByYear = new Map<number, number[]>();

  await new Promise<void>((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvB, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        for (const r of results.data) {
          const year = parseInt((r['Date'] ?? '').split('.')[0], 10);
          const msl = parseFloat(r['Monthly_MSL']);
          if (isNaN(year) || isNaN(msl)) continue;
          if (!mslByYear.has(year)) mslByYear.set(year, []);
          mslByYear.get(year)!.push(msl);
        }
        resolve();
      },
      error: reject,
    });
  });

  // --- Merge on year — only keep years present in BOTH datasets ---
  const rows: SeaLevelRow[] = [];
  for (const [year, totalSSH] of sshByYear.entries()) {
    const mslValues = mslByYear.get(year);
    if (!mslValues || mslValues.length === 0) continue;
    const meanMSL = mslValues.reduce((a, b) => a + b, 0) / mslValues.length;
    rows.push({ year, totalSSH, meanMSL });
  }
  rows.sort((a, b) => a.year - b.year);

  return {
    data: rows,
    loadedAt: new Date(),
    rowCount: rows.length,
    sourceFile: 'Cleaned_Sea_Level_Variation.csv + Sea_Level_Rise_Formatted.csv',
  };
}
// ============================================================
// UTILITIES
// ============================================================

export function annualToMonthly(annualValue: number): number {
  return annualValue / 12;
}

export function expandAnnualToMonthly<T extends { year: number }>(
  annualRows: T[],
  valueKey: keyof T
): Array<T & { month: number }> {
  const expanded: Array<T & { month: number }> = [];
  for (const row of annualRows) {
    const monthlyValue = (row[valueKey] as number) / 12;
    for (let month = 1; month <= 12; month++) {
      expanded.push({
        ...row,
        month,
        [valueKey]: monthlyValue,
      } as T & { month: number });
    }
  }
  return expanded;
}