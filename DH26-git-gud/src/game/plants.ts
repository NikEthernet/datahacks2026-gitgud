import type {
  PlantType,
  PlantDefinition,
  Plant,
  FuelRequirement,
} from '../types/game';
import {
  FUEL_REQUIREMENTS,
  SEASONAL_CURVES,
  BASE_CAPACITY_FACTORS,
} from './constants';
// New imports below:
import type { LCOETrendRow, CO2EmissionsBySourceRow } from '../types/data';
import { buildCO2Map, lookupLCOE, lcoeToBuildCost } from '../data/transformers';

// ============================================================
// PLANT DEFINITION REGISTRY (year-indexed)
// ============================================================

type PlantDefinitionRegistry = Map<string, PlantDefinition>;

let registry: PlantDefinitionRegistry = new Map();

function keyFor(type: PlantType, year: number): string {
  return `${type}:${year}`;
}

export function initializePlantDefinitions(
  definitions: Array<PlantDefinition & { year: number }>
): void {
  registry = new Map();
  for (const def of definitions) {
    registry.set(keyFor(def.type, def.year), def);
  }
}

export function getPlantDefinition(
  type: PlantType,
  year: number
): PlantDefinition | null {
  const exact = registry.get(keyFor(type, year));
  if (exact) return exact;

  for (let y = year - 1; y >= 1900; y--) {
    const fallback = registry.get(keyFor(type, y));
    if (fallback) return fallback;
  }

  return null;
}

// ============================================================
// PLACEHOLDER DEFINITIONS
// ============================================================

/**
 * Safely retrieves a plant's fuel requirement, returning null for renewables.
 */
function getFuelRequirement(type: PlantType): FuelRequirement | null {
  const req = FUEL_REQUIREMENTS[type];
  return req ?? null;
}

export function getPlaceholderDefinitions(): Array<
  PlantDefinition & { year: number }
> {
  const types: PlantType[] = [
    'coal', 'natural_gas', 'petroleum', 'nuclear',
    'hydro', 'wind', 'solar',
  ];

  return types.map((type) => {
    const definition: PlantDefinition & { year: number } = {
      year: 1949,
      type,
      displayName: displayNameFor(type),
      description: `Placeholder description for ${type}.`,
      buildCost: defaultBuildCost(type),
      maintenanceCost: defaultMaintenanceCost(type),
      energyPerMonth: defaultEnergyPerMonth(type),
      baseCapacityFactor: BASE_CAPACITY_FACTORS[type],
      seasonalCurve: SEASONAL_CURVES[type],
      co2PerMWh: defaultCO2(type),
      buildTimeYears: defaultBuildTime(type),
      availableFromYear: defaultAvailableFromYear(type),
      iconPath: `/assets/plants/${type}.svg`,
      fuelRequirement: getFuelRequirement(type),
    };
    return definition;
  });
}

function displayNameFor(type: PlantType): string {
  const map: Record<PlantType, string> = {
    coal: 'Coal Plant',
    natural_gas: 'Natural Gas Plant',
    petroleum: 'Petroleum Plant',
    nuclear: 'Nuclear Plant',
    hydro: 'Hydroelectric Dam',
    wind: 'Wind Farm',
    solar: 'Solar Array',
  };
  return map[type];
}

function defaultBuildCost(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 800, natural_gas: 400, petroleum: 600,
    nuclear: 4000, hydro: 1500, wind: 300, solar: 250,
  };
  return map[type];
}

function defaultMaintenanceCost(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 40, natural_gas: 20, petroleum: 35,
    nuclear: 100, hydro: 25, wind: 10, solar: 8,
  };
  return map[type];
}

function defaultEnergyPerMonth(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 500_000, natural_gas: 400_000, petroleum: 350_000,
    nuclear: 900_000, hydro: 300_000, wind: 100_000, solar: 80_000,
  };
  return map[type];
}

