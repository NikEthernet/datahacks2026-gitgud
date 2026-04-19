import type { GameState, ResourceInventory } from '../types/game';
import {
  STARTING_MONEY,
  STARTING_RESOURCES,
  RESOURCE_PRICES,
  START_YEAR,
  START_MONTH,
} from './constants';

/**
 * Factory for fresh game state.
 * Called once at game start and when the player resets.
 */
export function createInitialState(): GameState {
  return {
    currentYear: START_YEAR,
    currentMonth: START_MONTH,
    money: STARTING_MONEY,
    resources: { ...STARTING_RESOURCES } as ResourceInventory,
    resourcePrices: { ...RESOURCE_PRICES },
    plants: [],
    metrics: {
      totalEnergyProduced: 0,
      totalCO2Emitted: 0,
      currentDemandMet: 0,
      publicSupport: 50,
    },
    activeEvents: [],
    isGameOver: false,
    isPaused: true, // start paused so player can set up before time flows
  };
}

/**
 * Advances the game date by one month. Handles year rollover.
 * Pure function.
 */
export function advanceDate(state: GameState): GameState {
  let newMonth = state.currentMonth + 1;
  let newYear = state.currentYear;

  if (newMonth > 12) {
    newMonth = 1;
    newYear += 1;
  }

  return { ...state, currentYear: newYear, currentMonth: newMonth };
}