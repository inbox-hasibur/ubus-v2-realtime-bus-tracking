"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  RouteResult, 
  KNOWN_STOPS, 
  KnownStop, 
  MAP_PROVIDERS, 
  OverpassTransitStop, 
  fetchOverpassBusStops 
} from "@/lib/routing";
import { 
  Layers, 
  Plus, 
  Minus, 
  Compass, 
  Crosshair, 
  Activity, 
  Radio, 
  Sparkles, 
  Check, 
  Zap, 
  Route as RouteIcon 
} from "lucide-react";
import MapLibreView from "@/components/MapLibreView";

export interface BusData {
  bus_no?: string;
  route_name?: string;
  driver_number?: string;
  status?: string;
}

export interface BusLocationItem {
  latitude: number;
  longitude: number;
  speed: number;
  buses?: BusData | null;
}

export interface RouteGeometryItem {
  points: string | [number, number][];
  routes?: {
    route_color?: string;
  } | null;
}

export interface MapProps {
  navigationRoute?: RouteResult | null;
  userCoords?: [number, number] | null;
  selectedBusNo?: string | null;
  theme?: "dark" | "light";
  onMapClick?: (coords: [number, number]) => void;
  onSelectBus?: (bus: BusLocationItem) => void;
  onSelectStop?: (stop: KnownStop) => void;
}

const DEFAULT_CAMPUS_BUSES: BusLocationItem[] = [
  {
    latitude: 23.9005,
    longitude: 90.4005,
    speed: 34,
    buses: { bus_no: "12", route_name: "Tongi - IUBAT Campus", driver_number: "seats_available", status: "active" },
  },
  {
    latitude: 23.8820,
    longitude: 90.4030,
    speed: 28,
    buses: { bus_no: "07", route_name: "Abdullahpur - IUBAT Campus", driver_number: "standing_only", status: "active" },
  },
  {
    latitude: 23.8740,
    longitude: 90.3980,
    speed: 42,
    buses: { bus_no: "04", route_name: "House Building - IUBAT Campus", driver_number: "seats_available", status: "active" },
  },
  {
    latitude: 23.8950,
    longitude: 90.4020,
    speed: 14,
    buses: { bus_no: "19", route_name: "Station Road - IUBAT Campus", driver_number: "full", status: "active" },
  },
];

// Subcomponent to capture map instance cleanly inside MapContainer
function MapController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

// Subcomponent to fit map bounds to active navigation route
function RouteFitter({ coordinates }: { coordinates?: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (map && coordinates && coordinates.length > 1) {
      map.fitBounds(L.latLngBounds(coordinates), { padding: [60, 60], maxZoom: 16 });
    }
  }, [map, coordinates]);
  return null;
}

