// ============================================================
// GENERATION MIX (Generation_Energy_Percentages_Fixed.csv)
// ============================================================

/**
 * Monthly breakdown of US electricity generation by source (percentage).
 * Values sum to ~100 per row.
 *
 * Note: The raw CSV header is a string like "Jan-01" which we parse
 * into year + month on load. See parseGenerationMix() in loaders.ts.
 */
export interface GenerationMixRow {
  year: number;
  month: number;
  all: number;
  coal: number;
  petroleumLiquids: number;
  petroleumCoke: number;
  naturalGas: number;
  otherGases: number;
  nuclear: number;
  hydroelectric: number;
  otherRenewables: number;
  hydroelectricStorage: number;
  other: number;
}

// ============================================================
// TOTAL ENERGY CONSUMPTION (energy_data_total_updated.csv)
// ============================================================

/**
 * Yearly total primary energy consumption in the US.
 * Used to drive the game's demand curve.
 */
export interface TotalEnergyConsumptionRow {
  year: number;
  msn: string;                 // EIA series code, e.g. "TETCBUS"
  description: string;
  value: number;               // Trillion Btu (annual)
  unit: string;
}

// ============================================================
// SOLAR LCOE (Solar_LCOE_1990_2025_Extrapolated.csv)
// ============================================================

/**
 * Solar levelized cost of energy per year in constant 2023 USD per kWh.
 * Used to calibrate solar plant build costs across eras.
 */
export interface SolarLCOERow {
  year: number;
  lcoePerKWh: number;
}

// ============================================================
// PPI (coal, gas, petroleum, industrial)
// ============================================================

/**
 * Generic shape for all producer-price-index files.
 * Matches coal_ppi_enriched.csv, gas_ppi_enriched.csv, etc.
 */
export interface PPIRow {
  date: string;                // ISO date, e.g. "1946-01-01"
  year: number;
  month: number;
  decade: number;
  nominal: number;             // raw PPI value
  index2024base: number;       // normalized to 2024 = 100
  momPct: number | null;       // month-over-month % change
  yoyPct: number | null;       // year-over-year % change
  rollingVol12m: number | null;
  shock: boolean;
  direction: 'up' | 'down' | 'flat';
  event: string | null;        // historical context tag
}

// ============================================================
// SOLAR CONSUMPTION (SolarPowerConsumption.csv)
// ============================================================

/**
 * EIA solar consumption timeseries.
 *
 * Note: rows where YYYYMM ends in "13" are ANNUAL TOTALS, not a real month.
 * Filter these out in parsing.
 */
export interface SolarConsumptionRow {
  msn: string;                 // series code
  year: number;
  month: number;
  value: number | null;        // null when "Not Available"
  description: string;
  unit: string;
}

// ============================================================
// SEA SURFACE HEIGHT (Specific_Location_SSH_Real.csv)
// ============================================================

/**
 * Daily sea surface height anomaly at a specific Gulf of Mexico location.
 */
export interface SSHRow {
  date: string;                // ISO date
  lat: number;
  lon: number;
  ssh: number;                 // meters relative to baseline
}

// ============================================================
// LOADER RESULT TYPES (unchanged from before)
// ============================================================

export interface LoadedDataset<T> {
  data: T[];
  loadedAt: Date;
  rowCount: number;
  sourceFile: string;
}

export type DataLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DataLoadState<T> {
  status: DataLoadStatus;
  data: T[] | null;
  error: string | null;
}

// ============================================================
// CO2 EMISSIONS BY SOURCE (lifecycle reference data)
// ============================================================

/**
 * Lifecycle CO2 emissions per energy source, in tons per MWh.
 * Authoritative reference values — used to calibrate PlantDefinition.
 *
 * Source file uses kg/MWh; loader divides by 1000 to convert to tons/MWh.
 */
export interface CO2EmissionsBySourceRow {
  source: string;              // canonical lowercase source name
  tonsPerMWh: number;
}

// ============================================================
// LCOE TRENDS (multi-technology, annual)
// ============================================================

/**
 * Year-by-year Levelized Cost of Energy ($/MWh) for multiple technologies.
 * Values are null when a technology/year pair isn't in the source data.
 */
export interface LCOETrendRow {
  year: number;
  solarPV: number | null;
  wind: number | null;
  naturalGas: number | null;
  coal: number | null;
  nuclear: number | null;
}