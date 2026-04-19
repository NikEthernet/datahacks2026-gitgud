import type { Plant, PlantDefinition } from '../types/game';
import { getPlantDefinition } from './plants';

/**
 * Measures how out-of-date a plant is compared to the current year's
 * version of the same plant type. Returns null if no comparison is possible.
 *
 * Used by the UI to surface upgrade opportunities to the player —
 * e.g., "This 1965 coal plant produces 30% less energy than a modern one."
 */
export interface UpgradeComparison {
  plant: Plant;
  originalDefinition: PlantDefinition;
  currentDefinition: PlantDefinition;
  buildCostDelta: number;                // current - original
  maintenanceCostDelta: number;
  energyOutputDelta: number;             // positive = current is better
  co2EmissionsDelta: number;             // negative = current is cleaner
  isWorthUpgrading: boolean;             // summary judgment
}

/**
 * Computes an upgrade comparison for a plant.
 * Returns null if the plant or current year definition can't be retrieved.
 */
export function compareToCurrent(
  plant: Plant,
  currentYear: number
): UpgradeComparison | null {
  const originalDef = getPlantDefinition(plant.type, plant.yearBuilt);
  const currentDef = getPlantDefinition(plant.type, currentYear);

  if (!originalDef || !currentDef) return null;
  if (plant.yearBuilt === currentYear) return null; // same definition

  const energyOutputDelta =
    currentDef.energyPerMonth * currentDef.baseCapacityFactor -
    originalDef.energyPerMonth * originalDef.baseCapacityFactor;

  const co2EmissionsDelta =
    currentDef.co2PerMWh - originalDef.co2PerMWh;

  const maintenanceCostDelta =
    currentDef.maintenanceCost - originalDef.maintenanceCost;

  const buildCostDelta = currentDef.buildCost - originalDef.buildCost;

  // Simple heuristic: worth upgrading if the modern version produces
  // meaningfully more energy AND emits less CO2.
  // The 10% threshold is tunable.
  const significantlyMoreEnergy = energyOutputDelta / originalDef.energyPerMonth > 0.1;
  const cleaner = co2EmissionsDelta < 0;
  const isWorthUpgrading = significantlyMoreEnergy && cleaner;

  return {
    plant,
    originalDefinition: originalDef,
    currentDefinition: currentDef,
    buildCostDelta,
    maintenanceCostDelta,
    energyOutputDelta,
    co2EmissionsDelta,
    isWorthUpgrading,
  };
}

/**
 * Returns the age of a plant in years (kept as a utility — display purposes only).
 * This no longer drives maintenance scaling.
 */
export function getPlantAgeYears(
  plant: Plant,
  currentYear: number,
  currentMonth: number
): number {
  const months =
    (currentYear - plant.yearBuilt) * 12 + (currentMonth - plant.monthBuilt);
  return months / 12;
}