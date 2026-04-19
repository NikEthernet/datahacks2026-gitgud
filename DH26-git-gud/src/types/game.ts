// ============================================================
// PLANT TYPES
// ============================================================

/**
 * All supported energy generation types for the game.
 */
export type PlantType =
  | 'coal'
  | 'natural_gas'
  | 'petroleum'
  | 'nuclear'
  | 'hydro'
  | 'wind'
  | 'solar';

/**
 * Static definition of a plant type — costs, output, emissions.
 * Calibrated against EIA historical data.
 *
 * Note: energyPerMonth is the core production rate. CSVs typically
 * report annual production, so when deriving these values from CSVs,
 * divide the annual figure by 12.
 */
export interface PlantDefinition {
  type: PlantType;
  displayName: string;
  description: string;
  buildCost: number;           // USD millions
  maintenanceCost: number;     // USD millions per year
  energyPerMonth: number;      // MWh produced per month (annual / 12)
  co2PerMWh: number;           // tons of CO2 per MWh produced
  buildTimeYears: number;      // years to construct before operational
  availableFromYear: number;   // first year tech was viable in the US
  iconPath: string;            // path to icon asset
}

/**
 * A single built plant instance placed on the map.
 */
export interface Plant {
  id: string;                  // UUID
  type: PlantType;
  stateCode: string;           // 2-letter US state code (e.g. "CA")
  yearBuilt: number;
  monthBuilt: number;          // 1-12, since ticks are monthly
  yearDecommissioned: number | null;
  operational: boolean;        // false during build period
}

// ============================================================
// HISTORICAL EVENTS
// ============================================================

/**
 * Impact a historical event has on game state.
 * All fields optional — an event may affect one or many things.
 */
export interface EventImpact {
  demandMultiplier?: number;        // multiplies current energy demand
  costMultiplier?: Partial<Record<PlantType, number>>;  // per-plant-type cost changes
  publicSupportDelta?: number;      // -100 to +100
  availablePlantTypes?: PlantType[]; // newly unlocked plant types
  bannedPlantTypes?: PlantType[];   // temporarily disallowed
  durationMonths?: number;           // how long the effect lasts (in game months)
}

export interface HistoricalEvent {
  id: string;
  year: number;
  month: number;               // 1-12, for finer temporal placement
  title: string;
  description: string;         // narrative shown in the event modal
  impact: EventImpact;
  imagePath?: string;          // optional image for the modal
}

// ============================================================
// GAME METRICS
// ============================================================

/**
 * The player's running statistics, tracked across the full playthrough.
 * Every tick (month), some of these update based on active plants and events.
 */
export interface GameMetrics {
  totalEnergyProduced: number;  // cumulative MWh since game start
  totalCO2Emitted: number;      // cumulative tons of CO2
  currentDemandMet: number;     // 0-1, fraction of current demand met this tick
  publicSupport: number;        // 0-100
}

// ============================================================
// GAME STATE
// ============================================================

/**
 * The complete game state. Treat as immutable —
 * produce new state objects on update rather than mutating.
 */
export interface GameState {
  currentYear: number;          // 1949 - 2025
  currentMonth: number;         // 1-12
  money: number;                // USD millions
  plants: Plant[];
  metrics: GameMetrics;
  activeEvents: HistoricalEvent[];  // events currently affecting gameplay
  isGameOver: boolean;
  isPaused: boolean;
}

// ============================================================
// SCORING (COMPARISON-BASED)
// ============================================================

/**
 * A single comparative metric: the player's value vs. the real
 * historical U.S. value for the same endpoint year.
 *
 * `delta` and `percentDifference` are derived:
 *   delta = playerValue - realValue
 *   percentDifference = (delta / realValue) * 100
 *
 * `betterThanReality` interprets the direction: for CO2, lower is better;
 * for energy production, matching demand is better than over/under.
 */
export interface ComparisonMetric {
  label: string;                 // e.g. "Cumulative CO₂ Emissions"
  unit: string;                  // e.g. "million tons", "mm", "°C"
  playerValue: number;
  realValue: number;
  delta: number;
  percentDifference: number;
  betterThanReality: boolean;
}

/**
 * End-of-game results, comparing the player's performance to the
 * actual historical U.S. record across multiple dimensions.
 */
export interface GameScore {
  finalYear: number;
  finalMonth: number;
  energyMetrics: ComparisonMetric[];      // production, demand satisfaction
  emissionMetrics: ComparisonMetric[];     // CO2, other greenhouse gases
  oceanicMetrics: ComparisonMetric[];      // sea level, temperature, pH, etc.
  economicMetrics: ComparisonMetric[];     // final money, total spend
  summary: string;                          // generated narrative of results
}