"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { RouteResult, KNOWN_STOPS, KnownStop } from "@/lib/routing";
import { BusLocationItem } from "@/components/Map";
import { Compass, Plus, Minus, Box, Crosshair } from "lucide-react";

interface MapLibreViewProps {
  navigationRoute?: RouteResult | null;
  userCoords?: [number, number] | null;
  selectedBusNo?: string | null;
  theme?: "dark" | "light";
  styleUrl?: string;
  onMapClick?: (coords: [number, number]) => void;
  onSelectBus?: (bus: BusLocationItem) => void;
  onSelectStop?: (stop: KnownStop) => void;
}

export default function MapLibreView({
  navigationRoute,
  userCoords,
  selectedBusNo = "12",
  theme = "dark",
  styleUrl = "https://tiles.openfreemap.org/styles/liberty",
  onMapClick,
  onSelectBus,
  onSelectStop,
}: MapLibreViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const busMarkersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const [is3D, setIs3D] = useState(true);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!containerRef.current) return;

    const initialCenter: [number, number] = [90.3850, 23.8820]; // Uttara / Kamarpara Corridor

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: initialCenter,
      zoom: 14.5,
      pitch: 50, // 3D perspective by default
      bearing: -15,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    map.on("load", () => {
      // 3D Building Extrusion layer
      try {
        const layers = map.getStyle().layers;
        let labelLayerId: string | undefined;
        if (layers) {
          for (const layer of layers) {
            if (layer.type === "symbol" && layer.layout && (layer.layout as Record<string, unknown>)["text-field"]) {
              labelLayerId = layer.id;
              break;
            }
          }
        }

        if (!map.getLayer("3d-buildings") && map.getSource("openmaptiles")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "openmaptiles",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 14,
              paint: {
                "fill-extrusion-color": theme === "dark" ? "#222722" : "#d8dfd5",
                "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 12],
                "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
                "fill-extrusion-opacity": 0.85,
              },
            },
            labelLayerId
          );
        }
      } catch (e) {
        console.warn("3D building extrusion not supported on this style:", e);
      }

      // Add navigation polyline layer
      if (!map.getSource("navigation-route")) {
        map.addSource("navigation-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "navigation-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#facc15",
            "line-width": 9,
            "line-opacity": 0.4,
          },
        });

        map.addLayer({
          id: "route-core",
          type: "line",
          source: "navigation-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#eab308",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        });
      }
    });

    map.on("click", (e) => {
      onMapClick?.([e.lngLat.lat, e.lngLat.lng]);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [styleUrl, theme, onMapClick]);

  // Update navigation route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("navigation-route") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (navigationRoute?.coordinates && navigationRoute.coordinates.length > 1) {
      // GeoJSON expects [lng, lat]
      const geoCoords = navigationRoute.coordinates.map((c) => [c[1], c[0]]);
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: geoCoords,
        },
      });

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds();
      geoCoords.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1200 });
    } else {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [],
        },
      });
    }
  }, [navigationRoute]);

  // Render authentic Transit Stops
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    KNOWN_STOPS.forEach((stop) => {
      const el = document.createElement("div");
      el.className = "maplibre-stop-marker";
      el.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.95); backdrop-filter:blur(4px); padding:2px 6px; border-radius:10px; border:1.5px solid #0f172a; box-shadow:0 3px 6px rgba(0,0,0,0.3); cursor:pointer;">
          <span style="width:7px; height:7px; border-radius:9999px; background-color:#3b82f6;"></span>
          <span style="font-size:9px; font-weight:800; color:#0f172a; white-space:nowrap;">${stop.name.split("(")[0].trim()}</span>
        </div>
      `;

      el.addEventListener("click", () => onSelectStop?.(stop));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.coords[1], stop.coords[0]])
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });
  }, [onSelectStop]);

  // Render Active Buses
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    busMarkersRef.current.forEach((m) => m.remove());
    busMarkersRef.current = [];

    const buses: BusLocationItem[] = [
      {
        latitude: 23.9005,
        longitude: 90.4005,
        speed: 34,
        buses: { bus_no: "12", route_name: "Tongi - IUBAT Campus", status: "active" },
      },
      {
        latitude: 23.8820,
        longitude: 90.4030,
        speed: 28,
        buses: { bus_no: "07", route_name: "Abdullahpur - IUBAT Campus", status: "active" },
      },
      {
        latitude: 23.8740,
        longitude: 90.3980,
        speed: 42,
        buses: { bus_no: "04", route_name: "House Building - IUBAT Campus", status: "active" },
      },
      {
        latitude: 23.8950,
        longitude: 90.4020,
        speed: 16,
        buses: { bus_no: "19", route_name: "Station Road - IUBAT Campus", status: "active" },
      },
    ];

    buses.forEach((bus) => {
      const busNo = bus.buses?.bus_no || "12";
      const isSelected = selectedBusNo ? busNo.includes(selectedBusNo) : false;

      const el = document.createElement("div");
      el.className = "maplibre-bus-marker";
      el.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:scale(${isSelected || busNo === "12" ? "1.15" : "1"});">
          <div style="background-color:${isSelected || busNo === "12" ? "#facc15" : "#dc2626"}; color:${isSelected || busNo === "12" ? "#000000" : "#ffffff"}; font-weight:900; font-size:12px; width:32px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 4px 10px rgba(0,0,0,0.35);">
            ${busNo}
          </div>
          <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:5px solid ${isSelected || busNo === "12" ? "#facc15" : "#dc2626"}; margin-top:-1px;"></div>
        </div>
      `;

      el.addEventListener("click", () => onSelectBus?.(bus));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([bus.longitude, bus.latitude])
        .addTo(map);

      busMarkersRef.current.push(marker);
    });
  }, [selectedBusNo, onSelectBus]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userCoords) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.innerHTML = `
          <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
            <span style="position:absolute; width:100%; height:100%; border-radius:9999px; background-color:#3b82f6; opacity:0.6; animation:ping 1.5s infinite;"></span>
            <span style="position:relative; width:12px; height:12px; border-radius:9999px; background-color:#2563eb; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.4);"></span>
          </div>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userCoords[1], userCoords[0]])
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userCoords[1], userCoords[0]]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Track near me handler for MapLibre
  const handleTrackMe = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.flyTo({ center: [longitude, latitude], zoom: 16, pitch: 50, duration: 1500 });
          window.dispatchEvent(new CustomEvent("user-location", { detail: { latitude, longitude } }));
        },
        () => {
          // Fallback to campus coordinates
          map.flyTo({ center: [90.3795, 23.8759], zoom: 16, pitch: 50, duration: 1500 });
          window.dispatchEvent(new CustomEvent("user-location", { detail: { latitude: 23.8759, longitude: 90.3795, isFallback: true } }));
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      map.flyTo({ center: [90.3795, 23.8759], zoom: 16, pitch: 50, duration: 1500 });
    }
  }, []);

  // Toggle 3D Tilt perspective
  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const nextPitch = is3D ? 0 : 55;
    map.easeTo({ pitch: nextPitch, duration: 800 });
    setIs3D(!is3D);
  }, [is3D]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => mapRef.current?.easeTo({ bearing: 0, pitch: is3D ? 50 : 0, duration: 800 });

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating 3D Vector Controls */}
      <div className="absolute top-16 right-3 z-30 flex flex-col gap-2 items-end pointer-events-auto">
        {/* 3D / 2D Perspective Toggle */}
        <button
          onClick={toggle3D}
          title={is3D ? "Switch to 2D Top-Down View" : "Switch to 3D Isometric View"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
            is3D 
              ? "bg-[#facc15] text-black border-yellow-400 font-black"
              : theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800"
              : "bg-[#161916]/90 border-[#262a25] text-slate-200"
          }`}
        >
          <Box className="w-4 h-4" />
        </button>

        {/* Compass Reset */}
        <button
          onClick={handleResetNorth}
          title="Reset North"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
              : "bg-[#161916]/90 border-[#262a25] text-slate-200 hover:text-[#facc15]"
          }`}
        >
          <Compass className="w-4 h-4 text-rose-500" />
        </button>

        {/* GPS Locate Me */}
        <button
          onClick={handleTrackMe}
          title="Track Near Me (GPS)"
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl border backdrop-blur-md active:scale-95 transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
              : "bg-[#161916]/90 border-[#262a25] text-slate-200 hover:text-[#facc15]"
          }`}
        >
          <Crosshair className="w-4 h-4 text-blue-500" />
        </button>

        {/* Zoom Controls */}
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
      </div>
    </div>
  );
}
