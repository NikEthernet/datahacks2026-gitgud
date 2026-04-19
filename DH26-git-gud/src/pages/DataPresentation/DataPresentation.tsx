import './DataPresentation.css';

function DataPresentation() {
  return (
    <div className="data-presentation">
      <section className="dp-hero">
        <h1>The Data Behind the Game</h1>
        <p className="dp-subtitle">
          Every mechanic in this simulation is calibrated to real-world measurements.
          Below: the datasets we used, what they reveal, and why they matter.
        </p>
      </section>

      <section className="dp-section">
        <h2>Methodology</h2>
        <p>
          We integrated four primary datasets: U.S. energy consumption from the
          Energy Information Administration (EIA), annual CO₂ emissions by sector,
          sea-level anomalies from Scripps Oceanography, and CalCOFI oceanographic
          sampling data. Each player action in the game is scored against these
          historical baselines.
        </p>
      </section>

      <section className="dp-section">
        <h2>Dataset 1: U.S. Energy Consumption (EIA)</h2>
        <p className="dp-placeholder">
          [Chart placeholder — line chart of annual consumption by source, 1949–2025]
        </p>
        <p>
          Coverage, source URL, notable insights from the data will go here.
        </p>
      </section>

      <section className="dp-section">
        <h2>Dataset 2: Annual CO₂ Emissions</h2>
        <p className="dp-placeholder">
          [Chart placeholder — stacked area chart of emissions by sector]
        </p>
        <p>
          Breakdown of emissions, the inflection points, what caused them.
        </p>
      </section>

      <section className="dp-section">
        <h2>Dataset 3: Sea-Level Anomaly (Scripps)</h2>
        <p className="dp-placeholder">
          [Chart placeholder — line chart showing sea-level rise trend]
        </p>
        <p>
          The long-term scoreboard. Every choice in the game ultimately cashes
          out against this curve.
        </p>
      </section>

      <section className="dp-section">
        <h2>Dataset 4: CalCOFI Oceanographic Sampling</h2>
        <p className="dp-placeholder">
          [Chart placeholder — temperature/salinity trends over time]
        </p>
        <p>
          Deeper context on how warming translates into measurable changes in
          Pacific waters off California.
        </p>
      </section>

      <section className="dp-section">
        <h2>How the Data Powers the Game</h2>
        <p>
          Energy plant capacities, build costs, emissions factors, and lifespan
          values all derive from real EIA and NREL specifications. Historical
          events (oil embargoes, nuclear accidents, renewable incentives) trigger
          in the years they actually occurred, with their real-world economic
          and public-opinion effects baked into the game's state transitions.
        </p>
      </section>
    </div>
  );
}

export default DataPresentation;