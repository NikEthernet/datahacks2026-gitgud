import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useGameState, type UseGameStateResult } from '../hooks/useGameState';
import {
  initializePlantDefinitions,
  getPlaceholderDefinitions,
} from '../game/plants';

const GameContext = createContext<UseGameStateResult | null>(null);

/**
 * Provides game state and actions to all descendants.
 * Initializes plant definitions once on mount.
 *
 * TODO (post-CSV-integration): replace getPlaceholderDefinitions()
 * with buildCalibratedDefinitions() using loaded CSV data.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameState();

  useEffect(() => {
    initializePlantDefinitions(getPlaceholderDefinitions());
  }, []);

  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

/**
 * Access game state and actions from any component under GameProvider.
 * Throws if used outside the provider — catches setup mistakes early.
 */
export function useGame(): UseGameStateResult {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside <GameProvider>');
  }
  return ctx;
}