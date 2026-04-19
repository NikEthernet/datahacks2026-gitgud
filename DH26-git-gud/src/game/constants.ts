import type {
  PlantType,
  ResourceType,
  ResourcePrices,
  FuelRequirement,
  SeasonalCurve,
} from '../types/game';

// ============================================================
// ECONOMY
// ============================================================

/**
 * Starting money in USD millions. Tunable during playtesting.
 */
export const STARTING_MONEY = 2000; // $2B

/**
 * Starting fuel stockpiles.
 */
export const STARTING_RESOURCES = {
  coal: 1000,
  natural_gas: 500,
  petroleum: 500,
  uranium: 10,
} as const;

/**
 * Flat resource prices (pure convenience model, no hedging).
 * Tunable to balance strategic choices between plant types.
 */
export const RESOURCE_PRICES: ResourcePrices = {
  coal: 10,
  natural_gas: 8,
  petroleum: 15,
  uranium: 200,
};

// ============================================================
// DATE BOUNDS & TICK RATE
// ============================================================

export const START_YEAR = 1949;
export const START_MONTH = 1;
export const END_YEAR = 2025;
export const END_MONTH = 12;

/**
 * Default real-time seconds per in-game month.
 */
export const DEFAULT_TICK_SECONDS = 1.0;

// ============================================================
// FUEL REQUIREMENTS
// ============================================================

/**
 * Fuel consumption per MWh for each fueled plant type.
 * Renewables (hydro, wind, solar) are absent.
 */
export const FUEL_REQUIREMENTS: Partial<Record<PlantType, FuelRequirement>> = {
  coal:        { resource: 'coal',        unitsPerMWh: 0.45 },
  natural_gas: { resource: 'natural_gas', unitsPerMWh: 0.20 },
  petroleum:   { resource: 'petroleum',   unitsPerMWh: 0.60 },
  nuclear:     { resource: 'uranium',     unitsPerMWh: 0.003 },
};

// ============================================================
// CAPACITY FACTORS & SEASONALITY
// ============================================================

/**
 * Base capacity factors (real-world averages).
 */
export const BASE_CAPACITY_FACTORS: Record<PlantType, number> = {
  coal:        0.50,
  natural_gas: 0.55,
  petroleum:   0.30,
  nuclear:     0.90,
  hydro:       0.40,
  wind:        0.35,
  solar:       0.22,
};

/**
 * Monthly capacity multipliers per plant type.
 * Index 0 = January, 11 = December.
 * Mean of each curve is ~1.0 to preserve annual totals.
 */
export const SEASONAL_CURVES: Record<PlantType, SeasonalCurve> = {
  coal:        [1.00, 1.00, 0.98, 0.97, 0.98, 1.00, 1.02, 1.02, 0.98, 0.97, 1.00, 1.00],
  natural_gas: [1.05, 1.05, 1.00, 0.98, 0.98, 1.00, 1.00, 1.00, 0.98, 0.98, 1.02, 1.05],
  petroleum:   [1.02, 1.02, 1.00, 0.98, 0.98, 1.00, 1.00, 1.00, 0.98, 0.98, 1.02, 1.02],
  nuclear:     [1.00, 1.00, 0.98, 0.95, 0.95, 1.00, 1.02, 1.02, 0.98, 0.95, 1.00, 1.02],
  hydro:       [0.85, 0.90, 1.15, 1.40, 1.35, 1.15, 0.95, 0.80, 0.75, 0.80, 0.90, 0.95],
  wind:        [1.25, 1.20, 1.25, 1.15, 0.95, 0.80, 0.70, 0.70, 0.85, 1.00, 1.15, 1.20],
  solar:       [0.65, 0.80, 1.00, 1.20, 1.35, 1.45, 1.45, 1.35, 1.15, 0.90, 0.70, 0.60],
};
/**
 * Demolition cost as a fraction of original build cost.
 */
export const DEMOLITION_COST_RATIO = 0.2;