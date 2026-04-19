import { useEffect, useState, useMemo } from 'react';
import { geoPath, geoAlbersUsa } from 'd3-geo';
import type { Polygon, MultiPolygon as TopoMultiPolygon } from 'topojson-specification';
import { feature, merge } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { Feature, MultiPolygon, GeoJsonProperties } from 'geojson';
import { STATE_TO_REGION, REGION_LABELS, type Region } from '../../game/regions';
import { FIPS_TO_STATE } from '../../game/fips';
import './USMap.css';

interface USMapProps {
  selectedRegion: Region | null;
  onRegionClick: (region: Region) => void;
}

/**
 * The TopoJSON structure we expect from us-10m.v1.json.
 * The "states" object is a GeometryCollection of all US states.
 */
interface USTopology extends Topology {
  objects: {
    states: GeometryCollection;
    nation: GeometryCollection;
  };
}

interface RegionPath {
  region: Region;
  d: string;
  centroidX: number;
  centroidY: number;
}

/**
 * Real US map with states merged into 5 clickable regions.
 *
 * Fetches us-10m.v1.json once on mount, merges state geometries by
 * region using STATE_TO_REGION, and renders each region as a single
 * <path>. Alaska and Hawaii excluded.
 */
function USMap({ selectedRegion, onRegionClick }: USMapProps) {
  const [topology, setTopology] = useState<USTopology | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/us-10m.v1.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: USTopology) => {
        if (!cancelled) setTopology(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Merge state geometries by region and compute centroids for labels.
   * Memoized so the expensive merge only runs when topology changes.
   */
  const regionPaths = useMemo<RegionPath[]>(() => {
    if (!topology) return [];

    // Use geoAlbersUsa projection — handles contiguous US nicely,
    // but we scale/translate to fit our 960x600 viewBox.
    const projection = geoAlbersUsa()
      .scale(1200)
      .translate([480, 300]);
    const pathGenerator = geoPath(projection);

    // Group state geometries by region
    type PolygonalGeometry =
      | import('topojson-specification').Polygon
      | import('topojson-specification').MultiPolygon;

    // Group state geometries by region
    const geometriesByRegion = new Map<Region, PolygonalGeometry[]>();
    for (const geom of topology.objects.states.geometries) {
      const fipsId = String(geom.id).padStart(2, '0');
      const stateCode = FIPS_TO_STATE[fipsId];
      if (!stateCode) continue; // Skip Alaska, Hawaii, DC, PR

      const region = STATE_TO_REGION[stateCode];
      if (!region) continue;

      // Narrow: the us-10m dataset only contains Polygon/MultiPolygon states.
      // Skip anything unexpected (defensive — shouldn't happen in practice).
      if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue;

      const existing = geometriesByRegion.get(region) ?? [];
      existing.push(geom as PolygonalGeometry);
      geometriesByRegion.set(region, existing);
    }

    // For each region, merge its state geometries into a single MultiPolygon
    // and generate the SVG path + centroid.
    const results: RegionPath[] = [];
    for (const [region, geoms] of geometriesByRegion) {
      const mergedFeature = merge(topology, geoms) as MultiPolygon;
      const wrappedFeature: Feature<MultiPolygon, GeoJsonProperties> = {
        type: 'Feature',
        geometry: mergedFeature,
        properties: {},
      };

      const d = pathGenerator(wrappedFeature);
      const centroid = pathGenerator.centroid(wrappedFeature);

      if (d) {
        results.push({
          region,
          d,
          centroidX: centroid[0],
          centroidY: centroid[1],
        });
      }
    }

    return results;
  }, [topology]);

  if (loadError) {
    return (
      <div className="us-map-wrapper us-map-error">
        <p>Failed to load map: {loadError}</p>
        <p>
          Make sure <code>public/data/us-10m.v1.json</code> exists.
        </p>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="us-map-wrapper us-map-loading">
        <p>Loading map…</p>
      </div>
    );
  }

  return (
    <div className="us-map-wrapper">
      <svg
        viewBox="0 0 960 600"
        xmlns="http://www.w3.org/2000/svg"
        className="us-map-svg"
      >
        {regionPaths.map(({ region, d, centroidX, centroidY }) => (
          <g key={region}>
            <path
              d={d}
              className={`region ${selectedRegion === region ? 'selected' : ''}`}
              onClick={() => onRegionClick(region)}
              data-region={region}
            />
            <text
              x={centroidX}
              y={centroidY}
              className="region-label"
            >
              {REGION_LABELS[region]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default USMap;