function defaultCO2(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 1.0, natural_gas: 0.4, petroleum: 0.85,
    nuclear: 0.012, hydro: 0.02, wind: 0.011, solar: 0.048,
  };
  return map[type];
}

function defaultBuildTime(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 3, natural_gas: 2, petroleum: 2,
    nuclear: 6, hydro: 5, wind: 1, solar: 1,
  };
  return map[type];
}

function defaultAvailableFromYear(type: PlantType): number {
  const map: Record<PlantType, number> = {
    coal: 1949, natural_gas: 1949, petroleum: 1949,
    nuclear: 1958, hydro: 1949, wind: 1980, solar: 1985,
  };
  return map[type];
}

// ============================================================
// CSV-CALIBRATED PLANT DEFINITIONS
// ============================================================

/**
 * Builds year-indexed plant definitions calibrated from real CSV data.
 *
 * For each (PlantType, year) combination where we have data, produces
 * a definition with:
 *   - CO2: from Energy Source CO2 Emissions CSV
 *   - Build cost: derived from LCOE Trends CSV
 *   - Other fields: fall back to placeholder defaults
 *
 * For years without data, the game's getPlantDefinition() already
 * handles fallback to the closest prior year.
 *
 * @param co2Data   From loadCO2EmissionsBySource()
 * @param lcoeData  From loadLCOETrends()
 * @param years     Which years to generate definitions for (e.g. [2010, 2015, 2020])
 */
export function buildCalibratedDefinitions(
  co2Data: CO2EmissionsBySourceRow[],
  lcoeData: LCOETrendRow[],
  years: number[] = [2010, 2015, 2020, 2023],
): Array<PlantDefinition & { year: number }> {
  const co2Map = buildCO2Map(co2Data);
  const types: PlantType[] = [
    'coal', 'natural_gas', 'petroleum', 'nuclear',
    'hydro', 'wind', 'solar',
  ];

  const definitions: Array<PlantDefinition & { year: number }> = [];

  for (const year of years) {
    for (const type of types) {
      // Try CSV-driven build cost, fall back to placeholder
      const lcoe = lookupLCOE(lcoeData, type, year);
      const buildCost = lcoe !== null
        ? lcoeToBuildCost(lcoe)
        : defaultBuildCost(type);

      // CSV-driven CO2, falling back to placeholder
      const co2PerMWh = co2Map.get(type) ?? defaultCO2(type);

      definitions.push({
        year,
        type,
        displayName: displayNameFor(type),
        description: `${displayNameFor(type)} (${year} calibration).`,
        buildCost,
        maintenanceCost: defaultMaintenanceCost(type),
        energyPerMonth: defaultEnergyPerMonth(type),
        baseCapacityFactor: BASE_CAPACITY_FACTORS[type],
        seasonalCurve: SEASONAL_CURVES[type],
        co2PerMWh,
        buildTimeYears: defaultBuildTime(type),
        availableFromYear: defaultAvailableFromYear(type),
        iconPath: `/assets/plants/${type}.svg`,
        fuelRequirement: getFuelRequirement(type),
      });
    }
  }

  return definitions;
}

// ============================================================
// PLANT LIFECYCLE HELPERS
// ============================================================

export function createPlant(
  type: PlantType,
  stateCode: string,
  year: number,
  month: number
): Plant {
  return {
    id: crypto.randomUUID(),
    type,
    stateCode,
    yearBuilt: year,
    monthBuilt: month,
    yearDecommissioned: null,
    operational: false,
  };
}

export function isPlantOperational(
  plant: Plant,
  currentYear: number,
  currentMonth: number
): boolean {
  const def = getPlantDefinition(plant.type, plant.yearBuilt);
  if (!def) return false;

  const monthsElapsed =
    (currentYear - plant.yearBuilt) * 12 + (currentMonth - plant.monthBuilt);
  return monthsElapsed >= def.buildTimeYears * 12;
}