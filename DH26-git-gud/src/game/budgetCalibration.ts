import type { TotalEnergyConsumptionRow } from '../types/data';

/**
 * Derives a starting budget based on the era the player chose.
 *
 * The idea: energy demand grew ~3x from 1949 to 2000. A 2000-era player
 * needs proportionally more capital to build enough plants to meet demand
 * than a 1949-era player. We scale money against consumption ratio.
 *
 * Baseline: $2B for 1949. Scaling capped at 3x ($6B) so late-game starts
 * aren't wildly easier than early-game.
 */
export function getStartingBudgetForYear(
  consumptionData: TotalEnergyConsumptionRow[],
  year: number,
  baseline: number = 10000,        // $2B in millions
  baselineYear: number = 1949,
): number {
  const findYear = (y: number): number | null => {
    const row = consumptionData.find((r) => r.year === y);
    return row?.value ?? null;
  };

  const baselineConsumption = findYear(baselineYear);
  const yearConsumption = findYear(year);

  if (!baselineConsumption || !yearConsumption) {
    return baseline;
  }

  const ratio = yearConsumption / baselineConsumption;
  const capped = Math.min(ratio, 3.0);
  return Math.round(baseline * capped);
}

/**
 * List of selectable start years for the pre-game year picker.
 * Capped at 2020 so the player always has at least 5 years of gameplay.
 */
export function getSelectableStartYears(): number[] {
  const years: number[] = [];
  for (let y = 1949; y <= 2020; y++) {
    years.push(y);
  }
  return years;
}