// ============================================================
// PLANT TYPES
// ============================================================

export type PlantType =
  | 'coal'
  | 'natural_gas'
  | 'petroleum'
  | 'nuclear'
  | 'hydro'
  | 'wind'
  | 'solar';

// ============================================================
// RESOURCES / FUELS
// ============================================================

export type ResourceType =
  | 'coal'
  | 'natural_gas'
  | 'petroleum'
  | 'uranium';

export type ResourceInventory = Record<ResourceType, number>;

export type ResourcePrices = Record<ResourceType, number>;

export interface FuelRequirement {
  resource: ResourceType;
  unitsPerMWh: number;
}

// ============================================================
// CAPACITY FACTOR
// ============================================================

/**
 * Monthly capacity multipliers. Index 0 = January, 11 = December.
 */
export type SeasonalCurve = readonly [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

// ============================================================
// PLANT DEFINITION
// ============================================================

export interface PlantDefinition {
  type: PlantType;
  displayName: string;
  description: string;
  buildCost: number;
  maintenanceCost: number;
  energyPerMonth: number;
  baseCapacityFactor: number;
  seasonalCurve: SeasonalCurve;
  co2PerMWh: number;
  buildTimeYears: number;
  availableFromYear: number;
  iconPath: string;
  fuelRequirement: FuelRequirement | null;
}

/**
 * A single built plant instance placed on the map.
 */
export interface Plant {
  id: string;
  type: PlantType;
  stateCode: string;
  yearBuilt: number;
  monthBuilt: number;
  yearDecommissioned: number | null;
  operational: boolean;
}

// ============================================================
// HISTORICAL EVENTS
// ============================================================

export interface EventImpact {
  demandMultiplier?: number;
  costMultiplier?: Partial<Record<PlantType, number>>;
  publicSupportDelta?: number;
  availablePlantTypes?: PlantType[];
  bannedPlantTypes?: PlantType[];
  durationMonths?: number;
}

export interface HistoricalEvent {
  id: string;
  year: number;
  month: number;
  title: string;
  description: string;
  impact: EventImpact;
  imagePath?: string;
}

// ============================================================
// GAME METRICS & STATE
// ============================================================

export interface GameMetrics {
  totalEnergyProduced: number;
  totalCO2Emitted: number;
  currentDemandMet: number;
  publicSupport: number;
}

export interface GameState {
  currentYear: number;
  currentMonth: number;
  money: number;
  resources: ResourceInventory;
  resourcePrices: ResourcePrices;
  plants: Plant[];
  metrics: GameMetrics;
  activeEvents: HistoricalEvent[];
  isGameOver: boolean;
  isPaused: boolean;
}

// ============================================================
// SCORING (COMPARISON-BASED)
// ============================================================

export interface ComparisonMetric {
  label: string;
  unit: string;
  playerValue: number;
  realValue: number;
  delta: number;
  percentDifference: number;
  betterThanReality: boolean;
}

export interface GameScore {
  finalYear: number;
  finalMonth: number;
  energyMetrics: ComparisonMetric[];
  emissionMetrics: ComparisonMetric[];
  oceanicMetrics: ComparisonMetric[];
  economicMetrics: ComparisonMetric[];
  summary: string;
}