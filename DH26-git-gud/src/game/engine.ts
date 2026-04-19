import type {
  GameState,
  Plant,
  PlantType,
  ResourceType,
} from '../types/game';
import { advanceDate } from './state';
import {
  getPlantDefinition,
  isPlantOperational,
} from './plants';
import { getSuitability } from './regions';
import {
  END_YEAR,
  END_MONTH,
  DEMOLITION_COST_RATIO,
} from './constants';
import { snapshotState, type AnnualSnapshot } from './dataLogger';

// ============================================================
// TICK RESULT TYPES
// ============================================================

export interface TickResult {
  state: GameState;
  log: TickLogEntry[];
  newAnnualSnapshots?: AnnualSnapshot[];
}

export interface TickLogEntry {
  type:
    | 'fuel_shortage'
    | 'plant_online'
    | 'plant_decommissioned'
    | 'money_warning'
    | 'info';
  message: string;
}

// ============================================================
// MAIN TICK
// ============================================================

/**
 * Advances the game by one month.
 * Pure function — returns new state + log of what happened this tick.
 *
 * Order:
 *   1. Advance date
 *   2. Mark completed builds as operational
 *   3. Produce energy / consume fuel
 *   4. Pay maintenance (monthly portion of annual)
 *   5. Check game-over
 */
export function tick(state: GameState): TickResult {
  const log: TickLogEntry[] = [];

  // 1. Advance date
  let newState = advanceDate(state);

  // 2. Mark plants operational
  const updatedPlants: Plant[] = newState.plants.map((plant) => {
    if (
      !plant.operational &&
      isPlantOperational(plant, newState.currentYear, newState.currentMonth)
    ) {
      log.push({
        type: 'plant_online',
        message: `${plant.type.replace('_', ' ')} plant in ${plant.stateCode} is now online.`,
      });
      return { ...plant, operational: true };
    }
    return plant;
  });
  newState = { ...newState, plants: updatedPlants };

  // 3. Production & fuel consumption
  newState = processProduction(newState, log);

  // 4. Maintenance (monthly portion of annual)
  const annualMaintenance = calculateMaintenance(newState);
  newState = {
    ...newState,
    money: newState.money - annualMaintenance / 12,
  };

  if (newState.money < 0) {
    log.push({
      type: 'money_warning',
      message: `Budget is negative: $${newState.money.toFixed(1)}M.`,
    });
  }

  // 5. Game-over check
  if (
    newState.currentYear > END_YEAR ||
    (newState.currentYear === END_YEAR && newState.currentMonth > END_MONTH)
  ) {
    newState = { ...newState, isGameOver: true };
  }

  return { state: newState, log };
}

/**
 * Applies N ticks synchronously. Collects any annual snapshots that
 * would have fired (when year changes). Used for skip-ahead buttons.
 */
export function tickN(state: GameState, count: number): TickResult {
  let current = state;
  const allLogs: TickLogEntry[] = [];
  const snapshots: AnnualSnapshot[] = [];

  for (let i = 0; i < count; i++) {
    if (current.isGameOver) break;
    const prevYear = current.currentYear;
    const result = tick(current);
    current = result.state;
    allLogs.push(...result.log);

    if (
      current.currentMonth === 1 &&
      current.currentYear !== prevYear
    ) {
      snapshots.push(snapshotState(current));
    }
  }

  return { state: current, log: allLogs, newAnnualSnapshots: snapshots };
}

// ============================================================
// PRODUCTION & MAINTENANCE
// ============================================================

function processProduction(state: GameState, log: TickLogEntry[]): GameState {
  const newResources = { ...state.resources };
  let totalMWhThisTick = 0;
  let totalCO2ThisTick = 0;

  const monthIndex = state.currentMonth - 1;

  for (const plant of state.plants) {
    if (!plant.operational) continue;

    const def = getPlantDefinition(plant.type, state.currentYear);
    if (!def) continue;

    const seasonalMultiplier = def.seasonalCurve[monthIndex];
    const regionalMultiplier = getSuitability(plant.type, plant.stateCode);
    const effectiveOutput =
      def.energyPerMonth *
      def.baseCapacityFactor *
      seasonalMultiplier *
      regionalMultiplier;

    if (def.fuelRequirement) {
      const needed = effectiveOutput * def.fuelRequirement.unitsPerMWh;
      const available = newResources[def.fuelRequirement.resource];

      if (available < needed) {
        log.push({
          type: 'fuel_shortage',
          message: `${def.displayName} in ${plant.stateCode} idled: insufficient ${def.fuelRequirement.resource}.`,
        });
        continue;
      }

      newResources[def.fuelRequirement.resource] = available - needed;
    }

    totalMWhThisTick += effectiveOutput;
    totalCO2ThisTick += effectiveOutput * def.co2PerMWh;
  }

  return {
    ...state,
    resources: newResources,
    metrics: {
      ...state.metrics,
      totalEnergyProduced: state.metrics.totalEnergyProduced + totalMWhThisTick,
      totalCO2Emitted: state.metrics.totalCO2Emitted + totalCO2ThisTick,
    },
  };
}

function calculateMaintenance(state: GameState): number {
  let total = 0;
  for (const plant of state.plants) {
    if (!plant.operational) continue;
    const def = getPlantDefinition(plant.type, state.currentYear);
    if (def) total += def.maintenanceCost;
  }
  return total;
}

// ============================================================
// PLAYER ACTIONS
// ============================================================

export function buildPlant(
  state: GameState,
  plantType: PlantType,
  stateCode: string
): GameState | null {
  const def = getPlantDefinition(plantType, state.currentYear);
  if (!def) return null;
  if (state.currentYear < def.availableFromYear) return null;
  if (state.money < def.buildCost) return null;

  const newPlant: Plant = {
    id: crypto.randomUUID(),
    type: plantType,
    stateCode,
    yearBuilt: state.currentYear,
    monthBuilt: state.currentMonth,
    yearDecommissioned: null,
    operational: false,
  };

  return {
    ...state,
    money: state.money - def.buildCost,
    plants: [...state.plants, newPlant],
  };
}

export function buyResource(
  state: GameState,
  resource: ResourceType,
  quantity: number
): GameState | null {
  if (quantity <= 0) return null;
  const price = state.resourcePrices[resource];
  const totalCost = price * quantity;

  if (state.money < totalCost) return null;

  return {
    ...state,
    money: state.money - totalCost,
    resources: {
      ...state.resources,
      [resource]: state.resources[resource] + quantity,
    },
  };
}

export function demolishPlant(
  state: GameState,
  plantId: string
): GameState | null {
  const plant = state.plants.find((p) => p.id === plantId);
  if (!plant) return null;

  const def = getPlantDefinition(plant.type, plant.yearBuilt);
  if (!def) return null;

  const demolitionCost = def.buildCost * DEMOLITION_COST_RATIO;
  if (state.money < demolitionCost) return null;

  return {
    ...state,
    money: state.money - demolitionCost,
    plants: state.plants.filter((p) => p.id !== plantId),
  };
}