import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  PlantType,
  ResourceType,
} from '../types/game';
import { createInitialState, type InitialStateConfig } from '../game/state';
import {
  tick,
  tickN,
  buildPlant as engineBuildPlant,
  buyResource as engineBuyResource,
  demolishPlant as engineDemolishPlant,
  type TickLogEntry,
} from '../game/engine';
import { DEFAULT_TICK_SECONDS } from '../game/constants';
import { snapshotState, type AnnualSnapshot } from '../game/dataLogger';

export interface GameNotification {
  id: string;
  type: TickLogEntry['type'];
  message: string;
  createdAt: number;
}

export interface UseGameStateResult {
  state: GameState;
  log: TickLogEntry[];
  notifications: GameNotification[];
  annualSnapshots: AnnualSnapshot[];
  actions: {
    start: () => void;
    pause: () => void;
    reset: (config?: InitialStateConfig) => void;
    buildPlant: (type: PlantType, stateCode: string) => boolean;
    buyResource: (resource: ResourceType, quantity: number) => boolean;
    demolishPlant: (plantId: string) => boolean;
    setTickSpeed: (secondsPerTick: number) => void;
    skipMonths: (count: number) => void;
  };
}

const NOTIFICATION_DURATION_MS = 5000;

/**
 * Primary game hook — holds state, runs the tick loop, exposes actions.
 */
export function useGameState(): UseGameStateResult {
  const [state, setState] = useState<GameState>(createInitialState());
  const [log, setLog] = useState<TickLogEntry[]>([]);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [annualSnapshots, setAnnualSnapshots] = useState<AnnualSnapshot[]>([]);
  const tickSpeedRef = useRef(DEFAULT_TICK_SECONDS);
  const intervalRef = useRef<number | null>(null);

  const runTick = useCallback(() => {
    setState((current) => {
      const result = tick(current);
      setLog((prevLog) => [...prevLog.slice(-50), ...result.log]);

      // Push new log entries as notifications
      if (result.log.length > 0) {
        setNotifications((prev) => [
          ...prev,
          ...result.log.map((entry) => ({
            id: crypto.randomUUID(),
            type: entry.type,
            message: entry.message,
            createdAt: Date.now(),
          })),
        ]);
      }

      // Capture annual snapshot every January (when year changes)
      if (
        result.state.currentMonth === 1 &&
        result.state.currentYear !== current.currentYear
      ) {
        setAnnualSnapshots((prev) => [...prev, snapshotState(result.state)]);
      }

      return result.state;
    });
  }, []);

  const skipMonths = useCallback((count: number) => {
    setState((current) => {
      const result = tickN(current, count);
      setLog((prevLog) => [...prevLog.slice(-50), ...result.log]);

      if (result.log.length > 0) {
        setNotifications((prev) => [
          ...prev,
          ...result.log.map((entry) => ({
            id: crypto.randomUUID(),
            type: entry.type,
            message: entry.message,
            createdAt: Date.now(),
          })),
        ]);
      }

      if (result.newAnnualSnapshots && result.newAnnualSnapshots.length > 0) {
        setAnnualSnapshots((prev) => [...prev, ...result.newAnnualSnapshots!]);
      }

      return { ...result.state, isPaused: current.isPaused };
    });
  }, []);

  // Auto-remove the oldest notification after NOTIFICATION_DURATION_MS
  useEffect(() => {
    if (notifications.length === 0) return;
    const oldestAge = Date.now() - notifications[0].createdAt;
    const remaining = NOTIFICATION_DURATION_MS - oldestAge;
    const timeout = window.setTimeout(() => {
      setNotifications((n) => n.slice(1));
    }, Math.max(0, remaining));
    return () => window.clearTimeout(timeout);
  }, [notifications]);

  // Run the tick loop when unpaused
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

  const reset = useCallback((config?: InitialStateConfig) => {
    setState(createInitialState(config));
    setLog([]);
    setNotifications([]);
    setAnnualSnapshots([]);
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
    notifications,
    annualSnapshots,
    actions: {
      start,
      pause,
      reset,
      buildPlant,
      buyResource,
      demolishPlant,
      setTickSpeed,
      skipMonths,
    },
  };
}