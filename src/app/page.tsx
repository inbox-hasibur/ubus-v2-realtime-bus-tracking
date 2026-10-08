"use client";

import dynamic from "next/dynamic";
import { Clock, Target, Menu, Navigation } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import BusSchedule from "@/components/BusSchedule";
import ClassSchedule from "@/components/ClassSchedule";
import Sidebar from "@/components/Sidebar";
import RightPanel, { RouteOption } from "@/components/RightPanel";
import Settings from "@/components/Settings";
import { BusLocation } from "@/components/Map";
import { supabase } from "@/lib/supabase";
import { calculateDistanceKm } from "@/lib/transitData";

const MapView = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-200 animate-pulse" />,
});

const DEFAULT_BUSES: BusLocation[] = [
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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // Live Data States
  const [buses, setBuses] = useState<BusLocation[]>(DEFAULT_BUSES);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(DEFAULT_BUSES[0]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");

  // Navigation & GPS States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number] | null>(null);
  const [startPoint, setStartPoint] = useState("");
  const [destination, setDestination] = useState("IUBAT Main Gate");
  const [navigationPath, setNavigationPath] = useState<[number, number][]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isTrackingGPS, setIsTrackingGPS] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState("");

  // Fetch real routes and real bus locations from Supabase
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        // 1. Fetch Routes
        const { data: routeData } = await supabase
          .from("routes")
          .select("*")
          .order("bus_number", { ascending: true });

        if (active && routeData && routeData.length > 0) {
          setRoutes(routeData as RouteOption[]);
          setSelectedRouteId(routeData[0].id);
        }

        // 2. Fetch Bus Locations
        const { data: locData } = await supabase
          .from("bus_locations")
          .select(`id, latitude, longitude, speed, buses (bus_no, route_name)`);

        if (active && locData && locData.length > 0) {
          setBuses(locData as BusLocation[]);
          setSelectedBus(locData[0] as BusLocation);
        }
      } catch (err) {
        console.warn("Error loading database records:", err);
      }
    };

    loadData();

    // Listen for realtime bus updates
    const channel = supabase
      .channel("bus_dashboard_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_locations" }, async () => {
        const { data: locData } = await supabase
          .from("bus_locations")
          .select(`id, latitude, longitude, speed, buses (bus_no, route_name)`);
        if (active && locData && locData.length > 0) {
          setBuses(locData as BusLocation[]);
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Clock & Responsive Panel Layout
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false);
        setIsRightPanelOpen(true);
      } else {
        setIsSidebarCollapsed(true);
        setIsRightPanelOpen(false);
      }
    };
    handleResize();

    return () => clearInterval(interval);
  }, []);

  // Track Near Me Logic
  const handleTrackNearMe = useCallback(() => {
    setIsRightPanelOpen(true);
    setIsTrackingGPS(true);
    setGpsStatusMessage("Acquiring high-accuracy GPS signal...");

    if (typeof window === "undefined" || !navigator.geolocation) {
      const fallback = { lat: 23.8759, lng: 90.3795 };
      setUserLocation(fallback);
      setFocusTarget([fallback.lat, fallback.lng]);
      setStartPoint("IUBAT University Campus");
      setIsTrackingGPS(false);
      setGpsStatusMessage("Browser GPS not available • Focused on IUBAT Campus");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setFocusTarget([coords.lat, coords.lng]);
        setStartPoint(`GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
        setIsTrackingGPS(false);
        setGpsStatusMessage("GPS Locked • Live Location Active");

        // Automatically find and highlight the closest bus!
        let closest: BusLocation | null = null;
        let minD = Infinity;
        buses.forEach((b) => {
          const d = calculateDistanceKm(coords.lat, coords.lng, b.latitude, b.longitude);
          if (d < minD) {
            minD = d;
            closest = b;
          }
        });
        if (closest) {
          setSelectedBus(closest);
        }
      },
      (err) => {
        console.warn("GPS error/denied:", err.message);
        // Clean fallback to IUBAT Campus proximity so user is never stuck
        const campus = { lat: 23.8759, lng: 90.3795 };
        setUserLocation(campus);
        setFocusTarget([campus.lat, campus.lng]);
        setStartPoint("IUBAT Campus Sector 10");
        setIsTrackingGPS(false);
        setGpsStatusMessage("Location permission denied • Centered on IUBAT Campus");

        if (buses.length > 0) {
          setSelectedBus(buses[0]);
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [buses]);

  // Handle Bus Selection
  const handleSelectBus = useCallback((bus: BusLocation) => {
    setSelectedBus(bus);
    setFocusTarget([bus.latitude, bus.longitude]);
    setIsRightPanelOpen(true);
  }, []);

  // Handle Start & Stop Navigation
  const handleStartNavigation = useCallback((path: [number, number][]) => {
    setNavigationPath(path);
    setIsNavigating(true);
    if (path.length > 0) {
      setFocusTarget(path[0]);
    }
  }, []);

  const handleStopNavigation = useCallback(() => {
    setNavigationPath([]);
    setIsNavigating(false);
  }, []);

  return (
    <div className="flex h-screen bg-[#e2e8f0] overflow-hidden font-sans antialiased text-slate-900">
      {/* --- Sidebar --- */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {activeTab === "dashboard" ? (
          <>
            <div key="map-container" className="absolute inset-0 z-0">
              <MapView
                userLocation={userLocation}
                selectedBus={selectedBus}
                onSelectBus={handleSelectBus}
                navigationPath={navigationPath}
                focusTarget={focusTarget}
              />
            </div>

            {/* Top Overlay Badges (Time & Date & Navigation Indicator) */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-wrap gap-2 z-10 transition-all duration-300">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[12px] shadow-2xl flex items-center gap-2 border border-white/10">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" /> {currentTime}
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[12px] shadow-2xl border border-white/10 hidden sm:block">
                {currentDate}
              </div>
              {isNavigating && (
                <div className="bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] shadow-2xl border border-blue-400 flex items-center gap-1.5 animate-pulse">
                  <Navigation className="w-3.5 h-3.5 fill-current" />
                  <span>Navigating to {destination}</span>
                </div>
              )}
            </div>

            {/* Top Right Actions (Track Near Me & Hamburger) */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 md:gap-3 z-20">
              {/* Track Me Button */}
              <button
                onClick={handleTrackNearMe}
                className={`bg-[#facc15] hover:bg-[#eab308] text-slate-900 h-9 md:h-11 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase shadow-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 border border-yellow-400/50 ${
                  isRightPanelOpen ? "px-4 md:px-6" : "w-9 md:w-11 px-0"
                }`}
                title="Track My Location"
              >
                <Target className={`shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 ${isTrackingGPS ? "animate-spin" : ""}`} />
                <span
                  className={`overflow-hidden transition-all duration-300 hidden md:block ${
                    isRightPanelOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                  }`}
                >
                  {isTrackingGPS ? "Locating..." : "Track Near Me"}
                </span>
              </button>

              {/* Menu Toggle Button */}
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className={`h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-2xl shadow-xl border transition-all active:scale-95 ${
                  !isRightPanelOpen
                    ? "bg-slate-900/90 backdrop-blur-md text-white border-white/10"
                    : "bg-white/80 backdrop-blur-md border-white/60 text-slate-900"
                }`}
              >
                <Menu className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* --- Realtime Right Panel --- */}
            <RightPanel
              isOpen={isRightPanelOpen}
              userLocation={userLocation}
              buses={buses}
              selectedBus={selectedBus}
              onSelectBus={handleSelectBus}
              routes={routes}
              selectedRouteId={selectedRouteId}
              onSelectRouteId={setSelectedRouteId}
              startPoint={startPoint}
              setStartPoint={setStartPoint}
              destination={destination}
              setDestination={setDestination}
              isNavigating={isNavigating}
              onStartNavigation={handleStartNavigation}
              onStopNavigation={handleStopNavigation}
              onTrackNearMe={handleTrackNearMe}
              isTrackingGPS={isTrackingGPS}
              gpsStatusMessage={gpsStatusMessage}
            />
          </>
        ) : (
          <div className="z-10 h-full w-full p-0 md:p-4 lg:p-8 overflow-auto bg-white/50 backdrop-blur-md">
            {activeTab === "schedule" ? (
              <BusSchedule />
            ) : activeTab === "class" ? (
              <ClassSchedule />
            ) : activeTab === "settings" ? (
              <Settings />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs">
                Page Coming Soon
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}