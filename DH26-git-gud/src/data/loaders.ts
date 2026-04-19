import Papa from 'papaparse';
import type {
  EnergyConsumptionRow,
  EnergyProductionRow,
  CO2EmissionsRow,
  SeaLevelRow,
  SeaSurfaceTempRow,
  OceanPHRow,
  CalCOFIBottleRow,
  LoadedDataset,
} from '../types/data';

/**
 * Base fetcher — grabs a CSV from /public/data/ and parses it.
 * Uses papaparse's header-based parsing with automatic type coercion.
 */
async function fetchAndParseCSV<T>(fileName: string): Promise<T[]> {
  const response = await fetch(`/data/${fileName}`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${fileName}: ${response.status} ${response.statusText}`
    );
  }

  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn(`Parse warnings for ${fileName}:`, results.errors);
        }
        resolve(results.data);
      },
      error: (err: Error) => reject(err),
    });
  });
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
// ENERGY DATASET LOADERS
// ============================================================

export async function loadEnergyConsumption(): Promise<LoadedDataset<EnergyConsumptionRow>> {
  const data = await fetchAndParseCSV<EnergyConsumptionRow>('energy_consumption.csv');
  return wrapDataset(data, 'energy_consumption.csv');
}

export async function loadEnergyProduction(): Promise<LoadedDataset<EnergyProductionRow>> {
  const data = await fetchAndParseCSV<EnergyProductionRow>('energy_production.csv');
  return wrapDataset(data, 'energy_production.csv');
}

export async function loadCO2Emissions(): Promise<LoadedDataset<CO2EmissionsRow>> {
  const data = await fetchAndParseCSV<CO2EmissionsRow>('co2_emissions.csv');
  return wrapDataset(data, 'co2_emissions.csv');
}

// ============================================================
// OCEANIC DATASET LOADERS
// ============================================================

export async function loadSeaLevel(): Promise<LoadedDataset<SeaLevelRow>> {
  const data = await fetchAndParseCSV<SeaLevelRow>('sea_level.csv');
  return wrapDataset(data, 'sea_level.csv');
}

export async function loadSeaSurfaceTemp(): Promise<LoadedDataset<SeaSurfaceTempRow>> {
  const data = await fetchAndParseCSV<SeaSurfaceTempRow>('sea_surface_temp.csv');
  return wrapDataset(data, 'sea_surface_temp.csv');
}

export async function loadOceanPH(): Promise<LoadedDataset<OceanPHRow>> {
  const data = await fetchAndParseCSV<OceanPHRow>('ocean_ph.csv');
  return wrapDataset(data, 'ocean_ph.csv');
}

export async function loadCalCOFIBottle(): Promise<LoadedDataset<CalCOFIBottleRow>> {
  const data = await fetchAndParseCSV<CalCOFIBottleRow>('calcofi_bottle.csv');
  return wrapDataset(data, 'calcofi_bottle.csv');
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Converts an annual value to a monthly rate by dividing by 12.
 * Use this when deriving per-month game values from yearly CSV data.
 */
export function annualToMonthly(annualValue: number): number {
  return annualValue / 12;
}

/**
 * Expands an array of annual rows into monthly rows by evenly distributing
 * the annual value across 12 months. Useful when the game loop needs
 * monthly granularity but the source data is annual.
 */
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