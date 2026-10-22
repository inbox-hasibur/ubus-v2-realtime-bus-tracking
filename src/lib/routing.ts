/**
 * Routing and Geospatial Utilities for UBus V2
 * Uses OpenStreetMap OSRM for real turn-by-turn road paths.
 * Micro-segmentation engine for ESP32 GPS + ESP32-CAM YOLO traffic layers.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface TrafficSegment {
  id: string;
  coords: [number, number][];
  status: 'smooth' | 'moderate' | 'congested';
  color: string;
  speedKmh: number;
  vehicleCount?: number;
  label: string;
}

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  distanceKm: number;
  durationMinutes: number;
  trafficLevel: 'smooth' | 'moderate' | 'congested';
  trafficColor: string;
  segments?: TrafficSegment[];
}

export interface KnownStop {
  id: string;
  name: string;
  coords: [number, number]; // [lat, lng]
}

export const KNOWN_STOPS: KnownStop[] = [
  { id: 'iubat', name: 'IUBAT Campus (Main Gate)', coords: [23.8759, 90.3795] },
  { id: 'kamarpara', name: 'Kamarpara Bridge & Stand', coords: [23.8860, 90.3870] },
  { id: 'abdullahpur', name: 'Abdullahpur Bus Stand', coords: [23.8920, 90.4020] },
  { id: 'cheragali', name: 'Cherag Ali Bus Stand (Tongi)', coords: [23.9005, 90.4005] },
  { id: 'stationroad', name: 'Tongi Station Road', coords: [23.8950, 90.4020] },
  { id: 'housebuilding', name: 'House Building (Uttara)', coords: [23.8745, 90.3980] },
  { id: 'azampur', name: 'Azampur Bus Stand', coords: [23.8680, 90.4010] },
  { id: 'jasimuddin', name: 'Jashimuddin Avenue', coords: [23.8580, 90.4000] },
  { id: 'airport', name: 'Hazrat Shahjalal Airport', coords: [23.8500, 90.4080] },
  { id: 'kuril', name: 'Kuril Bishwa Road', coords: [23.8190, 90.4190] },
  { id: 'chowrastha', name: 'Gazipur Chowrastha', coords: [23.9980, 90.3800] },
];

export interface OverpassTransitStop {
  id: number;
  name: string;
  coords: [number, number];
  type: string;
}

export const MAP_PROVIDERS = [
  {
    id: 'openfreemap_liberty',
    name: 'OpenFreeMap Liberty (Vector 3D)',
    url: 'https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: '&copy; OpenFreeMap & OpenStreetMap contributors',
    isVector: true,
  },
  {
    id: 'openfreemap_bright',
    name: 'OpenFreeMap Bright (Clean Vector)',
    url: 'https://tiles.openfreemap.org/styles/bright/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/bright',
    attribution: '&copy; OpenFreeMap & OpenStreetMap',
    isVector: true,
  },
  {
    id: 'openfreemap_positron',
    name: 'OpenFreeMap Positron (Minimal)',
    url: 'https://tiles.openfreemap.org/styles/positron/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '&copy; OpenFreeMap & OpenStreetMap',
    isVector: true,
  },
  {
    id: 'carto_dark',
    name: 'CartoDB Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO & OpenStreetMap',
    isVector: false,
  },
  {
    id: 'carto',
    name: 'CartoDB Voyager (Modern Light)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO & OpenStreetMap',
    isVector: false,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    isVector: false,
  },
  {
    id: 'google',
    name: 'Google Streets',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    isVector: false,
  },
  {
    id: 'google_satellite',
    name: 'Google Satellite & Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    isVector: false,
  },
  {
    id: 'google_terrain',
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    isVector: false,
  },
];

/**
 * Fetch authentic real-world transit stations via Overpass API
 */
export async function fetchOverpassBusStops(
  bbox: [number, number, number, number] = [23.83, 90.35, 23.95, 90.45]
): Promise<OverpassTransitStop[]> {
  try {
    const [minLat, minLon, maxLat, maxLon] = bbox;
    const query = `[out:json][timeout:10];(node["highway"="bus_stop"](${minLat},${minLon},${maxLat},${maxLon});node["amenity"="bus_station"](${minLat},${minLon},${maxLat},${maxLon}););out 30;`;
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.elements) return [];
    return json.elements.map((el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => ({
      id: el.id,
      coords: [el.lat, el.lon] as [number, number],
      name: el.tags?.name || el.tags?.['name:en'] || el.tags?.['name:bn'] || 'OSM Transit Stop',
      type: el.tags?.amenity === 'bus_station' ? 'Bus Station' : 'Bus Stop',
    }));
  } catch (err) {
    console.warn('Overpass API query failed (using cached OSM stops):', err);
    return [];
  }
}

/**
 * Calculate distance in kilometers between two GPS coordinates using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Determine traffic status based on bus speed (km/h) and optional YOLO camera vehicle count
 */
