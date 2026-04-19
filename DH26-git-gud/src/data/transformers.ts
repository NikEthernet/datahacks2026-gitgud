import type {
  GenerationMixRow,
  TotalEnergyConsumptionRow,
  SolarLCOERow,
  PPIRow,
  //SeaLevelRow,
  CO2EmissionsBySourceRow,
  LCOETrendRow,
} from '../types/data';

import type { PlantType } from '../types/game';

// ============================================================
// DEMAND CURVE — for the game's target "demand to meet"
// ============================================================

/**
 * Builds a year→monthly-demand lookup from the total consumption CSV.
 * Converts Trillion BTU/year to approximate MWh/month for the game.
 *
 * Conversion: 1 Trillion BTU ≈ 293,071 MWh.
 */
export function buildDemandCurve(
  data: TotalEnergyConsumptionRow[]
): Map<number, number> {
  const BTU_TO_MWH = 293_071;
  const curve = new Map<number, number>();
  for (const row of data) {
    const annualMWh = row.value * BTU_TO_MWH;
    curve.set(row.year, annualMWh / 12);
  }
  return curve;
}

/**
 * Gets the expected US energy demand (MWh) for a given game month.
 * Falls back to the closest available year.
 */
export function getDemandForMonth(
  curve: Map<number, number>,
  year: number
): number {
  if (curve.has(year)) return curve.get(year)!;

  // Fallback: closest year
  const years = Array.from(curve.keys()).sort((a, b) => a - b);
  if (years.length === 0) return 0;

  let closest = years[0];
  for (const y of years) {
    if (Math.abs(y - year) < Math.abs(closest - year)) closest = y;
  }
  return curve.get(closest)!;
}

// ============================================================
// SOLAR BUILD COST — uses LCOE to scale cost across eras
// ============================================================

/**
 * Maps year → solar plant build cost in USD millions.
 * Scales from a 2025 baseline using the LCOE curve.
 *
 * At $250M baseline (from placeholder definitions), a 2025 solar plant
 * is cheap. A 1990 plant costs ~44x as much.
 */
export function buildSolarCostCurve(
  data: SolarLCOERow[],
  baselineCost: number = 250
): Map<number, number> {
  const curve = new Map<number, number>();
  const baseline2025 = data.find((r) => r.year === 2025)?.lcoePerKWh ?? 0.06;

  for (const row of data) {
    const ratio = row.lcoePerKWh / baseline2025;
    curve.set(row.year, baselineCost * ratio);
  }
  return curve;
}

// ============================================================
// GENERATION MIX AT GAME END — for comparison scoring
// ============================================================

/**
 * Gets the real US generation mix for a given year/month.
 * Used at game-over to compare the player's mix against reality.
 */
export function getHistoricalMix(
  data: GenerationMixRow[],
  year: number,
  month: number
): GenerationMixRow | null {
  return (
    data.find((r) => r.year === year && r.month === month) ??
    data.find((r) => r.year === year) ??
    null
  );
}

// ============================================================
// SSH → MONTHLY MEAN (for the oceanic scoreboard)
// ============================================================

/**
 * Aggregates daily SSH data to monthly means.
 
export function aggregateSSHToMonthly(
  data: SeaLevelRow[]
): Map<string, number> {
  const groups = new Map<string, number[]>();

  for (const row of data) {
    const [yearStr, monthStr] = row.ate.split('-');
    const key = `${yearStr}-${monthStr}`;
    const arr = groups.get(key) ?? [];
    arr.push(row.ssh);
    groups.set(key, arr);
  }

  const monthlyMeans = new Map<string, number>();
  for (const [key, values] of groups) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    monthlyMeans.set(key, mean);
  }
  return monthlyMeans;
}
*/
// ============================================================
// PPI PRICE LOOKUP (fuel price calibration by year)
// ============================================================

/**
 * Gets a fuel price index (2024 base) for a given year.
 * Used to set in-game fuel prices relative to a modern baseline.
 */
