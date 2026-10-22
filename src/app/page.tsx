"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import TopNavbar from "@/components/TopNavbar";
import LandingPage from "@/components/LandingPage";
import DesktopDashboard from "@/components/DesktopDashboard";
import LocationSearchBar from "@/components/LocationSearchBar";
import BottomBusCard, { BottomBusCardData } from "@/components/BottomBusCard";
import BusSchedule from "@/components/BusSchedule";
import ClassSchedule from "@/components/ClassSchedule";
import RightPanel, { JourneyInfo } from "@/components/RightPanel";
import Settings from "@/components/Settings";
import DriverCockpit from "@/components/DriverCockpit";
import AuthModal from "@/components/AuthModal";
import NoticeBoardModal from "@/components/NoticeBoardModal";
import { supabase } from "@/lib/supabase";
import { 
  fetchOSRMRoute, 
  geocodeLocation, 
  calculateDistanceKm, 
  RouteResult, 
  KnownStop 
} from "@/lib/routing";
import { BusLocationItem } from "@/components/Map";
import { SlidersHorizontal, Bus, Bell, Maximize2, Minimize2 } from "lucide-react";

const MapView = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#121411] flex items-center justify-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
      Loading Real-Time Map...
    </div>
  )
});

export default function App() {
  // Live Map is now the default landing view!
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: "login" | "signup" }>({
    isOpen: false,
    mode: "login",
  });
  const [isNoticeBoardOpen, setIsNoticeBoardOpen] = useState(false);
  const [isMobileFullscreenMap, setIsMobileFullscreenMap] = useState(false);
  
  // UI States
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Navigation States
  const [startPoint, setStartPoint] = useState("Cherag ali bus stand, Tongi, Gazipur");
  const [destination, setDestination] = useState("Kamarpara, IUBAT University");
  const [navigationRoute, setNavigationRoute] = useState<RouteResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedBusNo, setSelectedBusNo] = useState<string | null>("12");

  // Bottom Floating Card Data (Matches Video & Mobile Figma)
  const [bottomBusData, setBottomBusData] = useState<BottomBusCardData>({
    busNo: "12",
    currentLocationName: "Hossen Market, Tongi, Gazipur",
    nextStopName: "Cherag Ali, Tongi, Gazipur",
    etaToNext: "00:12 M",
    destinationName: "Kamarpara, IUBAT University",
    totalEta: "00:12 M",
    speedKmh: 34,
    occupancy: "seats_available",
    trafficLevel: "moderate",
    vehicleCount: 14,
  });

  const [journeyInfo, setJourneyInfo] = useState<JourneyInfo>({
    currentLocation: "Cherag ali bus stand, Tongi, Gazipur",
    nextStop: "Cherag Ali, Tongi, Gazipur",
    finalDestination: "Kamarpara, IUBAT University",
    eta: "00:12 M",
    distanceKm: 6.8,
    trafficLevel: "moderate",
    trafficLabel: "Moderate Speed",
    trafficColor: "#eab308",
    nearestBus: "Bus #12 En Route",
  });

  // Listen for user location events
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ latitude?: number; longitude?: number } | null>;
      const detail = customEvent?.detail;
      if (!detail) {
        setCurrentLocation("Unable to get location");
        return;
      }
      const { latitude, longitude } = detail;
      if (typeof latitude === "number" && typeof longitude === "number") {
        setUserCoords([latitude, longitude]);
        setCurrentLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      } else {
        setCurrentLocation("Unknown");
      }
    };

    window.addEventListener("user-location", handler);
    return () => window.removeEventListener("user-location", handler);
  }, []);

  // Sync theme for desktop wrapper and footer
  const [appTheme, setAppTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const themeHandler = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setAppTheme(custom.detail);
    };
    window.addEventListener("set-map-theme", themeHandler);
    return () => window.removeEventListener("set-map-theme", themeHandler);
  }, []);

  // Use live GPS as Start Point
  const handleUseMyLocation = useCallback(() => {
    if (userCoords) {
      setStartPoint(`My Location (${userCoords[0].toFixed(4)}, ${userCoords[1].toFixed(4)})`);
    } else {
      window.dispatchEvent(new Event("track-user"));
      setStartPoint("My GPS Location");
    }
  }, [userCoords]);

  // Real Turn-by-Turn Navigation & Traffic Calculation
  const handleStartNavigation = async () => {
    setIsLoadingRoute(true);

    try {
      // 1. Resolve Start Coordinates
      let startCoords: [number, number] | null = null;
      const targetStart = startPoint.trim() || "Cherag ali bus stand, Tongi, Gazipur";

      if (targetStart.toLowerCase().includes("cherag")) {
        startCoords = [23.9005, 90.4005]; // Tongi / Cherag Ali
      } else if (targetStart.toLowerCase().includes("my location") || targetStart.toLowerCase().includes("my gps")) {
        startCoords = userCoords || [23.8920, 90.4020];
      } else {
        const coordMatch = targetStart.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (coordMatch) {
          startCoords = [parseFloat(coordMatch[1]), parseFloat(coordMatch[2])];
        } else {
          startCoords = await geocodeLocation(targetStart);
        }
      }

      if (!startCoords) {
        startCoords = userCoords || [23.9005, 90.4005];
      }

      // 2. Resolve Destination Coordinates
      let destCoords: [number, number] | null = null;
      const targetDest = destination.trim() || "Kamarpara, IUBAT University";

      if (targetDest.toLowerCase().includes("kamarpara") || targetDest.toLowerCase().includes("iubat")) {
        destCoords = [23.8759, 90.3795]; // IUBAT Campus Main Gate
      } else {
        const destCoordMatch = targetDest.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
        if (destCoordMatch) {
          destCoords = [parseFloat(destCoordMatch[1]), parseFloat(destCoordMatch[2])];
        } else {
          destCoords = await geocodeLocation(targetDest);
        }
      }

      if (!destCoords) {
        destCoords = [23.8759, 90.3795];
      }

      // 3. Query Active Buses from Supabase
      let nearestBusInfo: { bus_no: string; speed: number; distKm: number } | null = null;
      let effectiveSpeed = 30; // default 30 km/h

      const { data: busLocs } = await supabase
        .from("bus_locations")
        .select(`latitude, longitude, speed, buses(bus_no, route_name)`);

      if (busLocs && busLocs.length > 0) {
        let minDist = Infinity;
        for (const loc of busLocs) {
          const dist = calculateDistanceKm(startCoords[0], startCoords[1], loc.latitude, loc.longitude);
          if (dist < minDist) {
            minDist = dist;
            const busObj = Array.isArray(loc.buses) ? loc.buses[0] : loc.buses;
            nearestBusInfo = {
              bus_no: busObj && typeof busObj === "object" && "bus_no" in busObj ? String(busObj.bus_no) : "12",
              speed: loc.speed || 30,
              distKm: dist,
            };
          }
        }
        if (nearestBusInfo && nearestBusInfo.speed > 0) {
          effectiveSpeed = nearestBusInfo.speed;
        }
      }

      // 4. Request Real Road Polyline from OSRM with live traffic segments
      const route = await fetchOSRMRoute(startCoords, destCoords, effectiveSpeed, busLocs || []);

      if (route) {
        setNavigationRoute(route);
        setIsNavigating(true);
        setSelectedBusNo(nearestBusInfo?.bus_no || "12");

        const etaFormatted = `${route.durationMinutes} MIN`;
        const nearestText = nearestBusInfo 
          ? `Bus #${nearestBusInfo.bus_no} (${nearestBusInfo.speed} km/h • ${nearestBusInfo.distKm} km away)`
          : "Bus #12 Active (Tongi-Campus)";

        setJourneyInfo({
          currentLocation: targetStart,
          nextStop: "Cherag Ali, Tongi, Gazipur",
          finalDestination: targetDest,
          eta: etaFormatted,
          distanceKm: route.distanceKm,
          trafficLevel: route.trafficLevel,
          trafficLabel: route.trafficLevel === "smooth" ? "Smooth Flow" : route.trafficLevel === "moderate" ? "Moderate Speed" : "Heavy Traffic Jam",
          trafficColor: route.trafficColor,
          nearestBus: nearestText,
        });

        setBottomBusData({
          busNo: nearestBusInfo?.bus_no || "12",
          currentLocationName: "Hossen Market, Tongi, Gazipur",
          nextStopName: targetStart,
          etaToNext: "00:12 M",
          destinationName: targetDest,
          totalEta: etaFormatted,
          speedKmh: effectiveSpeed,
          occupancy: "seats_available",
          trafficLevel: route.trafficLevel,
          vehicleCount: 16,
        });
      }
    } catch (err) {
      console.error("Navigation error:", err);
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Reset Navigation
  const handleResetNavigation = () => {
    setStartPoint("Cherag ali bus stand, Tongi, Gazipur");
    setDestination("Kamarpara, IUBAT University");
    setNavigationRoute(null);
    setIsNavigating(false);
    setJourneyInfo({
      currentLocation: "Ready for trip",
      nextStop: "Not started",
      finalDestination: "IUBAT University",
      eta: "-- MIN",
      distanceKm: 0,
      trafficLevel: "smooth",
      trafficLabel: "Normal",
      trafficColor: "#22c55e",
      nearestBus: "Monitoring buses...",
    });
  };

  const handleSelectStop = (stop: KnownStop) => {
    setDestination(stop.name);
    setBottomBusData(prev => ({ ...prev, destinationName: stop.name }));
  };

  const handleSelectBus = (bus: BusLocationItem) => {
    const busNo = bus.buses?.bus_no || "12";
    setSelectedBusNo(busNo);
    setBottomBusData(prev => ({
      ...prev,
      busNo,
      currentLocationName: `Near ${bus.latitude.toFixed(4)}, ${bus.longitude.toFixed(4)}`,
      speedKmh: bus.speed || 30,
    }));
  };

  const handleMapClick = (coords: [number, number]) => {
    const formatted = `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
    if (!startPoint) {
      setStartPoint(formatted);
    } else {
      setDestination(formatted);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#141613] font-sans antialiased text-white select-none">
      
      {/* Top Navbar */}
      <TopNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTrackNow={() => {
          setActiveTab("dashboard");
          handleStartNavigation();
        }}
        onOpenDriver={() => {
          window.location.href = "/driver";
        }}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onOpenNotices={() => setIsNoticeBoardOpen(true)}
      />

      {/* Main Viewport Router */}
      <main className="flex-1 flex flex-col">
        
        {/* --- VIEW 1: ABOUT & PRODUCT OVERVIEW PAGE (Former Landing Page) --- */}
        {(activeTab === "about" || activeTab === "home") && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <LandingPage
              onTrackNow={() => {
                setActiveTab("dashboard");
                handleStartNavigation();
              }}
              onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
            />
          </div>
        )}

        {/* --- VIEW 2: MAP DASHBOARD & SCHEDULES (Primary App Experience) --- */}
        {activeTab !== "about" && activeTab !== "home" && (
          <>
            {/* ========================================================
                A. DESKTOP & TABLET / PAD VIEWPORT (md:flex) -> Matching 2. Desktop Dashboard 1.1
               ======================================================== */}
            <div className={`hidden md:flex flex-col flex-1 transition-colors duration-300 ${
              appTheme === "light" ? "bg-[#f8fafc] text-slate-900" : "bg-[#141613] text-white"
            }`}>
              <DesktopDashboard
                navigationRoute={navigationRoute}
                userCoords={userCoords}
                selectedBusNo={selectedBusNo}
                startPoint={startPoint}
                setStartPoint={setStartPoint}
                destination={destination}
                setDestination={setDestination}
                onEnter={handleStartNavigation}
                onReset={handleResetNavigation}
                onUseMyLocation={handleUseMyLocation}
                onSelectBus={handleSelectBus}
                onSelectStop={handleSelectStop}
                onMapClick={handleMapClick}
                onOpenDriver={() => {
                  setActiveTab("driver");
                }}
                onOpenNotices={() => setIsNoticeBoardOpen(true)}
              />

              {/* Shared Desktop Footer (from 2. Desktop Dashboard 1.1) */}
              <footer className={`mt-auto py-10 px-6 max-w-7xl mx-auto w-full border-t transition-colors ${
                appTheme === "light"
                  ? "border-slate-200 text-slate-700"
                  : "border-[#242823] text-white"
              }`}>
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl bg-[#facc15] flex items-center justify-center text-black">
                        <Bus className="w-3.5 h-3.5" />
                      </div>
                      <span className={`font-black text-base tracking-tight ${
                        appTheme === "light" ? "text-slate-900" : "text-white"
                      }`}>UBus</span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Access live bus locations, schedules, and important updates all in one place.
                    </p>
                  </div>

                  <div className="grid grid-cols-4 gap-8 text-xs">
                    <div>
                      <h6 className={`font-black uppercase text-[10px] tracking-wider mb-2 ${
                        appTheme === "light" ? "text-slate-900" : "text-white"
                      }`}>Resources</h6>
                      <ul className="space-y-1.5 text-slate-400">
                        <li className="hover:text-[#facc15] cursor-pointer">Newsletter</li>
                        <li className="hover:text-[#facc15] cursor-pointer">blog</li>
                        <li className="hover:text-[#facc15] cursor-pointer">Support</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className={`font-black uppercase text-[10px] tracking-wider mb-2 ${
                        appTheme === "light" ? "text-slate-900" : "text-white"
                      }`}>Socials</h6>
                      <ul className="space-y-1.5 text-slate-400">
                        <li className="hover:text-[#facc15] cursor-pointer">Facebook</li>
                        <li className="hover:text-[#facc15] cursor-pointer">LinkedIn</li>
                        <li className="hover:text-[#facc15] cursor-pointer">GitHub</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className={`font-black uppercase text-[10px] tracking-wider mb-2 ${
                        appTheme === "light" ? "text-slate-900" : "text-white"
                      }`}>Important</h6>
                      <ul className="space-y-1.5 text-slate-400">
                        <li className="hover:text-[#facc15] cursor-pointer">Settings</li>
                        <li className="hover:text-[#facc15] cursor-pointer">Contact</li>
                      </ul>
                    </div>
                    <div>
                      <h6 className={`font-black uppercase text-[10px] tracking-wider mb-2 ${
                        appTheme === "light" ? "text-slate-900" : "text-white"
                      }`}>Legals</h6>
                      <ul className="space-y-1.5 text-slate-400">
                        <li className="hover:text-[#facc15] cursor-pointer">Licenses</li>
                        <li className="hover:text-[#facc15] cursor-pointer">Privacy</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className={`pt-5 flex items-center justify-between text-xs border-t ${
                  appTheme === "light" ? "border-slate-200 text-slate-500" : "border-[#242823] text-slate-500"
                }`}>
                  <p>Copyright 2024. All right reserved</p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="hover:text-[#facc15] cursor-pointer">Facebook</span>
                    <span className="hover:text-[#facc15] cursor-pointer">LinkedIn</span>
                    <span className="hover:text-[#facc15] cursor-pointer">X</span>
                  </div>
                </div>
              </footer>
            </div>

            {/* ========================================================
                B. MOBILE VIEWPORT (md:hidden) -> Matching Android Fullscreen Figma
               ======================================================== */}
            <div className="flex md:hidden flex-col flex-1 h-[calc(100vh-53px)] overflow-hidden">
              {activeTab === "dashboard" && (
                <div className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-0 z-0">
                    <MapView 
                      navigationRoute={navigationRoute}
                      userCoords={userCoords}
                      selectedBusNo={selectedBusNo}
                      onMapClick={handleMapClick}
                      onSelectBus={handleSelectBus}
                      onSelectStop={handleSelectStop}
                    />
                  </div>

                  {/* Top Floating Location Search Bar (hidden in mobile fullscreen mode) */}
                  {!isMobileFullscreenMap && (
                    <div className="absolute top-3 left-3 right-3 z-20 pointer-events-auto">
                      <LocationSearchBar
                        currentStopName={startPoint}
                        isLoading={isLoadingRoute}
                        onSelectStopName={(stopName, isDest) => {
                          if (isDest) setDestination(stopName);
                          else setStartPoint(stopName);
                        }}
                        onEnter={handleStartNavigation}
                      />
                    </div>
                  )}

                  {/* Floating Action Buttons: Fullscreen, Notice Board & Details Toggle */}
                  <div className="absolute top-20 right-3 z-20 flex flex-col gap-2">
                    {/* Fullscreen Map Toggle Button */}
                    <button
                      onClick={() => setIsMobileFullscreenMap(!isMobileFullscreenMap)}
                      title="Toggle Fullscreen Map View"
                      className="w-9 h-9 rounded-xl bg-[#141613]/90 backdrop-blur-md border border-[#262a25] text-slate-200 hover:text-white flex items-center justify-center shadow-xl active:scale-95 transition-all"
                    >
                      {isMobileFullscreenMap ? (
                        <Minimize2 className="w-4 h-4 text-[#facc15]" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-[#facc15]" />
                      )}
                    </button>

                    <button
                      onClick={() => setIsNoticeBoardOpen(true)}
                      title="Campus Notices & Alerts"
                      className="w-9 h-9 rounded-xl bg-[#141613]/90 backdrop-blur-md border border-[#262a25] text-[#facc15] flex items-center justify-center shadow-xl active:scale-95 transition-all relative"
                    >
                      <Bell className="w-4 h-4" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#facc15] rounded-full animate-ping" />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#facc15] rounded-full" />
                    </button>

                    <button
                      onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                      title="Trip Details & Navigation Settings"
                      className="w-9 h-9 rounded-xl bg-[#141613]/90 backdrop-blur-md border border-[#262a25] text-slate-300 flex items-center justify-center shadow-xl active:scale-95 transition-all"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Floating Card (hidden in mobile fullscreen mode) */}
                  {!isMobileFullscreenMap && (
                    <div className="absolute bottom-4 left-3 right-3 z-20 pointer-events-auto">
                      <BottomBusCard
                        data={bottomBusData}
                        onSelectBus={() => setSelectedBusNo(bottomBusData.busNo)}
                      />
                    </div>
                  )}

                  <RightPanel 
                    isOpen={isRightPanelOpen} 
                    currentLocation={currentLocation}
                    startPoint={startPoint}
                    setStartPoint={setStartPoint}
                    destination={destination}
                    setDestination={setDestination}
                    journeyInfo={journeyInfo}
                    isNavigating={isNavigating}
                    isLoadingRoute={isLoadingRoute}
                    onStart={handleStartNavigation}
                    onReset={handleResetNavigation}
                    onUseMyLocation={handleUseMyLocation}
                  />
                </div>
              )}

              {activeTab === "schedule" && (
                <div className={`h-full overflow-y-auto ${appTheme === "light" ? "bg-slate-100" : "bg-[#141613]"} custom-scrollbar p-3 transition-colors`}>
                  <BusSchedule theme={appTheme} />
                </div>
              )}

              {activeTab === "class" && (
                <div className={`h-full overflow-y-auto ${appTheme === "light" ? "bg-slate-100" : "bg-[#141613]"} custom-scrollbar p-3 transition-colors`}>
                  <ClassSchedule theme={appTheme} />
                </div>
              )}

              {activeTab === "settings" && (
                <div className={`h-full overflow-y-auto ${appTheme === "light" ? "bg-slate-100" : "bg-[#141613]"} custom-scrollbar p-3 transition-colors`}>
                  <Settings theme={appTheme} />
                </div>
              )}

              {activeTab === "driver" && (
                <div className={`h-full overflow-y-auto ${appTheme === "light" ? "bg-slate-100" : "bg-[#141613]"} custom-scrollbar p-3 transition-colors`}>
                  <DriverCockpit theme={appTheme} onBack={() => setActiveTab("dashboard")} />
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {/* --- Exact Figma Auth Modal (orca-paste-1792644520640-12d13ef8) --- */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, mode: "login" })}
        initialMode={authModal.mode}
      />

      {/* --- Campus Notice Board & Live Transit Alerts Modal --- */}
      <NoticeBoardModal
        isOpen={isNoticeBoardOpen}
        onClose={() => setIsNoticeBoardOpen(false)}
      />

    </div>
  );
}