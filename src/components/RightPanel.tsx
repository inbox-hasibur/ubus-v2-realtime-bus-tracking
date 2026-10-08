"use client";

import { useState, useEffect, useMemo } from "react";
import { Navigation2, RotateCcw, Play, Square, Crosshair, CheckCircle2 } from "lucide-react";
import { PanelCard, InfoBlock } from "@/components/DashboardUI";
import { BusLocation } from "@/components/Map";
import { calculateDistanceKm, calculateETA, getStopCoordinate } from "@/lib/transitData";
import { supabase } from "@/lib/supabase";

export interface RouteOption {
  id: string;
  route_name: string;
  bus_number: string;
  route_color?: string;
}

interface StopScheduleRow {
  pickup_time?: string;
  sequence_order?: number;
  stops?: {
    stop_name?: string;
  } | null;
}

export interface RightPanelProps {
  isOpen: boolean;
  userLocation: { lat: number; lng: number } | null;
  buses: BusLocation[];
  selectedBus: BusLocation | null;
  onSelectBus: (bus: BusLocation) => void;
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRouteId: (id: string) => void;
  startPoint: string;
  setStartPoint: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  isNavigating: boolean;
  onStartNavigation: (path: [number, number][]) => void;
  onStopNavigation: () => void;
  onTrackNearMe: () => void;
  isTrackingGPS: boolean;
  gpsStatusMessage: string;
}