// Subcomponent to capture map click events
function MapClickHandler({ onClick }: { onClick?: (coords: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

const parsePolylinePoints = (points: unknown): [number, number][] => {
  if (Array.isArray(points)) {
    return points as [number, number][];
  }
  if (typeof points === "string") {
    try {
      const parsed = JSON.parse(points);
      if (Array.isArray(parsed)) return parsed as [number, number][];
    } catch {
      return [];
    }
  }
  return [];
};

export default function Map({
  navigationRoute,
  userCoords,
  selectedBusNo,
  theme = "dark",
  onMapClick,
  onSelectBus,
  onSelectStop,
}: MapProps) {
  // 1. Map Frontend Engine: Leaflet 2D vs MapLibre GL 3D Vector
  const [mapEngine, setMapEngine] = useState<"leaflet" | "maplibre">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_map_engine") as "leaflet" | "maplibre") || "leaflet";
    }
    return "leaflet";
  });

  // 2. Routing Engine: OSRM Road Geometry vs Valhalla Map-Matching
  const [routingEngine, setRoutingEngine] = useState<"osrm" | "valhalla">("osrm");

  // 3. Tile & Vector Data Provider
  const [selectedProviderId, setSelectedProviderId] = useState<string>(() => {
    return theme === "light" ? "carto" : "carto_dark";
  });

  const [busLocations, setBusLocations] = useState<BusLocationItem[]>(DEFAULT_CAMPUS_BUSES);
  const [isClient, setIsClient] = useState(false);
  const [geometries, setGeometries] = useState<RouteGeometryItem[]>([]); 
  const [showLayerStudio, setShowLayerStudio] = useState(false);
  const [animatedBusCoord, setAnimatedBusCoord] = useState<[number, number] | null>(null);
  const [animatedSpeed, setAnimatedSpeed] = useState<number>(34);
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);
  const [gpsStatusNotice, setGpsStatusNotice] = useState<string | null>(null);

  // Overpass API dynamic stops state
  const [overpassStops, setOverpassStops] = useState<OverpassTransitStop[]>([]);
  const [isLoadingOverpass, setIsLoadingOverpass] = useState(false);
  const [enableOverpassOverlay, setEnableOverpassOverlay] = useState(false);

  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleZoomIn = useCallback(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  }, []);

  const handleResetNorth = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([23.8759, 90.3795], 15, { animate: true, duration: 1.2 });
    }
  }, []);

  // Sync provider on theme change if using default
  useEffect(() => {
    if (theme === "light") {
      setSelectedProviderId((prev) => (prev === "carto_dark" ? "openfreemap_bright" : prev));
    } else {
      setSelectedProviderId((prev) => (prev === "openfreemap_bright" ? "carto_dark" : prev));
    }
  }, [theme]);

  // Persist map engine choice
  const handleEngineSwitch = (engine: "leaflet" | "maplibre") => {
    setMapEngine(engine);
    if (typeof window !== "undefined") {
      localStorage.setItem("ubus_map_engine", engine);
    }
  };

  // Smooth real-time animation of Bus 12 along turn-by-turn navigation coordinates
  useEffect(() => {
    if (!navigationRoute?.coordinates || navigationRoute.coordinates.length < 2) {
      setAnimatedBusCoord(null);
      return;
    }

    const coords = navigationRoute.coordinates;
    let idx = 0;
    setAnimatedBusCoord(coords[0]);

    const timer = setInterval(() => {
      idx = (idx + 1) % coords.length;
      setAnimatedBusCoord(coords[idx]);

      const segSpeed = navigationRoute.segments && navigationRoute.segments.length > 0
        ? navigationRoute.segments[Math.min(idx % navigationRoute.segments.length, navigationRoute.segments.length - 1)].speedKmh
        : 32 + (idx % 3) * 4;
      setAnimatedSpeed(segSpeed);
    }, 1400);

    return () => clearInterval(timer);
  }, [navigationRoute]);
  
  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const activeProvider = useMemo(() => {
    return MAP_PROVIDERS.find(p => p.id === selectedProviderId) || MAP_PROVIDERS[0];
  }, [selectedProviderId]);

  // Enhanced "Track Near Me" with high accuracy & graceful campus fallback
  const trackMe = useCallback(() => {
    setGpsStatusNotice("Locating your device...");

    if (!navigator.geolocation) {
      // Fallback to IUBAT Campus Gateway
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([23.8759, 90.3795], 16, { animate: true, duration: 1.2 });
      }
      window.dispatchEvent(new CustomEvent('user-location', { 
        detail: { latitude: 23.8759, longitude: 90.3795, isFallback: true } 
      }));
      setGpsStatusNotice("📍 Centered on Campus Gateway (GPS not supported)");
      setTimeout(() => setGpsStatusNotice(null), 4000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (mapInstanceRef.current && typeof mapInstanceRef.current.flyTo === 'function') {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, {
            animate: true,
            duration: 1.4,
          });
        }

        window.dispatchEvent(new CustomEvent('user-location', { detail: { latitude, longitude } }));
        setGpsStatusNotice(`📍 GPS Locked (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setTimeout(() => setGpsStatusNotice(null), 4500);
      },
      (error) => {
        console.warn('Geolocation failed or denied, using nearest campus gateway coordinate:', error);
        const fallbackLat = 23.8759;
        const fallbackLng = 90.3795;

        if (mapInstanceRef.current && typeof mapInstanceRef.current.flyTo === 'function') {
          mapInstanceRef.current.flyTo([fallbackLat, fallbackLng], 16, {
            animate: true,
            duration: 1.4,
          });
        }

        window.dispatchEvent(new CustomEvent('user-location', { 
          detail: { latitude: fallbackLat, longitude: fallbackLng, isFallback: true } 
        }));
        setGpsStatusNotice("📍 Showing IUBAT Campus Transit Hub");
        setTimeout(() => setGpsStatusNotice(null), 4500);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, []);

  // Bus DivIcon with dynamic speed color dot
  const createBusIcon = useCallback((busNo: string, speed: number, isSelected: boolean = false) => {
    const digits = (busNo || "").toString().replace(/\D+/g, "");
    const display = digits ? digits.slice(-2) : (busNo || "").toString().slice(-2);
    const speedColor = speed >= 30 ? "#22c55e" : speed >= 15 ? "#eab308" : "#ef4444";

    if (isSelected || display === "12") {
      return L.divIcon({
        className: "custom-bus-marker-selected",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: scale(1.15);">
            <div style="background-color: #facc15; color: #000000; font-weight: 900; font-size: 13px; width: 34px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 6px 14px rgba(0,0,0,0.4); position: relative;">
              ${display || "12"}
              <span style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; background-color: ${speedColor}; border: 1.5px solid white; border-radius: 9999px;"></span>
            </div>
            <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #facc15; margin-top: -1px;"></div>
          </div>
        `,
        iconSize: [36, 40],
        iconAnchor: [18, 38],
      });
    }

    return L.divIcon({
      className: "custom-bus-marker-dot",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <span style="position: absolute; width: 26px; height: 26px; border-radius: 9999px; background-color: #ef4444; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <div style="width: 22px; height: 22px; border-radius: 9999px; background-color: #dc2626; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.35); color: white; font-weight: 900; font-size: 10px;">
            ${display || '•'}
          </div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
  }, []);

  // Live User Location DivIcon (pulsing blue ring)
  const createUserIcon = useCallback(() => {
    return L.divIcon({
      className: "user-location-marker",
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background-color: #3b82f6; opacity: 0.5; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: #2563eb; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  // Station DivIcon
  const createStationIcon = useCallback((name: string, isOverpass: boolean = false) => {
    return L.divIcon({
      className: isOverpass ? "osm-overpass-marker" : "station-marker",
      html: `
        <div style="display: flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px); padding: 2px 6px; border-radius: 12px; border: 1.5px solid ${isOverpass ? '#0284c7' : '#cbd5e1'}; box-shadow: 0 2px 4px rgba(0,0,0,0.15); cursor: pointer;">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background-color: ${isOverpass ? '#0284c7' : '#3b82f6'}; shrink-0;"></span>
          <span style="font-size: 9px; font-weight: 800; color: #1e293b; white-space: nowrap;">${name}</span>
        </div>
      `,
      iconSize: [120, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  // Destination Flag DivIcon
  const createDestIcon = useCallback(() => {
    return L.divIcon({
      className: "dest-marker",
      html: `
        <div style="background-color: #ef4444; color: white; width: 28px; height: 28px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; border: 2.5px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
          🏁
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const { data: locs, error: locError } = await supabase
        .from('bus_locations')
        .select(`latitude, longitude, speed, buses (bus_no, route_name, driver_number, status)`);

      if (locError) throw locError;
      if (locs && locs.length > 0) setBusLocations(locs as unknown as BusLocationItem[]);

      const { data: geom, error: geomError } = await supabase
        .from('route_geometry')
        .select(`points, routes(route_color)`);
      
      if (geomError) throw geomError;
      if (geom) setGeometries(geom as unknown as RouteGeometryItem[]);

    } catch (err) {
      console.error("Error fetching bus data:", err);
    }
  }, []);

  // Fetch real transit stops via Overpass API on request
  const handleToggleOverpass = async () => {
    if (enableOverpassOverlay) {
      setEnableOverpassOverlay(false);
      return;
    }

    setIsLoadingOverpass(true);
    setEnableOverpassOverlay(true);
    const stops = await fetchOverpassBusStops();
    setOverpassStops(stops);
    setIsLoadingOverpass(false);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Bind track-user, layer toggles, and realtime bus updates
  useEffect(() => {
    if (!isClient) return;

    fetchLocations();

    // Register track-user listener
    const handleTrackUserEvent = () => trackMe();
    window.addEventListener('track-user', handleTrackUserEvent);

    const toggleLayerHandler = () => {
      setSelectedProviderId((prev) => {
        if (prev === 'carto_dark') return 'openfreemap_liberty';
        if (prev === 'openfreemap_liberty') return 'google';
        if (prev === 'google') return 'carto';
        if (prev === 'carto') return 'osm';
        return 'carto_dark';
      });
    };
    window.addEventListener('toggle-map-layer', toggleLayerHandler);

    const setThemeHandler = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail === "light") {
        setSelectedProviderId("carto");
      } else {
        setSelectedProviderId("carto_dark");
      }
    };
    window.addEventListener('set-map-theme', setThemeHandler);

    const channel = supabase
      .channel('realtime_bus_map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bus_locations' }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('track-user', handleTrackUserEvent);
      window.removeEventListener('toggle-map-layer', toggleLayerHandler);
      window.removeEventListener('set-map-theme', setThemeHandler);
    };
  }, [isClient, trackMe, fetchLocations]);

  // Memoized markers for all buses with live animated movement for Bus 12
  const markers = useMemo(() => busLocations.map((loc, index) => {
    const busNum = loc.buses?.bus_no || 'BUS';
    const isBus12 = busNum.includes("12") || busNum === "12";
    const isSelected = Boolean(selectedBusNo && (busNum.includes(selectedBusNo) || selectedBusNo.includes(busNum)));
    
    const markerPosition: [number, number] = (isBus12 && animatedBusCoord)
      ? animatedBusCoord
      : [loc.latitude, loc.longitude];
    
    const displaySpeed = (isBus12 && animatedBusCoord) ? animatedSpeed : loc.speed;

    return (
      <Marker 
        key={`${markerPosition[0]}-${markerPosition[1]}-${busNum}-${index}`}
        position={markerPosition} 
        icon={createBusIcon(busNum, displaySpeed, isSelected || isBus12)}
        eventHandlers={{
          click: () => onSelectBus?.({ ...loc, latitude: markerPosition[0], longitude: markerPosition[1], speed: displaySpeed }),
        }}
      >
        <Popup className="bus-popup">
          <div className="p-1 min-w-[130px]">
            <div className="flex items-center justify-between">
              <p className="text-blue-600 font-black text-sm uppercase m-0">Bus #{busNum}</p>
              <span 
                className="text-[9px] font-black px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: displaySpeed >= 30 ? '#22c55e' : displaySpeed >= 15 ? '#eab308' : '#ef4444' }}
              >
                {displaySpeed >= 30 ? 'Normal' : displaySpeed >= 15 ? 'Moderate' : 'Jam'}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-semibold m-0 mt-1">{loc.buses?.route_name || 'Campus Route'}</p>
            
            {loc.buses?.driver_number && (
              <div className="mt-1.5">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  loc.buses.driver_number === 'seats_available'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : loc.buses.driver_number === 'standing_only'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {loc.buses.driver_number === 'seats_available'
                    ? '💺 Seats Open'
                    : loc.buses.driver_number === 'standing_only'
                    ? '🚶 Standing Room'
                    : '⛔ Bus Full'}
                </span>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    );
  }), [busLocations, animatedBusCoord, animatedSpeed, selectedBusNo, createBusIcon, onSelectBus]);

  if (!isClient) return null;

  // Render MapLibre GL 3D Vector Engine
  if (mapEngine === "maplibre") {
    return (
      <div className="relative w-full h-full">
        <MapLibreView
          navigationRoute={navigationRoute}
          userCoords={userCoords}
          selectedBusNo={selectedBusNo}
          theme={theme}
          styleUrl={activeProvider.vectorStyle || "https://tiles.openfreemap.org/styles/liberty"}
          onMapClick={onMapClick}
          onSelectBus={onSelectBus}
          onSelectStop={onSelectStop}
        />

        {/* Engine Switcher Overlay Pill on MapLibre */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
          <div className={`backdrop-blur-md border rounded-xl p-1 flex items-center gap-1 shadow-2xl ${
            theme === "light"
              ? "bg-white/95 border-slate-200"
              : "bg-[#141613]/90 border-[#262a25]"
          }`}>
            <button
              onClick={() => handleEngineSwitch("leaflet")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                theme === "light" ? "text-slate-600 hover:text-black" : "text-slate-300 hover:text-white"
              }`}
            >
              Leaflet 2D
            </button>
            <button
              onClick={() => handleEngineSwitch("maplibre")}
              className="px-2.5 py-1 rounded-lg text-xs font-black bg-[#facc15] text-black shadow-sm"
            >
              MapLibre 3D Vector
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Leaflet Engine (Default)
  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <MapContainer
        center={[23.8820, 90.3850]}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapController onMapReady={handleMapReady} />
        <MapClickHandler onClick={onMapClick} />

        {navigationRoute?.coordinates && (
          <RouteFitter coordinates={navigationRoute.coordinates} />
        )}

        {/* Base Map Tile Provider (OpenFreeMap / CartoDB / Google / OSM) */}
        <TileLayer
          key={selectedProviderId}
          attribution={activeProvider.attribution}
          url={activeProvider.url}
          maxZoom={20}
        />

        {/* Database Stored Master Route Geometries (Polylines) */}
        {geometries.map((geom, idx) => {
          const positions = parsePolylinePoints(geom.points);
          if (positions.length < 2) return null;
          return (
            <Polyline
              key={idx}
              positions={positions}
              pathOptions={{
                color: geom.routes?.route_color || '#3b82f6',
                weight: 4,
                opacity: 0.6,
                dashArray: '6, 6',
              }}
            />
          );
        })}

        {/* Active Turn-by-Turn Dynamic Navigation Polyline with Micro-Segments */}
        {navigationRoute && (
          <>
            <Polyline
              positions={navigationRoute.coordinates}
              pathOptions={{
                color: '#facc15',
                weight: 8,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />

            {showTrafficLayer && navigationRoute.segments && navigationRoute.segments.length > 0 ? (
              navigationRoute.segments.map((seg) => (
                <Polyline
                  key={seg.id}
                  positions={seg.coords}
                  pathOptions={{
                    color: seg.color,
                    weight: 5,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <p className="font-black" style={{ color: seg.color }}>{seg.label}</p>
                      <p className="text-slate-500 m-0">Speed: {seg.speedKmh} km/h</p>
                      {seg.vehicleCount !== undefined && (
                        <p className="text-slate-400 text-[10px] m-0">Front Density: {seg.vehicleCount} vehicles</p>
                      )}
                    </div>
                  </Popup>
                </Polyline>
              ))
            ) : (
              <Polyline
                positions={navigationRoute.coordinates}
                pathOptions={{
                  color: navigationRoute.trafficColor || '#eab308',
                  weight: 5,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          </>
        )}

        {/* Destination Flag Marker */}
        {navigationRoute?.coordinates && navigationRoute.coordinates.length > 0 && (
          <Marker
            position={navigationRoute.coordinates[navigationRoute.coordinates.length - 1]}
            icon={createDestIcon()}
          >
            <Popup>
              <div className="p-1 text-xs font-black">
                🏁 Destination: Kamarpara (IUBAT Campus)
              </div>
            </Popup>
          </Marker>
        )}

        {/* User GPS Location Marker */}
        {userCoords && (
          <Marker position={userCoords} icon={createUserIcon()}>
            <Popup>
              <div className="p-1 text-xs font-black">
                📍 Your Location ({userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)})
              </div>
            </Popup>
          </Marker>
        )}

        {/* Verified Transit Hubs along Dhaka-Gazipur Corridor */}
        {KNOWN_STOPS.map((stop) => (
          <Marker
            key={stop.id}
            position={stop.coords}
            icon={createStationIcon(stop.name.split('(')[0].trim())}
            eventHandlers={{
              click: () => onSelectStop?.(stop),
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="text-xs font-black text-slate-800 m-0">{stop.name}</p>
                {onSelectStop && (
                  <button
                    onClick={() => onSelectStop(stop)}
                    className="w-full mt-2 bg-slate-900 text-white text-[9px] font-black uppercase py-1 px-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Set as Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dynamic OpenStreetMap Transit Nodes via Overpass API */}
        {enableOverpassOverlay && overpassStops.map((ostop) => (
          <Marker
            key={`osm-${ostop.id}`}
            position={ostop.coords}
            icon={createStationIcon(ostop.name, true)}
          >
            <Popup>
              <div className="p-1">
                <p className="text-xs font-black text-sky-800 m-0">🚍 {ostop.name}</p>
                <p className="text-[10px] text-slate-500 m-0 mt-0.5">OpenStreetMap ID #{ostop.id} ({ostop.type})</p>
                {onSelectStop && (
                  <button
                    onClick={() => onSelectStop({ id: String(ostop.id), name: ostop.name, coords: ostop.coords })}
                    className="w-full mt-2 bg-sky-600 text-white text-[9px] font-black uppercase py-1 px-2 rounded hover:bg-sky-700 transition-colors"
                  >
                    Set as Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Active Buses */}
        {markers}
      </MapContainer>

      {/* --- TOP FLOATING ENGINE & STOPS BAR --- */}
      <div className="absolute top-3 left-3 right-16 z-[400] flex items-center gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
        {/* Frontend Map Engine Switcher: Leaflet vs MapLibre */}
        <div className={`flex items-center rounded-xl p-1 border shadow-xl backdrop-blur-md shrink-0 ${
          theme === "light" ? "bg-white/95 border-slate-300" : "bg-[#141613]/90 border-[#262a25]"
        }`}>
          <button
            onClick={() => handleEngineSwitch("leaflet")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
              mapEngine === "leaflet"
                ? "bg-[#facc15] text-black shadow-sm"
                : theme === "light" ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            Leaflet 2D
          </button>
          <button
            onClick={() => handleEngineSwitch("maplibre")}
            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
              (mapEngine as string) === "maplibre"
                ? "bg-[#facc15] text-black shadow-sm"
                : theme === "light" ? "text-slate-600 hover:text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>MapLibre 3D</span>
          </button>
        </div>

        {/* Live Overpass API Bus Stations Query Button */}
        <button
          onClick={handleToggleOverpass}
          disabled={isLoadingOverpass}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xl border backdrop-blur-md shrink-0 active:scale-95 transition-all ${
            enableOverpassOverlay
              ? "bg-sky-600 text-white border-sky-500"
              : theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
              : "bg-[#141613]/90 border-[#262a25] text-slate-200 hover:text-white"
          }`}
          title="Fetch Real-Time OpenStreetMap Bus Stations & Transit Nodes"
        >
          <Radio className={`w-3.5 h-3.5 ${isLoadingOverpass ? "animate-spin text-amber-400" : enableOverpassOverlay ? "text-white" : "text-sky-500"}`} />
          <span>{isLoadingOverpass ? "Querying OSM..." : enableOverpassOverlay ? "OSM Transit (Active)" : "Overpass API Stops"}</span>
        </button>

        {/* Routing Engine Indicator */}
        <button
          onClick={() => setRoutingEngine(prev => prev === "osrm" ? "valhalla" : "osrm")}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xl border backdrop-blur-md shrink-0 active:scale-95 transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800"
              : "bg-[#141613]/90 border-[#262a25] text-slate-200"
          }`}
          title="Switch Routing Model: OSRM Road Geometry vs Valhalla Map-Matching"
        >
          <RouteIcon className="w-3.5 h-3.5 text-[#facc15]" />
          <span>Routing: {routingEngine === "osrm" ? "OSRM" : "Valhalla Snapped"}</span>
        </button>
      </div>

      {/* --- GPS STATUS TOAST NOTICE --- */}
      {gpsStatusNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[500] px-3.5 py-1.5 rounded-xl bg-black/90 border border-yellow-500/50 text-[#facc15] font-black text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>{gpsStatusNotice}</span>
        </div>
      )}

      {/* --- RIGHT FLOATING MAP CONTROLS --- */}
      <div className="absolute top-16 right-3 z-[400] flex flex-col gap-2 items-end pointer-events-auto">
        {/* Reset North / Campus View */}
        <button
          onClick={handleResetNorth}
          title="Reset View to Campus (North)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
              : "bg-[#161916]/90 border-[#262a25] text-slate-200 hover:text-[#facc15]"
          }`}
        >
          <Compass className="w-4 h-4 text-rose-500" />
        </button>

        {/* GPS Locate Me Button */}
        <button
          onClick={trackMe}
          title="Center on My GPS Location"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
              : "bg-[#161916]/90 border-[#262a25] text-slate-200 hover:text-[#facc15]"
          }`}
        >
          <Crosshair className="w-4 h-4 text-blue-500" />
        </button>

        {/* Zoom In & Zoom Out Stack */}
        <div className={`flex flex-col rounded-xl overflow-hidden shadow-xl border backdrop-blur-md ${
          theme === "light"
            ? "bg-white/95 border-slate-300 text-slate-800 divide-y divide-slate-200"
            : "bg-[#161916]/90 border-[#262a25] text-slate-200 divide-y divide-[#262a25]"
        }`}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-9 h-9 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-9 h-9 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Live Traffic Road Overlay Toggle */}
        <div className={`rounded-xl p-2 shadow-xl border backdrop-blur-md text-[10px] space-y-1.5 ${
          theme === "light"
            ? "bg-white/95 border-slate-300 text-slate-900"
            : "bg-[#161916]/95 border-[#262a25] text-white"
        }`}>
          <button
            onClick={() => setShowTrafficLayer(!showTrafficLayer)}
            className="flex items-center justify-between w-full gap-2 font-black uppercase tracking-wider text-[9px] hover:opacity-80 transition-opacity"
            title="Toggle Live Traffic Road Overlay"
          >
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-500" />
              <span>Traffic</span>
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
              showTrafficLayer
                ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                : "bg-slate-500/20 text-slate-400"
            }`}>
              {showTrafficLayer ? "ON" : "OFF"}
            </span>
          </button>

          <div className="flex items-center gap-1 text-[8px] font-bold">
            <span className="flex items-center gap-0.5 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &gt;30
            </span>
            <span className="flex items-center gap-0.5 text-amber-500">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 15-30
            </span>
            <span className="flex items-center gap-0.5 text-rose-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> &lt;15
            </span>
          </div>
        </div>
      </div>

      {/* --- FLOATING MAP STUDIO & TILE PROVIDER SWITCHER --- */}
      <div className="absolute bottom-5 left-4 z-[400]">
        <div className="relative">
          <button
            onClick={() => setShowLayerStudio(!showLayerStudio)}
            className={`${
              theme === "light"
                ? "bg-white/95 text-slate-800 border-slate-300 shadow-md hover:bg-slate-100"
                : "bg-[#141613]/90 text-slate-200 border-[#262a25] hover:text-white"
            } backdrop-blur-md px-3.5 py-2 rounded-xl shadow-2xl border text-xs font-black flex items-center gap-2 transition-all active:scale-95`}
            title="Switch Map Tiles, Engine & Providers"
          >
            <Layers className={`w-3.5 h-3.5 ${theme === "light" ? "text-blue-600" : "text-[#facc15]"}`} />
            <span>{activeProvider.name.split('(')[0].trim()}</span>
          </button>

          {showLayerStudio && (
            <div className={`absolute bottom-12 left-0 ${
              theme === "light"
                ? "bg-white/95 border-slate-200 text-slate-800"
                : "bg-[#161916]/95 border-[#262a25] text-white"
            } backdrop-blur-md rounded-2xl p-3 shadow-2xl border w-72 space-y-2 animate-in fade-in slide-in-from-bottom-2`}>
              <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Map Engine & Layers Studio
                </span>
                <span className="text-[9px] font-bold text-[#facc15]">Zero API Cost</span>
              </div>

              {/* Rendering Engine Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Frontend Engine:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleEngineSwitch("leaflet")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all text-center ${
                      mapEngine === "leaflet"
                        ? "bg-[#facc15] text-black border-yellow-400 shadow-sm"
                        : theme === "light" ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-[#1a1d18] border-[#2c3327] text-slate-300"
                    }`}
                  >
                    Leaflet JS
                  </button>
                  <button
                    onClick={() => handleEngineSwitch("maplibre")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-black border transition-all text-center ${
                      (mapEngine as string) === "maplibre"
                        ? "bg-[#facc15] text-black border-yellow-400 shadow-sm"
                        : theme === "light" ? "bg-slate-100 border-slate-200 text-slate-700" : "bg-[#1a1d18] border-[#2c3327] text-slate-300"
                    }`}
                  >
                    MapLibre GL 3D
                  </button>
                </div>
              </div>

              {/* Tile Providers List */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-400 block">Base Tile Provider:</label>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                  {MAP_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedProviderId(provider.id);
                        setShowLayerStudio(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                        selectedProviderId === provider.id
                          ? theme === "light"
                            ? "bg-slate-900 text-white font-black"
                            : "bg-[#facc15] text-black font-black"
                          : theme === "light"
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-slate-300 hover:bg-[#1f241d] hover:text-white"
                      }`}
                    >
                      <span className="truncate">{provider.name}</span>
                      {selectedProviderId === provider.id && <Check className="w-3 h-3 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}