export function getPPIForYear(data: PPIRow[], year: number): number | null {
  const match = data.find((r) => r.year === year && r.month === 1);
  return match?.index2024base ?? null;
}

// ============================================================
// CO2 EMISSIONS LOOKUP
// ============================================================

/**
 * Builds a PlantType → tons CO2/MWh map from the loaded CO2 data.
 * Used to override placeholder CO2 values in plant definitions.
 */
export function buildCO2Map(
  data: CO2EmissionsBySourceRow[]
): Map<PlantType, number> {
  const map = new Map<PlantType, number>();
  for (const row of data) {
    // Map normalized source names to PlantType
    switch (row.source) {
      case 'coal':        map.set('coal', row.tonsPerMWh); break;
      case 'petroleum':   map.set('petroleum', row.tonsPerMWh); break;
      case 'natural_gas': map.set('natural_gas', row.tonsPerMWh); break;
      case 'nuclear':     map.set('nuclear', row.tonsPerMWh); break;
      case 'hydro':       map.set('hydro', row.tonsPerMWh); break;
      case 'wind':        map.set('wind', row.tonsPerMWh); break;
      case 'solar':       map.set('solar', row.tonsPerMWh); break;
      // geothermal ignored — not one of our plant types
    }
  }
  return map;
}

// ============================================================
// LCOE LOOKUP (year + plant type → cost)
// ============================================================

/**
 * Gets the LCOE for a given plant type and year. Falls back to the
 * closest available year if the exact year isn't in the dataset.
 * Returns null if the technology isn't represented at all.
 */
export function lookupLCOE(
  data: LCOETrendRow[],
  plantType: PlantType,
  year: number
): number | null {
  if (data.length === 0) return null;

  // Find the row for this year, or the closest prior year
  const sortedByYear = [...data].sort((a, b) => a.year - b.year);
  let bestRow: LCOETrendRow | null = null;
  for (const row of sortedByYear) {
    if (row.year > year) break;
    bestRow = row;
  }
  // If no prior year exists, use the earliest row
  if (!bestRow) bestRow = sortedByYear[0];

  switch (plantType) {
    case 'solar':       return bestRow.solarPV;
    case 'wind':        return bestRow.wind;
    case 'natural_gas': return bestRow.naturalGas;
    case 'coal':        return bestRow.coal;
    case 'nuclear':     return bestRow.nuclear;
    default:            return null; // petroleum, hydro not in this dataset
  }
}

/**
 * Converts an LCOE value ($/MWh) into an approximate build cost
 * in USD millions for a game-scale plant.
 *
 * A typical power plant in the game produces ~400,000 MWh/month =
 * ~4.8 million MWh/year. Over a 30-year lifespan that's ~144M MWh.
 *
 * LCOE represents the per-MWh cost amortizing build + operation,
 * so building cost ≈ LCOE * annual output * scaling factor.
 *
 * Tunable via the `scalingFactor` parameter.
 */
export function lcoeToBuildCost(
  lcoePerMWh: number,
  plantAnnualMWh: number = 4_800_000,
  scalingFactor: number = 0.5
): number {
  // cost in millions USD
  return (lcoePerMWh * plantAnnualMWh * scalingFactor) / 1_000_000;
}

// ============================================================
// BUILDING DYNAMIC PLANT DEFINITIONS
// ============================================================

/**
 * Summarized reference data used to calibrate year-indexed plant definitions.
 * Assembled from multiple CSV sources.
 */
export interface PlantCalibrationInputs {
  co2Map: Map<PlantType, number>;
  lcoeTrends: LCOETrendRow[];
}

/**
 * Produces a calibrated co2PerMWh value for a plant type.
 * Falls back to a fallback value if the CO2 map doesn't have the type.
 */
export function getCalibratedCO2(
  plantType: PlantType,
  co2Map: Map<PlantType, number>,
  fallback: number
): number {
  return co2Map.get(plantType) ?? fallback;
}