export function getTrafficStatus(
  speedKmh: number,
  vehicleCount?: number
): {
  level: 'smooth' | 'moderate' | 'congested';
  color: string;
  label: string;
} {
  // If YOLO detected severe vehicle congestion in front (e.g. > 18 vehicles) or speed < 12 km/h
  if ((vehicleCount !== undefined && vehicleCount >= 18) || speedKmh < 12) {
    return { level: 'congested', color: '#ef4444', label: 'Heavy Jam (Red)' };
  } else if ((vehicleCount !== undefined && vehicleCount >= 8) || speedKmh < 28) {
    return { level: 'moderate', color: '#eab308', label: 'Moderate Traffic (Yellow)' };
  } else {
    return { level: 'smooth', color: '#22c55e', label: 'Smooth / Clear (Green)' };
  }
}

/**
 * Micro-segmentation: Split an OSRM route into colored traffic segments
 * Maps bus locations and YOLO camera observations directly to road segments.
 */
export function createTrafficSegments(
  coordinates: [number, number][],
  busLocations: { latitude: number; longitude: number; speed: number }[] = [],
  yoloOverride?: { speed: number; vehicleCount: number; targetSegmentIndex?: number }
): TrafficSegment[] {
  if (!coordinates || coordinates.length < 2) return [];

  // Group coordinates into segments of ~4 to 6 points each (~100m to 200m)
  const chunkSize = Math.max(3, Math.min(8, Math.ceil(coordinates.length / 8)));
  const segments: TrafficSegment[] = [];

  for (let i = 0; i < coordinates.length - 1; i += chunkSize) {
    // Keep 1 overlapping coordinate so polyline segments connect seamlessly
    const sliceEnd = Math.min(coordinates.length, i + chunkSize + 1);
    const segCoords = coordinates.slice(i, sliceEnd);
    if (segCoords.length < 2) continue;

    const segIndex = segments.length;
    // Calculate segment midpoint
    const midLat = segCoords[Math.floor(segCoords.length / 2)][0];
    const midLng = segCoords[Math.floor(segCoords.length / 2)][1];

    // Find if an active bus is near this segment (within 350m)
    const matchedBus = busLocations.find(b => {
      return calculateDistanceKm(midLat, midLng, b.latitude, b.longitude) < 0.35;
    });

    let segSpeed = matchedBus ? matchedBus.speed : 35; // Default smooth
    let segVehicleCount: number | undefined = undefined;

    // Apply YOLO or Camera AI simulation if provided
    if (yoloOverride) {
      if (
        yoloOverride.targetSegmentIndex === undefined ||
        yoloOverride.targetSegmentIndex === segIndex
      ) {
        segSpeed = yoloOverride.speed;
        segVehicleCount = yoloOverride.vehicleCount;
      }
    }

    const traffic = getTrafficStatus(segSpeed, segVehicleCount);

    segments.push({
      id: `seg-${segIndex}`,
      coords: segCoords,
      status: traffic.level,
      color: traffic.color,
      speedKmh: segSpeed,
      vehicleCount: segVehicleCount,
      label: traffic.label,
    });
  }

  return segments;
}

/**
 * Fetch real turn-by-turn road route from OpenStreetMap OSRM
 * and generates live traffic segments
 */
export async function fetchOSRMRoute(
  start: [number, number],
  end: [number, number],
  averageSpeedKmh: number = 30,
  busLocations: { latitude: number; longitude: number; speed: number }[] = [],
  yoloData?: { speed: number; vehicleCount: number }
): Promise<RouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM request failed with status: ${response.status}`);
    
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
    const effectiveSpeed = Math.max(averageSpeedKmh, 10);
    const calculatedMinutes = Math.round((distanceKm / effectiveSpeed) * 60);
    const durationMinutes = Math.max(calculatedMinutes, Math.round(route.duration / 60));

    // Generate real traffic segments along the road geometry
    const segments = createTrafficSegments(coordinates, busLocations, yoloData);
    const overallTraffic = getTrafficStatus(averageSpeedKmh, yoloData?.vehicleCount);

    return {
      coordinates,
      distanceKm,
      durationMinutes,
      trafficLevel: overallTraffic.level,
      trafficColor: overallTraffic.color,
      segments,
    };
  } catch (error) {
    console.error('Failed to fetch OSRM route:', error);
    const straightDist = calculateDistanceKm(start[0], start[1], end[0], end[1]);
    const duration = Math.round((straightDist / Math.max(averageSpeedKmh, 10)) * 60);
    const overallTraffic = getTrafficStatus(averageSpeedKmh);
    const fallbackCoords: [number, number][] = [start, end];
    return {
      coordinates: fallbackCoords,
      distanceKm: straightDist,
      durationMinutes: duration,
      trafficLevel: overallTraffic.level,
      trafficColor: overallTraffic.color,
      segments: createTrafficSegments(fallbackCoords, busLocations),
    };
  }
}

/**
 * Geocode a text search query using OpenStreetMap Nominatim or Known Stops
 */
export async function geocodeLocation(query: string): Promise<[number, number] | null> {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  const matched = KNOWN_STOPS.find(
    s => s.name.toLowerCase().includes(clean) || clean.includes(s.name.toLowerCase()) || clean.includes(s.id)
  );
  if (matched) return matched.coords;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=bd&limit=1&q=${encodeURIComponent(
      query + ' Dhaka'
    )}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UBus-Realtime-Tracking/2.0' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) {
    console.warn('Geocoding error:', e);
  }

  return null;
}
