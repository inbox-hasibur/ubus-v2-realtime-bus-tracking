"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface BusInfo {
  bus_no?: string;
  route_name?: string;
}

export interface BusLocation {
  id?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  buses?: BusInfo | null;
}

export interface RouteGeometry {
  points: string | [number, number][];
  routes?: {
    route_color?: string;
  } | null;
}

export interface MapProps {
  userLocation?: { lat: number; lng: number } | null;
  selectedBus?: BusLocation | null;
  onSelectBus?: (bus: BusLocation) => void;
  navigationPath?: [number, number][];
  focusTarget?: [number, number] | null;
}

const DEFAULT_CAMPUS_BUSES: BusLocation[] = [
  {
    latitude: 23.8759,
    longitude: 90.3795,
    speed: 35,
    buses: { bus_no: "12", route_name: "Uttara - Campus Express" },
  },
  {
    latitude: 23.8820,
    longitude: 90.4005,
    speed: 40,
    buses: { bus_no: "19", route_name: "House Building - Campus" },
  },
  {
    latitude: 23.8920,
    longitude: 90.4020,
    speed: 0,
    buses: { bus_no: "32", route_name: "Abdullahpur Shuttle" },
  },
];

function MapController({
  focusTarget,
  onMapReady,
}: {
  focusTarget?: [number, number] | null;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (map && focusTarget) {
      map.flyTo(focusTarget, 16, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [map, focusTarget]);

  return null;
}

export default function Map({
  userLocation,
  selectedBus,
  onSelectBus,
  navigationPath = [],
  focusTarget,
}: MapProps) {
  const [busLocations, setBusLocations] = useState<BusLocation[]>(DEFAULT_CAMPUS_BUSES);
  const [geometries, setGeometries] = useState<RouteGeometry[]>([]);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  // Bus DivIcon
  const createBusIcon = useCallback((busNo: string, isSelected: boolean) => {
    const digits = (busNo || "").toString().replace(/\D+/g, "");
    const display = digits ? digits.slice(-2) : (busNo || "").toString().slice(-2);
    const borderColor = isSelected ? "#2563eb" : "#334155";
    const bgColor = isSelected ? "#3b82f6" : "#facc15";
    const textColor = isSelected ? "#ffffff" : "#0f172a";

    return L.divIcon({
      className: "custom-bus-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transition: transform 0.2s ease;">
          <div style="
            background-color: ${bgColor};
            color: ${textColor};
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 14px;
            border: 3px solid ${borderColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            ${isSelected ? "transform: scale(1.15);" : ""}
          ">
            ${display}
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid ${borderColor};
            margin-top: -2px;
          "></div>
        </div>
      `,
      iconSize: [40, 44],
      iconAnchor: [20, 44],
    });
  }, []);

  // User GPS DivIcon
  const createUserIcon = useCallback(() => {
    return L.divIcon({
      className: "custom-user-marker",
      html: `
        <div class="user-gps-marker">
          <div class="user-pulse-ring"></div>
          <div class="user-dot"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  useEffect(() => {
    let active = true;

    const loadMapData = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const { data: locs, error: locError } = await supabase
          .from("bus_locations")
          .select(`id, latitude, longitude, speed, buses (bus_no, route_name)`);

        if (!locError && active && locs && locs.length > 0) {
          setBusLocations(locs as BusLocation[]);
        }

        const { data: geom } = await supabase
          .from("route_geometry")
          .select(`points, routes(route_color)`);

        if (active && geom && geom.length > 0) {
          setGeometries(geom as RouteGeometry[]);
        }
      } catch (err) {
        console.warn("Error fetching live map data:", err);
      }
    };

    loadMapData();

    const channel = supabase
      .channel("realtime_bus_map")
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_locations" }, async () => {
        const { data: locs } = await supabase
          .from("bus_locations")
          .select(`id, latitude, longitude, speed, buses (bus_no, route_name)`);
        if (active && locs && locs.length > 0) {
          setBusLocations(locs as BusLocation[]);
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Bus Markers
  const busMarkers = useMemo(() => {
    return busLocations.map((loc, index) => {
      const isSelected =
        selectedBus?.buses?.bus_no === loc.buses?.bus_no ||
        (selectedBus?.latitude === loc.latitude && selectedBus?.longitude === loc.longitude);

      return (
        <Marker
          key={`${loc.latitude}-${loc.longitude}-${index}`}
          position={[loc.latitude, loc.longitude]}
          icon={createBusIcon(loc.buses?.bus_no || "BUS", isSelected)}
          eventHandlers={{
            click: () => {
              if (onSelectBus) onSelectBus(loc);
            },
          }}
        >
          <Popup className="bus-popup">
            <div className="p-1 min-w-[120px]">
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-black text-sm uppercase">Bus #{loc.buses?.bus_no}</span>
                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Live</span>
              </div>
              <p className="text-slate-600 text-xs font-semibold m-0 mt-0.5">{loc.buses?.route_name || "Campus Express"}</p>
              <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${loc.speed && loc.speed > 0 ? "bg-green-500 animate-pulse" : "bg-amber-400"}`}></span>
                  <span className="text-[10px] font-bold text-slate-700">{loc.speed ?? 0} km/h</span>
                </div>
                <span className="text-[9px] font-bold text-blue-600">Click to track</span>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [busLocations, selectedBus, createBusIcon, onSelectBus]);

  // Geometries from database
  const parsedGeometries = useMemo(() => {
    return geometries.map((g, i) => {
      try {
        let pts: [number, number][] = [];
        if (Array.isArray(g.points)) {
          pts = g.points as [number, number][];
        } else if (typeof g.points === "string") {
          pts = JSON.parse(g.points);
        }
        if (pts.length > 0) {
          return (
            <Polyline
              key={`route-geom-${i}`}
              positions={pts}
              pathOptions={{
                color: g.routes?.route_color || "#3b82f6",
                weight: 6,
                opacity: 0.6,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
          );
        }
      } catch {
        return null;
      }
      return null;
    });
  }, [geometries]);

  const initialCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [23.8759, 90.3795];

  return (
    <div className="h-full w-full">
      <MapContainer center={initialCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
        />
        <MapController focusTarget={focusTarget} onMapReady={handleMapReady} />

        {parsedGeometries}

        {/* --- Active Navigation Route Polyline --- */}
        {navigationPath.length > 1 && (
          <>
            {/* Outer Glow Line */}
            <Polyline
              positions={navigationPath}
              pathOptions={{
                color: "#60a5fa",
                weight: 10,
                opacity: 0.4,
                lineJoin: "round",
                lineCap: "round",
              }}
            />
            {/* Core Bright Navigation Line */}
            <Polyline
              positions={navigationPath}
              pathOptions={{
                color: "#2563eb",
                weight: 5,
                opacity: 0.9,
                lineJoin: "round",
                lineCap: "round",
                dashArray: "10, 10",
              }}
            />
          </>
        )}

        {/* --- User GPS Location Marker & Accuracy Radius --- */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={120}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#60a5fa",
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon()}>
              <Popup>
                <div className="p-1">
                  <p className="text-blue-600 font-black text-xs uppercase m-0">You Are Here</p>
                  <p className="text-slate-500 text-[10px] m-0">
                    GPS: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* --- Bus Markers --- */}
        {busMarkers}
      </MapContainer>
    </div>
  );
}