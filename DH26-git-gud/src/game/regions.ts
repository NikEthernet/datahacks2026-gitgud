import type { PlantType } from '../types/game';

/**
 * US regions used for plant suitability calculations.
 */
export type Region =
  | 'northeast'
  | 'southeast'
  | 'midwest'
  | 'southwest'
  | 'west';

export const REGION_LABELS: Record<Region, string> = {
  northeast: 'Northeast',
  southeast: 'Southeast',
  midwest: 'Midwest',
  southwest: 'Southwest',
  west: 'West',
};

/**
 * Every US state mapped to its region.
 */
export const STATE_TO_REGION: Record<string, Region> = {
  // Northeast
  ME: 'northeast', NH: 'northeast', VT: 'northeast', MA: 'northeast',
  RI: 'northeast', CT: 'northeast', NY: 'northeast', NJ: 'northeast',
  PA: 'northeast',
  // Southeast
  DE: 'southeast', MD: 'southeast', VA: 'southeast', WV: 'southeast',
  NC: 'southeast', SC: 'southeast', GA: 'southeast', FL: 'southeast',
  KY: 'southeast', TN: 'southeast', AL: 'southeast', MS: 'southeast',
  AR: 'southeast', LA: 'southeast',
  // Midwest
  OH: 'midwest', IN: 'midwest', IL: 'midwest', MI: 'midwest',
  WI: 'midwest', MN: 'midwest', IA: 'midwest', MO: 'midwest',
  ND: 'midwest', SD: 'midwest', NE: 'midwest', KS: 'midwest',
  // Southwest
  TX: 'southwest', OK: 'southwest', NM: 'southwest', AZ: 'southwest',
  // West
  CO: 'west', WY: 'west', MT: 'west', ID: 'west',
  UT: 'west', NV: 'west', CA: 'west', OR: 'west',
  WA: 'west', AK: 'west', HI: 'west',
};

/**
 * Suitability multiplier per (plant type, region).
 * 1.0 = standard output, >1.0 = favored, <1.0 = penalized.
 */
export const REGIONAL_SUITABILITY: Record<PlantType, Record<Region, number>> = {
  coal: {
    northeast: 0.9, southeast: 1.2, midwest: 1.1,
    southwest: 0.8, west: 0.7,
  },
  natural_gas: {
    northeast: 1.0, southeast: 1.1, midwest: 1.0,
    southwest: 1.3, west: 0.9,
  },
  petroleum: {
    northeast: 0.8, southeast: 1.1, midwest: 0.9,
    southwest: 1.3, west: 0.9,
  },
  nuclear: {
    northeast: 1.1, southeast: 1.0, midwest: 1.0,
    southwest: 0.8, west: 0.9,
  },
  hydro: {
    northeast: 0.9, southeast: 0.8, midwest: 0.7,
    southwest: 0.3, west: 1.5,
  },
  wind: {
    northeast: 0.9, southeast: 0.6, midwest: 1.4,
    southwest: 1.3, west: 1.0,
  },
  solar: {
    northeast: 0.7, southeast: 1.0, midwest: 0.8,
    southwest: 1.4, west: 1.1,
  },
};

/**
 * Convenience lookup: suitability of a plant in a specific state.
 * Returns 1.0 if state not found (safe fallback).
 */
export function getSuitability(plantType: PlantType, stateCode: string): number {
  const region = STATE_TO_REGION[stateCode];
  if (!region) return 1.0;
  return REGIONAL_SUITABILITY[plantType][region];
}