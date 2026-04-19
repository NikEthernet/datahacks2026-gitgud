import { Link } from 'react-router-dom';
import './Home.css';
//import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Can You Power America <span className="accent">Without Burning It?</span>
          </h1>
          <p className="hero-tagline">
            A strategy game powered by 76 years of real EIA, NREL, and
            Scripps data. Start in 1949. Make it to 2025. Try not to drown the coasts.
          </p>
          <div className="hero-cta">
            <Link to="/game" className="btn btn-primary">
              Start Playing
            </Link>
            <Link to="/data" className="btn btn-secondary">
              Explore the Data
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">What You'll Do</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Build the Grid</h3>
            <p>
              Place coal, gas, nuclear, hydro, wind, and solar plants across
              the United States. Each tech unlocks when history made it viable.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📉</div>
            <h3>Manage Emissions</h3>
            <p>
              Every plant comes with real-world emissions, costs, and build times.
              Minimize your carbon footprint while keeping the lights on.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌊</div>
            <h3>Race Against Climate</h3>
            <p>
              Your emissions feed into a live sea-level model sourced from
              Scripps Oceanography. Every decision ripples forward in time.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📰</div>
            <h3>Live Through History</h3>
            <p>
              Navigate the 1973 oil crisis, Three Mile Island, the rise of natural
              gas, and the solar boom — all driven by real historical data.
            </p>
          </div>
        </div>
      </section>

      <section className="data-callout">
        <h2>Every Number Is Real</h2>
        <p>
          Energy capacities, emissions factors, build costs, historical demand —
          all sourced from the U.S. Energy Information Administration, the
          National Renewable Energy Laboratory, and Scripps Institution of
          Oceanography.
        </p>
      </section>
    </div>
  );
}

export default Home;