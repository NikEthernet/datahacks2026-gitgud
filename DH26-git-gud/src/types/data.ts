// ============================================================
// RAW CSV ROW SHAPES
// ============================================================

/**
 * EIA annual energy consumption by source.
 * Source: https://www.eia.gov/opendata/
 *
 * Note: consumption values are annual. When feeding into the game,
 * divide by 12 to get the monthly rate.
 */
export interface EnergyConsumptionRow {
  year: number;
  source: string;              // e.g. "coal", "petroleum", "nuclear"
  consumption: number;         // quadrillion BTU (annual)
}

/**
 * EIA annual net energy production by source.
 */
export interface EnergyProductionRow {
  year: number;
  source: string;
  productionMWh: number;       // megawatt-hours (annual)
}

/**
 * Annual CO2 emissions by sector.
 */
export interface CO2EmissionsRow {
  year: number;
  sector: string;              // e.g. "electric_power", "transportation"
  emissionsMillionTons: number;
}

// ============================================================
// OCEANIC DATA
// ============================================================

/**
 * Global mean sea level anomaly (mm relative to a baseline).
 * Source: Scripps / NASA.
 */
export interface SeaLevelRow {
  year: number;
  month: number;               // 1-12
  anomalyMm: number;
}

/**
 * Sea surface temperature anomaly, monthly.
 */
export interface SeaSurfaceTempRow {
  year: number;
  month: number;
  anomalyCelsius: number;
}

/**
 * Ocean pH measurements over time (acidification tracking).
 */
export interface OceanPHRow {
  year: number;
  month: number;
  pH: number;
}

/**
 * CalCOFI oceanographic bottle sampling.
 * Multiple parameters per sample site / depth.
 */
export interface CalCOFIBottleRow {
  year: number;
  month: number;
  depth: number;               // meters
  temperature: number;         // °C
  salinity: number;            // PSU (practical salinity units)
  oxygen: number;              // mL/L
}

// ============================================================
// LOADER RESULT TYPES
// ============================================================

/**
 * Generic wrapper for loaded CSV data, including metadata.
 */
export interface LoadedDataset<T> {
  data: T[];
  loadedAt: Date;
  rowCount: number;
  sourceFile: string;
}

/**
 * Possible states for an async data load.
 */
export type DataLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DataLoadState<T> {
  status: DataLoadStatus;
  data: T[] | null;
  error: string | null;
}

// ============================================================
// AGGREGATED / DERIVED DATA
// ============================================================

/**
 * Aggregated oceanic state for a given year/month.
 * Used by the game to compare the player's performance
 * against real-world oceanic conditions.
 */
export interface OceanicSnapshot {
  year: number;
  month: number;
  seaLevelMm: number | null;
  seaSurfaceTempAnomaly: number | null;
  pH: number | null;
}

/**
 * Aggregated real-world energy snapshot for a given year/month.
 */
export interface EnergySnapshot {
  year: number;
  month: number;
  totalProductionMWh: number;
  totalCO2Emitted: number;
}