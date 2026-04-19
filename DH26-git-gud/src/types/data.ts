// ============================================================
// RAW CSV ROW SHAPES
// ============================================================

export interface EnergyConsumptionRow {
  year: number;
  source: string;
  consumption: number;
}

export interface EnergyProductionRow {
  year: number;
  source: string;
  productionMWh: number;
}

export interface CO2EmissionsRow {
  year: number;
  sector: string;
  emissionsMillionTons: number;
}

// ============================================================
// OCEANIC DATA
// ============================================================

export interface SeaLevelRow {
  year: number;
  month: number;
  anomalyMm: number;
}

export interface SeaSurfaceTempRow {
  year: number;
  month: number;
  anomalyCelsius: number;
}

export interface OceanPHRow {
  year: number;
  month: number;
  pH: number;
}

export interface CalCOFIBottleRow {
  year: number;
  month: number;
  depth: number;
  temperature: number;
  salinity: number;
  oxygen: number;
}

// ============================================================
// LOADER RESULT TYPES
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
// AGGREGATED / DERIVED DATA
// ============================================================

export interface OceanicSnapshot {
  year: number;
  month: number;
  seaLevelMm: number | null;
  seaSurfaceTempAnomaly: number | null;
  pH: number | null;
}

export interface EnergySnapshot {
  year: number;
  month: number;
  totalProductionMWh: number;
  totalCO2Emitted: number;
}