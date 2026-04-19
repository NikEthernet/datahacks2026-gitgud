import type {
  PlantType,
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
 * Starting fuel stockpiles — sized so one plant of each fueled type
 * has roughly 3 months of autonomy at full effective output before
 * the player needs to visit the market.
 *
 * Rough math: effective monthly output ≈ energyPerMonth × capacity × 1.0
 *   coal:        500,000 × 0.50 = 250,000 MWh × 0.45 = 112,500 units/mo → ~340,000 for 3 mo
 *   natural_gas: 400,000 × 0.55 = 220,000 MWh × 0.20 =  44,000 units/mo → ~132,000 for 3 mo
 *   petroleum:   350,000 × 0.30 = 105,000 MWh × 0.60 =  63,000 units/mo → ~190,000 for 3 mo
 *   nuclear:     900,000 × 0.90 = 810,000 MWh × 0.003 =  2,430 units/mo → ~7,300 for 3 mo
 */
export const STARTING_RESOURCES = {
  coal: 340_000,
  natural_gas: 132_000,
  petroleum: 190_000,
  uranium: 7_300,
} as const;

/**
 * Flat resource prices in $/unit. Sized so a month of resupply
 * costs roughly 1–3% of the $2B starting budget per fueled plant.
 */
export const RESOURCE_PRICES: ResourcePrices = {
  coal: 0.08,         // ~$9,000/mo to supply one coal plant
  natural_gas: 0.25,  // ~$11,000/mo
  petroleum: 0.30,    // ~$19,000/mo
  uranium: 12.0,      // ~$29,000/mo (small qty, high unit price)
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
// FUEL REQUIREMENTS (unchanged — these are physically accurate)
// ============================================================
export const FUEL_REQUIREMENTS: Partial<Record<PlantType, FuelRequirement>> = {
  coal:        { resource: 'coal',        unitsPerMWh: 0.45 },
  natural_gas: { resource: 'natural_gas', unitsPerMWh: 0.20 },
  petroleum:   { resource: 'petroleum',   unitsPerMWh: 0.60 },
  nuclear:     { resource: 'uranium',     unitsPerMWh: 0.003 },
};

// ============================================================
// CAPACITY FACTORS & SEASONALITY
// ============================================================
export const BASE_CAPACITY_FACTORS: Record<PlantType, number> = {
  coal:        0.50,
  natural_gas: 0.55,
  petroleum:   0.30,
  nuclear:     0.90,
  hydro:       0.40,
  wind:        0.35,
  solar:       0.22,
};

export const SEASONAL_CURVES: Record<PlantType, SeasonalCurve> = {
  coal:        [1.00, 1.00, 0.98, 0.97, 0.98, 1.00, 1.02, 1.02, 0.98, 0.97, 1.00, 1.00],
  natural_gas: [1.05, 1.05, 1.00, 0.98, 0.98, 1.00, 1.00, 1.00, 0.98, 0.98, 1.02, 1.05],
  petroleum:   [1.02, 1.02, 1.00, 0.98, 0.98, 1.00, 1.00, 1.00, 0.98, 0.98, 1.02, 1.02],
  nuclear:     [1.00, 1.00, 0.98, 0.95, 0.95, 1.00, 1.02, 1.02, 0.98, 0.95, 1.00, 1.02],
  hydro:       [0.85, 0.90, 1.15, 1.40, 1.35, 1.15, 0.95, 0.80, 0.75, 0.80, 0.90, 0.95],
  wind:        [1.25, 1.20, 1.25, 1.15, 0.95, 0.80, 0.70, 0.70, 0.85, 1.00, 1.15, 1.20],
  solar:       [0.65, 0.80, 1.00, 1.20, 1.35, 1.45, 1.45, 1.35, 1.15, 0.90, 0.70, 0.60],
};

export const DEMOLITION_COST_RATIO = 0.2;