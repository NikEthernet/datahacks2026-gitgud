import { useState, useMemo } from 'react';
import { GameProvider, useGame } from '../../context/GameContext';
import USMap from '../../components/game/USMap';
import YearSelect from '../../components/game/YearSelect';
import Modal from '../../components/ui/Modal';
import type { Region } from '../../game/regions';
import {
  REGION_LABELS,
  STATE_TO_REGION,
  REGIONAL_SUITABILITY,
} from '../../game/regions';
import type { PlantType, ResourceType } from '../../types/game';
import { getPlantDefinition } from '../../game/plants';
import { snapshotsToCSV, downloadCSV } from '../../game/dataLogger';
import './Game.css';

/**
 * Representative state code per region — used when the engine needs
 * a state for buildPlant(). The suitability table resolves correctly
 * since all states in a region share the same multipliers.
 */
const REPRESENTATIVE_STATE: Record<Region, string> = {
  northeast: 'NY',
  southeast: 'GA',
  midwest: 'IL',
  southwest: 'TX',
  west: 'CA',
};

const ALL_PLANT_TYPES: PlantType[] = [
  'coal', 'natural_gas', 'petroleum', 'nuclear',
  'hydro', 'wind', 'solar',
];

const ALL_RESOURCES: ResourceType[] = [
  'coal', 'natural_gas', 'petroleum', 'uranium',
];

const RESOURCE_LABELS: Record<ResourceType, string> = {
  coal: 'Coal',
  natural_gas: 'Natural Gas',
  petroleum: 'Petroleum',
  uranium: 'Uranium',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatMoney(m: number): string {
  if (m >= 1000) return `$${(m / 1000).toFixed(2)}B`;
  return `$${m.toFixed(0)}M`;
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

/**
 * Outer wrapper — ensures GameProvider wraps the actual game UI.
 */
function Game() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
}

function GameInner() {
  const { state, notifications, annualSnapshots, actions } = useGame();
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [buildModalOpen, setBuildModalOpen] = useState(false);
  const [energyModalOpen, setEnergyModalOpen] = useState(false);
  const [marketModalOpen, setMarketModalOpen] = useState(false);

  const projectedSeaLevel = useMemo(() => {
    return (state.metrics.totalCO2Emitted / 1_000_000_000) * 0.01;
  }, [state.metrics.totalCO2Emitted]);

  const handleStartGame = (year: number, startingMoney: number) => {
    actions.reset({ startYear: year, startingMoney });
    setHasStarted(true);
  };

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region === selectedRegion ? null : region);
  };

  const handleBuildClick = () => {
    setBuildModalOpen(true);
  };

  const handleExportData = () => {
    if (annualSnapshots.length === 0) return;
    const csv = snapshotsToCSV(annualSnapshots);
    downloadCSV(csv, `energyops-playthrough-${Date.now()}.csv`);
  };

  // Show year-select screen until the player picks a year
  if (!hasStarted) {
    return <YearSelect onStart={handleStartGame} />;
  }

  return (
    <div className="game-page">
      {/* Top HUD */}
      <div className="game-hud">
        <HUDStat icon="💰" value={formatMoney(state.money)} />
        <HUDStat
          icon="💡"
          value={`${formatLargeNumber(state.metrics.totalEnergyProduced)} MWh`}
        />
        <HUDStat icon="🌊" value={`${projectedSeaLevel.toFixed(2)}m`} />
        <HUDStat
          icon="🏭"
          value={`${formatLargeNumber(state.metrics.totalCO2Emitted)} CO₂`}
        />
        <HUDStat
          icon="📅"
          value={`${MONTH_NAMES[state.currentMonth - 1]} ${state.currentYear}`}
        />
      </div>

      {/* Resource ticker */}
      <div className="resource-ticker">
        {ALL_RESOURCES.map((r) => (
          <div key={r} className="resource-chip">
            <span className="resource-name">{RESOURCE_LABELS[r]}:</span>
            <span className="resource-amount">
              {formatLargeNumber(state.resources[r])}
            </span>
            <span className="resource-price">
              @ ${state.resourcePrices[r]}/u
            </span>
          </div>
        ))}
      </div>

      {/* Main map area */}
      <div className="game-map-area">
        <USMap
          selectedRegion={selectedRegion}
          onRegionClick={handleRegionClick}
        />
      </div>

      {/* Right-side button stack */}
      <div className="game-button-stack">
        <button
          className="game-stack-btn"
          onClick={() => setMarketModalOpen(true)}
        >
          <span className="stack-btn-icon">⛽</span>
          <span className="stack-btn-label">Market</span>
        </button>
        <button
          className="game-stack-btn"
          onClick={() => setEnergyModalOpen(true)}
        >
          <span className="stack-btn-icon">📊</span>
          <span className="stack-btn-label">Energy</span>
        </button>
        <button
          className="game-stack-btn"
          onClick={handleBuildClick}
        >
          <span className="stack-btn-icon">🔨</span>
          <span className="stack-btn-label">Build</span>
        </button>
        <button
          className="game-stack-btn"
          onClick={handleExportData}
          disabled={annualSnapshots.length === 0}
          title={
            annualSnapshots.length === 0
              ? 'No data yet — play through at least one year'
              : `Download ${annualSnapshots.length} years of data`
          }
        >
          <span className="stack-btn-icon">💾</span>
          <span className="stack-btn-label">Export</span>
        </button>
      </div>

      {/* Tick controls — bottom center */}
      <TickControls />

      {/* Region detail side drawer (left) */}
      {selectedRegion && (
        <RegionPanel
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
          onBuild={() => setBuildModalOpen(true)}
        />
      )}

      {/* Notifications (top-right, fade after 5s) */}
      <div className="notifications-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification notification-${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>

      {/* Build modal */}
      <Modal
        isOpen={buildModalOpen}
        onClose={() => setBuildModalOpen(false)}
        title={
          selectedRegion
            ? `Build in ${REGION_LABELS[selectedRegion]}`
            : 'Select a Region to Build'
        }
        wide
      >
        <BuildMenu
          region={selectedRegion}
          onBuild={(type) => {
            if (!selectedRegion) return;
            const stateCode = REPRESENTATIVE_STATE[selectedRegion];
            const success = actions.buildPlant(type, stateCode);
            if (success) setBuildModalOpen(false);
          }}
          onSelectRegion={setSelectedRegion}
        />
      </Modal>

      {/* Market modal */}
      <Modal
        isOpen={marketModalOpen}
        onClose={() => setMarketModalOpen(false)}
        title="Resource Market"
        wide
      >
        <ResourceMarketPanel />
      </Modal>

      {/* Energy modal */}
      <Modal
        isOpen={energyModalOpen}
        onClose={() => setEnergyModalOpen(false)}
        title="Energy Dashboard"
        wide
      >
        <EnergyPanel />
      </Modal>
    </div>
  );
}

