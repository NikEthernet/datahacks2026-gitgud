import type { GameState, PlantType } from '../types/game';

export interface AnnualSnapshot {
  year: number;
  money: number;
  totalEnergyProducedMWh: number;
  totalCO2EmittedTons: number;
  projectedSeaLevelM: number;
  publicSupport: number;
  coalStock: number;
  naturalGasStock: number;
  petroleumStock: number;
  uraniumStock: number;
  operationalPlants: number;
  buildingPlants: number;
  plantsByType: Record<PlantType, number>;
}

/**
 * Captures the current game state as a snapshot for historical logging.
 */
export function snapshotState(state: GameState): AnnualSnapshot {
  const plantsByType: Record<PlantType, number> = {
    coal: 0, natural_gas: 0, petroleum: 0, nuclear: 0,
    hydro: 0, wind: 0, solar: 0,
  };

  let operational = 0;
  let building = 0;
  for (const p of state.plants) {
    if (p.operational) {
      operational++;
      plantsByType[p.type]++;
    } else {
      building++;
    }
  }

  const projectedSeaLevelM =
    (state.metrics.totalCO2Emitted / 1_000_000_000) * 0.01;

  return {
    year: state.currentYear,
    money: state.money,
    totalEnergyProducedMWh: state.metrics.totalEnergyProduced,
    totalCO2EmittedTons: state.metrics.totalCO2Emitted,
    projectedSeaLevelM,
    publicSupport: state.metrics.publicSupport,
    coalStock: state.resources.coal,
    naturalGasStock: state.resources.natural_gas,
    petroleumStock: state.resources.petroleum,
    uraniumStock: state.resources.uranium,
    operationalPlants: operational,
    buildingPlants: building,
    plantsByType,
  };
}

/**
 * Converts an array of annual snapshots into a CSV string ready to download.
 */
export function snapshotsToCSV(snapshots: AnnualSnapshot[]): string {
  if (snapshots.length === 0) return '';

  const headers = [
    'year',
    'money_millions',
    'total_energy_mwh',
    'total_co2_tons',
    'projected_sea_level_m',
    'public_support',
    'coal_stock',
    'natural_gas_stock',
    'petroleum_stock',
    'uranium_stock',
    'operational_plants',
    'building_plants',
    'coal_plants',
    'natural_gas_plants',
    'petroleum_plants',
    'nuclear_plants',
    'hydro_plants',
    'wind_plants',
    'solar_plants',
  ];

  const rows = snapshots.map((s) =>
    [
      s.year,
      s.money.toFixed(2),
      s.totalEnergyProducedMWh.toFixed(0),
      s.totalCO2EmittedTons.toFixed(0),
      s.projectedSeaLevelM.toFixed(4),
      s.publicSupport.toFixed(1),
      s.coalStock.toFixed(0),
      s.naturalGasStock.toFixed(0),
      s.petroleumStock.toFixed(0),
      s.uraniumStock.toFixed(0),
      s.operationalPlants,
      s.buildingPlants,
      s.plantsByType.coal,
      s.plantsByType.natural_gas,
      s.plantsByType.petroleum,
      s.plantsByType.nuclear,
      s.plantsByType.hydro,
      s.plantsByType.wind,
      s.plantsByType.solar,
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Triggers a browser download of a CSV string.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}