export default function RightPanel({
  isOpen,
  userLocation,
  buses = [],
  selectedBus,
  onSelectBus,
  routes = [],
  selectedRouteId,
  onSelectRouteId,
  startPoint,
  setStartPoint,
  destination,
  setDestination,
  isNavigating,
  onStartNavigation,
  onStopNavigation,
  onTrackNearMe,
  isTrackingGPS,
  gpsStatusMessage,
}: RightPanelProps) {
  const [routeStops, setRouteStops] = useState<{ name: string; time: string }[]>([]);

  // Load stops when selectedRouteId changes
  useEffect(() => {
    if (!selectedRouteId) return;

    const fetchStops = async () => {
      try {
        const { data, error } = await supabase
          .from("route_schedule")
          .select("pickup_time, sequence_order, stops(stop_name)")
          .eq("route_id", selectedRouteId)
          .order("sequence_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const rows = data as unknown as StopScheduleRow[];
          const formatted = rows.map((item) => ({
            name: item.stops?.stop_name || "Station Stop",
            time: item.pickup_time ? item.pickup_time.slice(0, 5) : "--:--",
          }));
          setRouteStops(formatted);

          // If destination not set or default, set to the last stop or IUBAT
          const lastStop = formatted[formatted.length - 1]?.name;
          if (lastStop && !destination) {
            setDestination(lastStop);
          }
        }
      } catch (err) {
        console.warn("Error fetching stops for route:", err);
      }
    };

    fetchStops();
  }, [selectedRouteId, destination, setDestination]);

  // Compute Active Bus
  const activeBus = useMemo(() => {
    if (selectedBus) return selectedBus;
    if (buses && buses.length > 0) return buses[0];
    return null;
  }, [selectedBus, buses]);

  // Coordinates
  const startCoords: [number, number] = useMemo(() => {
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (startPoint) return getStopCoordinate(startPoint);
    return [23.8759, 90.3795]; // Default IUBAT
  }, [userLocation, startPoint]);

  const destCoords: [number, number] = useMemo(() => {
    if (destination) return getStopCoordinate(destination);
    return [23.8759, 90.3795]; // Default IUBAT Campus
  }, [destination]);

  // Distance & ETA calculation
  const distanceKm = useMemo(() => {
    return calculateDistanceKm(startCoords[0], startCoords[1], destCoords[0], destCoords[1]);
  }, [startCoords, destCoords]);

  const etaInfo = useMemo(() => {
    const busSpeed = activeBus?.speed || 30;
    return calculateETA(distanceKm, busSpeed);
  }, [distanceKm, activeBus]);

  // Distance from user to bus
  const distanceToBusKm = useMemo(() => {
    if (!activeBus) return 0;
    return calculateDistanceKm(
      startCoords[0],
      startCoords[1],
      activeBus.latitude,
      activeBus.longitude
    );
  }, [startCoords, activeBus]);

  // Next Stoppage logic
  const nextStopName = useMemo(() => {
    if (routeStops.length > 0) {
      // Find a stop in the route
      return routeStops[Math.min(1, routeStops.length - 1)].name;
    }
    if (activeBus?.buses?.route_name) {
      return "House Building Bus Stand";
    }
    return "IUBAT Main Gate";
  }, [routeStops, activeBus]);

  // Handle Start Navigation
  const handleStartNav = () => {
    // Generate high-resolution polyline
    const path: [number, number][] = [];
    path.push(startCoords);

    if (activeBus) {
      path.push([activeBus.latitude, activeBus.longitude]);
    }

    if (routeStops.length > 0) {
      routeStops.forEach((st) => {
        path.push(getStopCoordinate(st.name));
      });
    }

    path.push(destCoords);
    onStartNavigation(path);
  };

  const handleReset = () => {
    setStartPoint("");
    setDestination("IUBAT Main Gate");
    if (isNavigating) onStopNavigation();
  };

  return (
    <div
      className={`absolute top-16 right-4 left-4 md:left-auto md:top-20 md:right-6 w-auto md:w-[350px] space-y-3 md:space-y-3.5 z-20 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        isOpen
          ? "translate-x-0 opacity-100"
          : "translate-x-[120%] opacity-0 pointer-events-none"
      } max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 custom-scrollbar`}
    >
      {/* --- Live Active Buses Quick Strip --- */}
      <div className="bg-white/95 backdrop-blur-xl p-3.5 rounded-[24px] shadow-xl border border-slate-100">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
              Active Fleet ({buses.length})
            </span>
          </div>
          <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Realtime GPS
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {buses.map((bus) => {
            const isSelected =
              activeBus?.buses?.bus_no === bus.buses?.bus_no ||
              (activeBus?.latitude === bus.latitude && activeBus?.longitude === bus.longitude);

            return (
              <button
                key={`${bus.latitude}-${bus.longitude}-${bus.buses?.bus_no}`}
                onClick={() => onSelectBus(bus)}
                className={`flex-1 min-w-[90px] p-2 rounded-xl border text-left transition-all active:scale-95 ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs">#{bus.buses?.bus_no}</span>
                  <span
                    className={`text-[8px] font-bold px-1 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {bus.speed ?? 0} km/h
                  </span>
                </div>
                <p className={`text-[8px] truncate mt-1 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                  {bus.buses?.route_name || "Campus Express"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Estimated Time & Distance --- */}
      <PanelCard title="Live ETA & Distance">
        <div className="flex bg-slate-900 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/20">
          <div className="flex-1 p-4 text-center border-r border-white/10 bg-slate-900">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Est. Arrival</p>
            <p className="text-xl font-black text-white tracking-tight">{etaInfo.formatted}</p>
          </div>
          <div className="flex-1 p-4 text-center flex flex-col items-center justify-center bg-slate-800">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Distance</p>
            <p className="text-base font-black text-yellow-400 tracking-tight">{distanceKm} KM</p>
          </div>
        </div>
      </PanelCard>

      {/* --- Travel Information with Real Data --- */}
      <PanelCard title="Realtime Journey Info">
        <div className="space-y-2.5">
          <InfoBlock
            label="Current Location"
            value={
              userLocation
                ? `GPS Active (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
                : startPoint || "Near IUBAT Campus / Uttara"
            }
          />
          <InfoBlock
            label="Active Bus & Speed"
            value={`Bus #${activeBus?.buses?.bus_no || "12"} • ${activeBus?.buses?.route_name || "Campus Express"}`}
            subValue={`${activeBus?.speed ?? 35} KM/H`}
          />
          <InfoBlock
            label="Next Stoppage"
            value={nextStopName}
            subValue={distanceToBusKm > 0 ? `${distanceToBusKm} KM away` : "Arriving"}
          />
          <InfoBlock
            label="Destination"
            value={destination || "IUBAT Campus Main Gate"}
          />
        </div>
      </PanelCard>

      {/* --- Route & Destination Controls --- */}
      <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-slate-100 space-y-3.5">
        {/* Route Selector */}
        <div>
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
            Select University Route ({routes.length} Available)
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => onSelectRouteId(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">-- Choose Route from Database --</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                Bus #{r.bus_number} - {r.route_name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Point */}
        <div className="relative group">
          <div className="flex items-center justify-between ml-1 mb-1">
            <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
              Start Point
            </label>
            <button
              onClick={onTrackNearMe}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Crosshair className="w-2.5 h-2.5" />
              {isTrackingGPS ? "Locating..." : "Use My GPS"}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder={userLocation ? "My Current GPS Location" : "Enter or click GPS..."}
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-3.5 pr-10 rounded-xl outline-none placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white"
            />
            <Navigation2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          </div>
        </div>

        {/* Destination / Stop Picker */}
        <div>
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">
            Destination / Dropoff
          </label>
          {routeStops.length > 0 ? (
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-3.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
            >
              {routeStops.map((st, i) => (
                <option key={i} value={st.name}>
                  {st.name} ({st.time})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="e.g. IUBAT Main Gate"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-3.5 rounded-xl outline-none placeholder:text-slate-400 border border-slate-200 focus:border-blue-500"
            />
          )}
        </div>

        {/* GPS Status Indicator */}
        {gpsStatusMessage && (
          <div className="flex items-center gap-1.5 p-2 bg-blue-50 rounded-lg text-blue-700 text-[10px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{gpsStatusMessage}</span>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex gap-2.5 pt-1">
          {isNavigating ? (
            <button
              onClick={onStopNavigation}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop Navigation
            </button>
          ) : (
            <button
              onClick={handleStartNav}
              className="flex-1 bg-[#facc15] hover:bg-[#eab308] text-slate-900 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Navigation
            </button>
          )}

          <button
            onClick={handleReset}
            title="Reset Information"
            className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-3.5 rounded-xl hover:bg-white active:rotate-180 transition-all duration-300"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}