/* ============================================================
   HUD SUBCOMPONENTS
   ============================================================ */

function HUDStat({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="hud-stat">
      <span className="hud-icon">{icon}</span>
      <span className="hud-value">{value}</span>
    </div>
  );
}

function TickControls() {
  const { state, actions } = useGame();

  return (
    <div className="tick-controls">
      {state.isPaused ? (
        <button
          className="tick-btn tick-btn-primary"
          onClick={actions.start}
          disabled={state.isGameOver}
        >
          ▶ Play
        </button>
      ) : (
        <button className="tick-btn tick-btn-primary" onClick={actions.pause}>
          ⏸ Pause
        </button>
      )}
      <button
        className="tick-btn"
        onClick={() => actions.skipMonths(3)}
        disabled={state.isGameOver}
      >
        ⏩ +3mo
      </button>
      <button
        className="tick-btn"
        onClick={() => actions.skipMonths(6)}
        disabled={state.isGameOver}
      >
        ⏭ +6mo
      </button>
      <button
        className="tick-btn"
        onClick={() => actions.skipMonths(12)}
        disabled={state.isGameOver}
      >
        ⏭⏭ +1yr
      </button>
    </div>
  );
}

/* ============================================================
   REGION DETAIL PANEL
   ============================================================ */

function RegionPanel({
  region,
  onClose,
  onBuild,
}: {
  region: Region;
  onClose: () => void;
  onBuild: () => void;
}) {
  const { state } = useGame();

  const ranked = useMemo(() => {
    return ALL_PLANT_TYPES
      .map((type) => ({
        type,
        suitability: REGIONAL_SUITABILITY[type][region],
      }))
      .sort((a, b) => b.suitability - a.suitability);
  }, [region]);

  const plantsInRegion = useMemo(() => {
    return state.plants.filter(
      (p) => STATE_TO_REGION[p.stateCode] === region
    );
  }, [state.plants, region]);

  return (
    <div className="region-panel">
      <div className="region-panel-header">
        <h2>{REGION_LABELS[region]}</h2>
        <button className="region-panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="region-panel-section">
        <h3>Best-Suited Energy Sources</h3>
        <ul className="suitability-list">
          {ranked.map(({ type, suitability }) => (
            <li key={type} className="suitability-item">
              <span className="plant-type-name">
                {plantDisplayName(type)}
              </span>
              <span
                className={`suitability-badge ${
                  suitability >= 1.2
                    ? 'excellent'
                    : suitability >= 1.0
                      ? 'good'
                      : suitability >= 0.8
                        ? 'ok'
                        : 'poor'
                }`}
              >
                ×{suitability.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="region-panel-section">
        <h3>Your Plants Here ({plantsInRegion.length})</h3>
        {plantsInRegion.length === 0 ? (
          <p className="region-empty">
            No plants built in this region yet.
          </p>
        ) : (
          <ul className="plant-list">
            {plantsInRegion.map((p) => (
              <li key={p.id} className="plant-list-item">
                <span>{plantDisplayName(p.type)}</span>
                <span className={p.operational ? 'status-on' : 'status-building'}>
                  {p.operational ? 'Online' : 'Building'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="region-panel-build-btn" onClick={onBuild}>
        🔨 Build Here
      </button>
    </div>
  );
}

/* ============================================================
   BUILD MENU
   ============================================================ */

function BuildMenu({
  region,
  onBuild,
  onSelectRegion,
}: {
  region: Region | null;
  onBuild: (type: PlantType) => void;
  onSelectRegion: (region: Region) => void;
}) {
  const { state } = useGame();

  if (!region) {
    return (
      <div>
        <p>Pick a region to build in:</p>
        <div className="build-region-grid">
          {(Object.keys(REGION_LABELS) as Region[]).map((r) => (
            <button
              key={r}
              className="build-region-btn"
              onClick={() => onSelectRegion(r)}
            >
              {REGION_LABELS[r]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="build-menu">
      <p className="build-intro">
        Showing plant options for <strong>{REGION_LABELS[region]}</strong>.
        Suitability multipliers shown per type.
      </p>
      <div className="build-grid">
        {ALL_PLANT_TYPES.map((type) => {
          const def = getPlantDefinition(type, state.currentYear);
          if (!def) return null;

          const suitability = REGIONAL_SUITABILITY[type][region];
          const affordable = state.money >= def.buildCost;
          const unlocked = state.currentYear >= def.availableFromYear;
          const canBuild = affordable && unlocked;

          return (
            <div
              key={type}
              className={`build-card ${!canBuild ? 'disabled' : ''}`}
            >
              <div className="build-card-header">
                <h4>{def.displayName}</h4>
                <span
                  className={`suitability-badge ${
                    suitability >= 1.2
                      ? 'excellent'
                      : suitability >= 1.0
                        ? 'good'
                        : suitability >= 0.8
                          ? 'ok'
                          : 'poor'
                  }`}
                >
                  ×{suitability.toFixed(2)}
                </span>
              </div>
              <div className="build-card-stats">
                <div>
                  <span className="stat-label">Build:</span> $
                  {def.buildCost.toFixed(0)}M
                </div>
                <div>
                  <span className="stat-label">Maint:</span> $
                  {def.maintenanceCost}M/yr
                </div>
                <div>
                  <span className="stat-label">Output:</span>{' '}
                  {formatLargeNumber(def.energyPerMonth)} MWh/mo
                </div>
                <div>
                  <span className="stat-label">CO₂:</span>{' '}
                  {def.co2PerMWh.toFixed(3)} t/MWh
                </div>
                <div>
                  <span className="stat-label">Build time:</span>{' '}
                  {def.buildTimeYears}y
                </div>
              </div>
              <button
                className="build-card-btn"
                onClick={() => onBuild(type)}
                disabled={!canBuild}
              >
                {!unlocked
                  ? `Unlocks ${def.availableFromYear}`
                  : !affordable
                    ? 'Insufficient funds'
                    : 'Build'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   ENERGY PANEL
   ============================================================ */

function EnergyPanel() {
  const { state } = useGame();

  const operational = state.plants.filter((p) => p.operational);
  const building = state.plants.filter((p) => !p.operational);

  const annualEnergy = state.metrics.totalEnergyProduced;
  const annualCO2 = state.metrics.totalCO2Emitted;

  const byType = useMemo(() => {
    const map = new Map<PlantType, number>();
    for (const p of operational) {
      map.set(p.type, (map.get(p.type) ?? 0) + 1);
    }
    return map;
  }, [operational]);

  const annualMaintenance = useMemo(() => {
    let total = 0;
    for (const p of operational) {
      const def = getPlantDefinition(p.type, state.currentYear);
      if (def) total += def.maintenanceCost;
    }
    return total;
  }, [operational, state.currentYear]);

  return (
    <div className="energy-panel">
      <div className="energy-stats-grid">
        <div className="energy-stat-card">
          <div className="energy-stat-label">Total Energy Produced</div>
          <div className="energy-stat-value">
            {formatLargeNumber(annualEnergy)} MWh
          </div>
        </div>
        <div className="energy-stat-card">
          <div className="energy-stat-label">Total CO₂ Emitted</div>
          <div className="energy-stat-value">
            {formatLargeNumber(annualCO2)} tons
          </div>
        </div>
        <div className="energy-stat-card">
          <div className="energy-stat-label">Annual Maintenance</div>
          <div className="energy-stat-value">${annualMaintenance}M/yr</div>
        </div>
        <div className="energy-stat-card">
          <div className="energy-stat-label">Active Plants</div>
          <div className="energy-stat-value">
            {operational.length}{' '}
            {building.length > 0 && (
              <span className="stat-sub">
                +{building.length} building
              </span>
            )}
          </div>
        </div>
      </div>

      <h3>Plant Breakdown</h3>
      {byType.size === 0 ? (
        <p className="energy-empty">
          No operational plants yet. Build one to start producing.
        </p>
      ) : (
        <ul className="plant-breakdown">
          {Array.from(byType.entries()).map(([type, count]) => (
            <li key={type}>
              <span>{plantDisplayName(type)}</span>
              <span className="plant-count">×{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ============================================================
   RESOURCE MARKET PANEL
   ============================================================ */

function ResourceMarketPanel() {
  const { state, actions } = useGame();
  const [quantities, setQuantities] = useState<Record<ResourceType, number>>({
    coal: 0,
    natural_gas: 0,
    petroleum: 0,
    uranium: 0,
  });

  const handleBuy = (resource: ResourceType) => {
    const qty = quantities[resource];
    if (qty <= 0) return;
    const success = actions.buyResource(resource, qty);
    if (success) {
      setQuantities((q) => ({ ...q, [resource]: 0 }));
    }
  };

  const totalCost = (resource: ResourceType) =>
    quantities[resource] * state.resourcePrices[resource];

  return (
    <div className="market-panel">
      <p className="market-intro">
        Buy fuel to keep your plants running. Prices are flat across the
        game — stockpile freely when you have spare cash.
      </p>
      <div className="market-grid">
        {ALL_RESOURCES.map((resource) => {
          const qty = quantities[resource];
          const cost = totalCost(resource);
          const affordable = state.money >= cost;

          return (
            <div key={resource} className="market-card">
              <div className="market-card-header">
                <h4>{RESOURCE_LABELS[resource]}</h4>
                <span className="market-price">
                  ${state.resourcePrices[resource]}/unit
                </span>
              </div>
              <div className="market-stock">
                Current stock:{' '}
                <strong>{formatLargeNumber(state.resources[resource])}</strong>{' '}
                units
              </div>
              <div className="market-input-row">
                <button
                  className="market-qty-btn"
                  onClick={() =>
                    setQuantities((q) => ({
                      ...q,
                      [resource]: Math.max(0, q[resource] - 10),
                    }))
                  }
                >
                  −10
                </button>
                <input
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) =>
                    setQuantities((q) => ({
                      ...q,
                      [resource]: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className="market-qty-input"
                />
                <button
                  className="market-qty-btn"
                  onClick={() =>
                    setQuantities((q) => ({
                      ...q,
                      [resource]: q[resource] + 10,
                    }))
                  }
                >
                  +10
                </button>
              </div>
              <div className="market-total">
                Total: <strong>${cost.toFixed(0)}M</strong>
              </div>
              <button
                className="market-buy-btn"
                onClick={() => handleBuy(resource)}
                disabled={qty <= 0 || !affordable}
              >
                {qty <= 0
                  ? 'Enter quantity'
                  : !affordable
                    ? 'Insufficient funds'
                    : `Buy ${qty} units`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   HELPERS
   ============================================================ */

function plantDisplayName(type: PlantType): string {
  const names: Record<PlantType, string> = {
    coal: 'Coal Plant',
    natural_gas: 'Natural Gas Plant',
    petroleum: 'Petroleum Plant',
    nuclear: 'Nuclear Plant',
    hydro: 'Hydroelectric Dam',
    wind: 'Wind Farm',
    solar: 'Solar Array',
  };
  return names[type];
}

export default Game;