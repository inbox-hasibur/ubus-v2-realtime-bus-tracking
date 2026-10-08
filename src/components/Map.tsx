"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface BusInfo {
  bus_no?: string;
  route_name?: string;
}

interface BusLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  buses?: BusInfo | null;
}

interface RouteGeometry {
  points: string | [number, number][];
  routes?: {
    route_color?: string;
  } | null;
}

const DEFAULT_BUSES: BusLocation[] = [
  {
    latitude: 23.8763,
    longitude: 90.3802,
    speed: 32,
    buses: { bus_no: "01", route_name: "Uttara - Campus Express" },
  },
  {
    latitude: 23.8745,
    longitude: 90.3782,
    speed: 24,
    buses: { bus_no: "04", route_name: "Mirpur 10 - IUBAT Route" },
  },
  {
    latitude: 23.8791,
    longitude: 90.3821,
    speed: 0,
    buses: { bus_no: "09", route_name: "Abdullahpur - Campus Shuttle" },
  },
];

function MapController({ onMapReady }: { onMapReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

export default function Map() {
  const [busLocations, setBusLocations] = useState<BusLocation[]>(DEFAULT_BUSES);
  const [isClient, setIsClient] = useState(false);
  const [geometries, setGeometries] = useState<RouteGeometry[]>([]); 
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);
  
  // Memoized function to get user location and center map
  const trackMe = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      window.dispatchEvent(new CustomEvent("user-location", { detail: null }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.flyTo([latitude, longitude], 16, {
              animate: true,
              duration: 1.5,
            });
          } catch (err) {
            console.warn("FlyTo failed", err);
          }
        }

        window.dispatchEvent(
          new CustomEvent("user-location", {
            detail: { latitude, longitude },
          })
        );
      },
      () => {
        window.dispatchEvent(new CustomEvent("user-location", { detail: null }));
      }
    );
  }, []);

  // Memoized function to create bus icon with HTML template
  const createBusIcon = useCallback((busNo: string) => {
    const digits = (busNo || "").toString().replace(/\D+/g, "");
    const display = digits ? digits.slice(-2) : (busNo || "").toString().slice(-2);

    return L.divIcon({
      className: "custom-bus-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div class="bus-marker-badge">
            ${display}
          </div>
          <div class="bus-marker-pointer"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }, []);

  const fetchLocations = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return;
    }
    try {
      // Fetch Bus Locations
      const { data: locs, error: locError } = await supabase
        .from("bus_locations")
        .select(`latitude, longitude, speed, buses (bus_no, route_name)`);

      if (locError) throw locError;
      if (locs && locs.length > 0) setBusLocations(locs as BusLocation[]);

      // Fetch Road Geometries (Polylines)
      const { data: geom, error: geomError } = await supabase
        .from("route_geometry")
        .select(`points, routes(route_color)`);
      
      if (geomError) throw geomError;
      if (geom) setGeometries(geom as RouteGeometry[]);

    } catch (err) {
      console.error("Error fetching map data:", err);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    fetchLocations();

    window.addEventListener("track-user", trackMe);

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel("realtime_bus_map")
        .on("postgres_changes", { event: "*", schema: "public", table: "bus_locations" }, () => {
          fetchLocations();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener("track-user", trackMe);
      };
    }

    return () => {
      window.removeEventListener("track-user", trackMe);
    };
  }, [isClient, trackMe, fetchLocations]);

  // Memoized markers to prevent unnecessary re-renders
  const markers = useMemo(() => busLocations.map((loc, index) => (
    <Marker 
      key={`${loc.latitude}-${loc.longitude}-${index}`}
      position={[loc.latitude, loc.longitude]} 
      icon={createBusIcon(loc.buses?.bus_no || "BUS")}
    >
      <Popup className="bus-popup">
        <div className="p-1">
          <p className="text-blue-600 font-black text-sm uppercase m-0">{loc.buses?.bus_no}</p>
          <p className="text-slate-500 text-xs font-semibold m-0">{loc.buses?.route_name}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-700">{loc.speed ?? 0} km/h</span>
          </div>
        </div>
      </Popup>
    </Marker>
  )), [busLocations, createBusIcon]);

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
              key={`route-path-${i}`}
              positions={pts} 
              pathOptions={{ 
                color: g.routes?.route_color || "#3b82f6", 
                weight: 7,
                opacity: 0.5,
                lineJoin: "round",
                lineCap: "round"
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

  if (!isClient) {
    return <div className="h-full w-full bg-slate-200 animate-pulse" />;
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[23.8759, 90.3795]}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer 
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
          attribution='&copy; Google Maps'
        />
        <MapController onMapReady={handleMapReady} />

        {parsedGeometries}
        {markers}
      </MapContainer>
    </div>
  );
}