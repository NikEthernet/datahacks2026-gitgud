import type { Region } from '../../game/regions';
import './USMap.css';

interface USMapProps {
  selectedRegion: Region | null;
  onRegionClick: (region: Region) => void;
}

/**
 * Simplified 5-region US map. Paths are stylized approximations, not
 * geographically precise. Each <path> has data-region for click routing.
 */
function USMap({ selectedRegion, onRegionClick }: USMapProps) {
  return (
    <div className="us-map-wrapper">
      <svg
        viewBox="0 0 800 480"
        xmlns="http://www.w3.org/2000/svg"
        className="us-map-svg"
      >
        {/* West */}
        <path
          d="M 80 140 L 220 120 L 240 280 L 230 420 L 100 400 L 70 280 Z"
          className={`region ${selectedRegion === 'west' ? 'selected' : ''}`}
          onClick={() => onRegionClick('west')}
          data-region="west"
        />
        <text x="150" y="280" className="region-label">West</text>

        {/* Southwest */}
        <path
          d="M 240 280 L 420 280 L 440 440 L 230 420 Z"
          className={`region ${selectedRegion === 'southwest' ? 'selected' : ''}`}
          onClick={() => onRegionClick('southwest')}
          data-region="southwest"
        />
        <text x="330" y="370" className="region-label">Southwest</text>

        {/* Midwest */}
        <path
          d="M 220 120 L 480 140 L 500 280 L 420 280 L 240 280 Z"
          className={`region ${selectedRegion === 'midwest' ? 'selected' : ''}`}
          onClick={() => onRegionClick('midwest')}
          data-region="midwest"
        />
        <text x="360" y="215" className="region-label">Midwest</text>

        {/* Northeast */}
        <path
          d="M 480 140 L 680 160 L 720 240 L 620 280 L 500 280 Z"
          className={`region ${selectedRegion === 'northeast' ? 'selected' : ''}`}
          onClick={() => onRegionClick('northeast')}
          data-region="northeast"
        />
        <text x="600" y="225" className="region-label">Northeast</text>

        {/* Southeast */}
        <path
          d="M 420 280 L 620 280 L 680 400 L 560 440 L 440 440 Z"
          className={`region ${selectedRegion === 'southeast' ? 'selected' : ''}`}
          onClick={() => onRegionClick('southeast')}
          data-region="southeast"
        />
        <text x="540" y="370" className="region-label">Southeast</text>
      </svg>
    </div>
  );
}

export default USMap;