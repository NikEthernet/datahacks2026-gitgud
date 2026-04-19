import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  PlantType,
  ResourceType,
} from '../types/game';
import { createInitialState } from '../game/state';
import {
  tick,
  buildPlant as engineBuildPlant,
  buyResource as engineBuyResource,
  demolishPlant as engineDemolishPlant,
  type TickLogEntry,
} from '../game/engine';
import { DEFAULT_TICK_SECONDS } from '../game/constants';

export interface UseGameStateResult {
  state: GameState;
  log: TickLogEntry[];
  actions: {
    start: () => void;
    pause: () => void;
    reset: () => void;
    buildPlant: (type: PlantType, stateCode: string) => boolean;
    buyResource: (resource: ResourceType, quantity: number) => boolean;
    demolishPlant: (plantId: string) => boolean;
    setTickSpeed: (secondsPerTick: number) => void;
  };
}

/**
 * Primary game hook — holds state, runs the tick loop, exposes actions.
 */
export function useGameState(): UseGameStateResult {
  const [state, setState] = useState<GameState>(createInitialState());
  const [log, setLog] = useState<TickLogEntry[]>([]);
  const tickSpeedRef = useRef(DEFAULT_TICK_SECONDS);
  const intervalRef = useRef<number | null>(null);

  const runTick = useCallback(() => {
    setState((current) => {
      const result = tick(current);
      setLog((prevLog) => [...prevLog.slice(-50), ...result.log]);
      return result.state;
    });
  }, []);

  useEffect(() => {
    if (state.isPaused || state.isGameOver) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(
      runTick,
      tickSpeedRef.current * 1000
    );

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isPaused, state.isGameOver, runTick]);

  const start = useCallback(() => {
    setState((s) => ({ ...s, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, isPaused: true }));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialState());
    setLog([]);
  }, []);

  const buildPlant = useCallback(
    (type: PlantType, stateCode: string): boolean => {
      let success = false;
      setState((current) => {
        const next = engineBuildPlant(current, type, stateCode);
        if (next) {
          success = true;
          return next;
        }
        return current;
      });
      return success;
    },
    []
  );

  const buyResource = useCallback(
    (resource: ResourceType, quantity: number): boolean => {
      let success = false;
      setState((current) => {
        const next = engineBuyResource(current, resource, quantity);
        if (next) {
          success = true;
          return next;
        }
        return current;
      });
      return success;
    },
    []
  );

  const demolishPlant = useCallback((plantId: string): boolean => {
    let success = false;
    setState((current) => {
      const next = engineDemolishPlant(current, plantId);
      if (next) {
        success = true;
        return next;
      }
      return current;
    });
    return success;
  }, []);

  const setTickSpeed = useCallback((secondsPerTick: number) => {
    tickSpeedRef.current = secondsPerTick;
  }, []);

  return {
    state,
    log,
    actions: {
      start,
      pause,
      reset,
      buildPlant,
      buyResource,
      demolishPlant,
      setTickSpeed,
    },
  };
}