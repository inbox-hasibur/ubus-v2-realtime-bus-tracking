"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Home, 
  Clock, 
  Calendar, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut, 
  Bus, 
  Bell, 
  Navigation, 
  RotateCcw,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Menu,
  X,
  Crosshair,
  MapPin
} from "lucide-react";
import BusSchedule from "@/components/BusSchedule";
import ClassSchedule from "@/components/ClassSchedule";
import Settings from "@/components/Settings";
import DriverCockpit from "@/components/DriverCockpit";
import { RouteResult, KnownStop, KNOWN_STOPS } from "@/lib/routing";
import { BusLocationItem } from "@/components/Map";
import { signOutUser } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#121411] flex items-center justify-center text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">
      Loading Real-Time Map...
    </div>
  )
});

interface DesktopDashboardProps {
  navigationRoute?: RouteResult | null;
  userCoords?: [number, number] | null;
  selectedBusNo?: string | null;
  startPoint: string;
  setStartPoint: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  onEnter: () => void;
  onReset: () => void;
  onUseMyLocation: () => void;
  onSelectBus?: (bus: BusLocationItem) => void;
  onSelectStop?: (stop: KnownStop) => void;
  onMapClick?: (coords: [number, number]) => void;
  onOpenDriver?: () => void;
  onOpenNotices?: () => void;
}

export default function DesktopDashboard({
  navigationRoute,
  userCoords,
  selectedBusNo = "12",
  startPoint,
  setStartPoint,
  destination,
  setDestination,
  onEnter,
  onReset,
  onUseMyLocation,
  onSelectBus,
  onSelectStop,
  onMapClick,
  onOpenDriver,
  onOpenNotices,
}: DesktopDashboardProps) {
  // Theme State: "dark" or "light" (persisted in localStorage)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  // Fullscreen State matching:
  // - 2. Desktop Dashboard 1.1 - Dark (Fullscreen).png
  // - 2. Desktop Dashboard 1.1 - White (Fullscreen).jpg
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const [fullscreenModal, setFullscreenModal] = useState<"bus" | "class" | null>(null);

  // Active Sidebar Tab (for windowed mode)
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule" | "class" | "driver" | "settings" | "support">("dashboard");

  // User Profile
  const [storedUser] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("student_id") || "Manjur Matin";
    }
    return "Manjur Matin";
  });

  const currentTime = "9:51 AM";
  const currentDate = "9 SEP, 2024";

  const userInitials = storedUser
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "MM";

  // Toggle Theme handler
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("ubus_theme", next);
        window.dispatchEvent(new CustomEvent("set-map-theme", { detail: next }));
        window.dispatchEvent(new CustomEvent("set-app-theme", { detail: next }));
      }
      return next;
    });
  }, []);

  // Sync external theme changes
  useEffect(() => {
    const handleExtTheme = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setTheme(custom.detail);
    };
    window.addEventListener("set-app-theme", handleExtTheme);
    return () => window.removeEventListener("set-app-theme", handleExtTheme);
  }, []);

  // Keyboard shortcut listener: 'F' toggles Fullscreen, 'Esc' exits Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        const targetTag = (e.target as HTMLElement)?.tagName;
        if (targetTag === "INPUT" || targetTag === "TEXTAREA") return;
        setIsFullscreen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
        setShowFullscreenMenu(false);
        setFullscreenModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    window.location.reload();
  };

  const handleTrackNearMe = () => {
    onUseMyLocation();
    window.dispatchEvent(new Event("track-user"));
  };

  const handleQuickSelect = (name: string, isDest: boolean) => {
    if (isDest) setDestination(name);
    else setStartPoint(name);
  };

  // =========================================================================
  // VIEW 1: FULLSCREEN MODE
  // Matching 2. Desktop Dashboard 1.1 - Dark (Fullscreen).png & White (Fullscreen).jpg
  // =========================================================================
  if (isFullscreen) {
    return (
      <div className={`w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-4 select-none font-sans transition-colors duration-300 ${
        theme === "light" ? "text-slate-900" : "text-white"
      }`}>
        <div className={`relative w-full h-[760px] rounded-2xl overflow-hidden shadow-2xl border transition-colors ${
          theme === "light"
            ? "bg-slate-100 border-slate-300"
            : "bg-[#141613] border-[#262a25]"
        }`}>
          {/* Main Leaflet Map taking full container */}
          <div className="absolute inset-0 z-0">
            <MapView
              navigationRoute={navigationRoute}
              userCoords={userCoords}
              selectedBusNo={selectedBusNo}
              theme={theme}
              onMapClick={onMapClick}
              onSelectBus={onSelectBus}
              onSelectStop={onSelectStop}
            />
          </div>

          {/* -------------------------------------------------------------
              TOP-LEFT OVERLAY: Exact Time & Date Badges from Figma
             ------------------------------------------------------------- */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-[#1c1f1a] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-black/25 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#facc15]" />
              <span>{currentTime}</span>
            </div>
            <div className="bg-[#1c1f1a] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg border border-black/25 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate}</span>
            </div>
          </div>

          {/* -------------------------------------------------------------
              TOP-RIGHT OVERLAY: Track Near Me + Hamburger Menu from Figma
             ------------------------------------------------------------- */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            {/* Track Near Me Button */}
            <button
              onClick={handleTrackNearMe}
              className={`px-4 py-2 rounded-xl text-xs font-black shadow-xl flex items-center gap-1.5 active:scale-95 transition-all ${
                theme === "light"
                  ? "bg-[#1a1a1a] hover:bg-black text-white shadow-slate-900/20"
                  : "bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20"
              }`}
            >
              <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Track Near Me</span>
            </button>

            {/* Hamburger Menu Toggle Button */}
            <div className="relative">
              <button
                onClick={() => setShowFullscreenMenu(!showFullscreenMenu)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl active:scale-95 transition-all ${
                  theme === "light"
                    ? "bg-[#1a1a1a] hover:bg-black text-white shadow-slate-900/20"
                    : "bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20"
                }`}
                title="Navigation & Theme Menu"
              >
                {showFullscreenMenu ? (
                  <X className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>

              {/* Fullscreen Dropdown Menu */}
              {showFullscreenMenu && (
                <div className={`absolute top-11 right-0 w-64 rounded-xl p-2.5 shadow-2xl z-50 border backdrop-blur-xl animate-in slide-in-from-top-2 ${
                  theme === "light"
                    ? "bg-white/95 border-slate-200 text-slate-900"
                    : "bg-[#161916]/95 border-[#262a25] text-white"
                }`}>
                  <div className="px-2.5 py-1.5 border-b border-black/5 dark:border-white/5 flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Fullscreen Controls
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">Press Esc to exit</span>
                  </div>

                  <div className="space-y-1">
                    {/* Theme Switcher Toggle */}
                    <button
                      onClick={toggleTheme}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light"
                          ? "hover:bg-slate-100 text-slate-800"
                          : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {theme === "light" ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-[#facc15]" />}
                        <span>{theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                        theme === "light" ? "bg-slate-200 text-slate-700" : "bg-[#28230b] text-[#facc15]"
                      }`}>
                        {theme}
                      </span>
                    </button>

                    {/* Exit Fullscreen */}
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <Minimize2 className="w-3.5 h-3.5 text-[#facc15]" />
                      <span>Exit Fullscreen Mode</span>
                    </button>

                    {/* View Bus Schedule Modal */}
                    <button
                      onClick={() => {
                        setFullscreenModal("bus");
                        setShowFullscreenMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Bus Schedule</span>
                    </button>

                    {/* View Class Schedule Modal */}
                    <button
                      onClick={() => {
                        setFullscreenModal("class");
                        setShowFullscreenMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Class Schedule</span>
                    </button>

                    {/* Driver Companion */}
                    <button
                      onClick={() => {
                        setIsFullscreen(false);
                        setShowFullscreenMenu(false);
                        setActiveTab("driver");
                        if (onOpenDriver) onOpenDriver();
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-amber-600" : "hover:bg-[#1f241d] text-[#facc15]"
                      }`}
                    >
                      <Bus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Driver Companion App</span>
                    </button>

                    {/* Campus Notices */}
                    <button
                      onClick={() => {
                        onOpenNotices?.();
                        setShowFullscreenMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <Bell className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Notices & Transit Alerts</span>
                    </button>

                    {/* Cycle Map Base Layer */}
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('toggle-map-layer'))}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        theme === "light" ? "hover:bg-slate-100 text-slate-800" : "hover:bg-[#1f241d] text-slate-200"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Toggle Map Layer (Google / OSM)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* -------------------------------------------------------------
              RIGHT SIDE OVERLAY CARD: Floating Navigation Panel
              Matching Figma Dark (Fullscreen) & White (Fullscreen)
             ------------------------------------------------------------- */}
          <div className={`absolute top-16 right-4 z-20 w-80 lg:w-[340px] rounded-2xl p-4 shadow-2xl space-y-3 backdrop-blur-xl border transition-all ${
            theme === "light"
              ? "bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-900/10"
              : "bg-[#161916]/90 border-[#262a25] text-white shadow-black/50"
          }`}>
            {/* 1. Estimated Time */}
            <div>
              <label className={`text-[10px] font-bold block mb-1 ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}>
                Estimated time
              </label>
              <div className={`flex items-center rounded-xl overflow-hidden border ${
                theme === "light"
                  ? "bg-[#f3f4f6] border-slate-200"
                  : "bg-[#1d211c] border-[#2f352d]"
              }`}>
                <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                  theme === "light"
                    ? "bg-[#e5e7eb] text-slate-900 border-r border-slate-300"
                    : "bg-[#2b0d0d] text-[#fca5a5] border-r border-[#4a1818]"
                }`}>
                  {navigationRoute ? `${navigationRoute.durationMinutes} MIN` : "00:12 M"}
                </div>
                <div className={`px-3 py-2 text-xs font-bold truncate ${
                  theme === "light" ? "text-slate-800" : "text-slate-200"
                }`}>
                  Tongi
                </div>
              </div>
            </div>

            {/* 2. Current Location */}
            <div>
              <label className={`text-[10px] font-bold block mb-1 ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}>
                Current location
              </label>
              <div className={`rounded-xl px-3 py-2 text-xs font-bold truncate border ${
                theme === "light"
                  ? "bg-[#f3f4f6] border-slate-200 text-slate-800"
                  : "bg-[#1d211c] border-[#2f352d] text-slate-200"
              }`}>
                {startPoint || "Cherag Ali, Tongi, Gazipur"}
              </div>
            </div>

            {/* 3. Next Stopage */}
            <div>
              <label className={`text-[10px] font-bold block mb-1 ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}>
                Next stopage
              </label>
              <div className={`flex items-center rounded-xl overflow-hidden border ${
                theme === "light"
                  ? "bg-[#f3f4f6] border-slate-200"
                  : "bg-[#1d211c] border-[#2f352d]"
              }`}>
                <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                  theme === "light"
                    ? "bg-[#e5e7eb] text-slate-900 border-r border-slate-300"
                    : "bg-[#28230b] text-[#d4c264] border-r border-[#4c4217]"
                }`}>
                  00:45 M
                </div>
                <div className={`px-3 py-2 text-xs font-bold truncate ${
                  theme === "light" ? "text-slate-800" : "text-slate-200"
                }`}>
                  Abdullahpur, Dhaka
                </div>
              </div>
            </div>

            {/* 4. Destination */}
            <div>
              <label className={`text-[10px] font-bold block mb-1 ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}>
                Destination
              </label>
              <div className={`flex items-center rounded-xl overflow-hidden border ${
                theme === "light"
                  ? "bg-[#f3f4f6] border-slate-200"
                  : "bg-[#1d211c] border-[#2f352d]"
              }`}>
                <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                  theme === "light"
                    ? "bg-[#e5e7eb] text-slate-900 border-r border-slate-300"
                    : "bg-[#0c2419] text-[#7be4aa] border-r border-[#164630]"
                }`}>
                  01:20 H
                </div>
                <div className={`px-3 py-2 text-xs font-bold truncate ${
                  theme === "light" ? "text-slate-800" : "text-slate-200"
                }`}>
                  {destination || "IUBAT University"}
                </div>
              </div>
            </div>

            {/* Form Inputs (Current location & Destination) */}
            <div className={`pt-2 border-t space-y-2.5 ${
              theme === "light" ? "border-slate-200" : "border-[#242823]"
            }`}>
              <div>
                <label className={`text-[10px] font-bold block mb-1 ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}>
                  Current location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={startPoint}
                    onChange={(e) => setStartPoint(e.target.value)}
                    placeholder="Enter your current location"
                    className={`w-full rounded-xl px-3.5 py-2 pr-9 text-xs outline-none transition-all ${
                      theme === "light"
                        ? "bg-[#f3f4f6] border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-black"
                        : "bg-[#121410] border border-[#2b2f28] text-white placeholder:text-slate-600 focus:border-[#facc15]"
                    }`}
                  />
                  <Crosshair 
                    onClick={onUseMyLocation}
                    className={`w-3.5 h-3.5 absolute right-3 top-2.5 cursor-pointer transition-colors ${
                      theme === "light" ? "text-slate-400 hover:text-black" : "text-slate-400 hover:text-[#facc15]"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${
                  theme === "light" ? "text-slate-500" : "text-slate-400"
                }`}>
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter your destination"
                  className={`w-full rounded-xl px-3.5 py-2 text-xs outline-none transition-all ${
                    theme === "light"
                      ? "bg-[#f3f4f6] border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-black"
                      : "bg-[#121410] border border-[#2b2f28] text-white placeholder:text-slate-600 focus:border-[#facc15]"
                  }`}
                />
              </div>

              {/* Action Buttons: Enter & Reset */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onEnter}
                  className={`font-black text-xs py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-center ${
                    theme === "light"
                      ? "bg-[#1a1a1a] hover:bg-black text-white"
                      : "bg-[#facc15] hover:bg-[#eab308] text-black"
                  }`}
                >
                  Enter
                </button>
                <button
                  onClick={onReset}
                  className={`font-bold text-xs py-2.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                    theme === "light"
                      ? "bg-[#f3f4f6] hover:bg-slate-200 text-slate-800 border-slate-200"
                      : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-300 hover:text-white"
                  }`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------
              BOTTOM-LEFT OVERLAY: Target & Minimize Toggle from Figma
             ------------------------------------------------------------- */}
          <div className="absolute bottom-5 left-4 z-20 flex items-center gap-2">
            {/* GPS User Target Button */}
            <button
              onClick={handleTrackNearMe}
              title="Locate My GPS Position"
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl active:scale-95 transition-all border backdrop-blur-md ${
                theme === "light"
                  ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
                  : "bg-[#1c201a]/90 border-[#2c3327] text-[#facc15] hover:text-white"
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>

            {/* Minimize / Exit Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              title="Exit Fullscreen Mode"
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xl active:scale-95 transition-all border backdrop-blur-md ${
                theme === "light"
                  ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
                  : "bg-[#1c201a]/90 border-[#2c3327] text-white hover:text-[#facc15]"
              }`}
            >
              <Minimize2 className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* -------------------------------------------------------------
              MODAL POPUP INSIDE FULLSCREEN (Bus / Class Schedule)
             ------------------------------------------------------------- */}
          {fullscreenModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
              <div className={`w-full max-w-2xl max-h-[90%] overflow-y-auto rounded-2xl p-5 border shadow-2xl relative custom-scrollbar ${
                theme === "light"
                  ? "bg-white border-slate-300 text-slate-900"
                  : "bg-[#141613] border-[#262a25] text-white"
              }`}>
                <button
                  onClick={() => setFullscreenModal(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
                {fullscreenModal === "bus" ? <BusSchedule theme={theme} /> : <ClassSchedule theme={theme} />}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: STANDARD WINDOWED DASHBOARD
  // Matching 2. Desktop Dashboard 1.1 - Dark (1).png (Supports Light & Dark)
  // =========================================================================
  return (
    <div className={`w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-5 select-none font-sans transition-colors duration-300 ${
      theme === "light" ? "text-slate-900" : "text-white"
    }`}>
      
      {/* Main Dashboard Container Frame */}
      <div className={`border rounded-2xl overflow-hidden shadow-2xl flex min-h-[700px] transition-colors duration-300 ${
        theme === "light"
          ? "bg-white border-slate-200"
          : "bg-[#141613] border-[#262a25]"
      }`}>
        
        {/* --- Left Sidebar (Icon on Tablet md:, Full on Desktop lg:) --- */}
        <aside className={`w-16 md:w-20 lg:w-60 border-r p-3 md:p-3.5 lg:p-4 flex flex-col justify-between shrink-0 transition-all ${
          theme === "light"
            ? "bg-slate-50 border-slate-200"
            : "bg-[#161916] border-[#262a25]"
        }`}>
          <div className="space-y-1.5">
            <p className="hidden lg:block text-[10px] font-black tracking-widest text-slate-400 uppercase px-3 py-1 mb-2">
              Menu
            </p>

            {/* 1. Dashboard */}
            <button
              onClick={() => setActiveTab("dashboard")}
              title="Dashboard"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "dashboard"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "dashboard" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <Home className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Dashboard</span>
            </button>

            {/* 2. Bus Schedule */}
            <button
              onClick={() => setActiveTab("schedule")}
              title="Bus Schedule"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "schedule"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "schedule" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <Clock className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Bus Schedule</span>
            </button>

            {/* 3. Class Schedule */}
            <button
              onClick={() => setActiveTab("class")}
              title="Class Schedule"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "class"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "class" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Class Schedule</span>
            </button>

            {/* 4. Driver App */}
            <button
              onClick={() => setActiveTab("driver")}
              title="Driver Navigation Cockpit"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "driver"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "driver" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <Bus className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="hidden lg:inline">Driver App</span>
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => setActiveTab("settings")}
              title="Settings"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "settings"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "settings" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <SettingsIcon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Settings</span>
            </button>

            {/* 6. Support */}
            <button
              onClick={() => setActiveTab("support")}
              title="Support Desk"
              className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === "support"
                  ? theme === "light"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "bg-[#1f241d] text-white shadow-md border border-[#2f382b]"
                  : theme === "light"
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#1a1d18]"
              }`}
            >
              {activeTab === "support" && (
                <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                  theme === "light" ? "bg-black" : "bg-[#facc15]"
                }`} />
              )}
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Support</span>
            </button>
          </div>

          {/* Log Out */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-3.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              theme === "light"
                ? "text-red-600 hover:bg-red-50"
                : "text-[#facc15] hover:bg-[#1f241d]"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Log Out</span>
          </button>
        </aside>

        {/* --- Right Main Area --- */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 lg:p-6 min-w-0">
          
          {/* Top Subheader: Badges, Theme Switcher & Profile */}
          <div className={`flex items-center justify-between pb-4 sm:pb-5 border-b gap-3 flex-wrap ${
            theme === "light" ? "border-slate-200" : "border-[#242823]"
          }`}>
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Time Badge */}
              <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                theme === "light"
                  ? "bg-slate-100 border-slate-200 text-slate-800"
                  : "bg-[#1c201a] border-[#2c3327] text-slate-200"
              }`}>
                {currentTime}
              </div>

              {/* Date Badge */}
              <div className={`hidden sm:block px-3 py-1.5 rounded-xl text-xs font-bold border ${
                theme === "light"
                  ? "bg-slate-100 border-slate-200 text-slate-800"
                  : "bg-[#1c201a] border-[#2c3327] text-slate-200"
              }`}>
                {currentDate}
              </div>

              {/* Weather / Commute Status */}
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                theme === "light"
                  ? "bg-slate-100 border-slate-200 text-slate-800"
                  : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>🌤️ 28°C Dhaka • Clear Roads</span>
              </div>

              {/* Notice Board Bell Trigger */}
              <button
                type="button"
                onClick={() => onOpenNotices?.()}
                title="Campus Transit Notices & Alerts"
                className={`relative w-8 h-8 rounded-xl border flex items-center justify-center transition-colors active:scale-95 ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-200 text-slate-700 hover:text-black"
                    : "bg-[#1c201a] border-[#2c3327] text-slate-300 hover:text-[#facc15]"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#facc15] rounded-full animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#facc15] rounded-full" />
              </button>

              {/* --- Theme Switcher Pill (Light / Dark Mode Toggle) --- */}
              <button
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 active:scale-95 transition-all ${
                  theme === "light"
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                    : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-200"
                }`}
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Light Mode</span>
                  </>
                )}
              </button>
            </div>

            {/* User Greeting & Initials Avatar */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`hidden sm:inline text-xs font-bold truncate max-w-[150px] ${
                theme === "light" ? "text-slate-800" : "text-slate-200"
              }`}>
                {storedUser}
              </span>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#facc15] to-[#eab308] flex items-center justify-center text-black font-black text-xs border border-white/20 shadow-md">
                {userInitials}
              </div>
            </div>
          </div>

          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="pt-5 space-y-5">
              
              {/* Welcome Row with Fullscreen Toggle and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${
                    theme === "light" ? "text-slate-900" : "text-white"
                  }`}>
                    Welcome, {storedUser}
                  </h1>
                  <p className={`text-[11px] mt-0.5 ${
                    theme === "light" ? "text-slate-500" : "text-slate-400"
                  }`}>
                    Live University Shuttle GPS Tracking & Route Transit System
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleTrackNearMe}
                    className={`font-black text-xs px-3.5 py-2 rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 ${
                      theme === "light"
                        ? "bg-[#1a1a1a] hover:bg-black text-white"
                        : "bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Track Near Me</span>
                  </button>

                  {/* Fullscreen Map Toggle */}
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className={`border font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 ${
                      theme === "light"
                        ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                        : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-200"
                    }`}
                    title="Enter Fullscreen Map View (Press F)"
                  >
                    <Maximize2 className={`w-3.5 h-3.5 ${theme === "light" ? "text-slate-700" : "text-[#facc15]"}`} />
                    <span>Fullscreen Map</span>
                  </button>

                  {/* Live Google Map / Satellite Layer Switcher */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('toggle-map-layer'))}
                    className={`border font-bold text-xs px-3.5 py-2 rounded-xl transition-all ${
                      theme === "light"
                        ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                        : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-300 hover:text-white"
                    }`}
                  >
                    Live Google map
                  </button>
                </div>
              </div>

              {/* Grid: Map on Left (8 cols), Travel Info Panel on Right (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                
                {/* Map Card */}
                <div className={`lg:col-span-8 h-[420px] md:h-[480px] lg:h-[540px] rounded-xl overflow-hidden shadow-xl relative transition-all border ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-200"
                    : "bg-[#121411] border-[#262a25]"
                }`}>
                  <MapView
                    navigationRoute={navigationRoute}
                    userCoords={userCoords}
                    selectedBusNo={selectedBusNo}
                    theme={theme}
                    onMapClick={onMapClick}
                    onSelectBus={onSelectBus}
                    onSelectStop={onSelectStop}
                  />

                  {/* Expand Fullscreen Button on Map bottom-left matching Figma 2. Desktop Dashboard 1.1 */}
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className={`absolute bottom-5 right-4 z-[400] w-9 h-9 rounded-xl flex items-center justify-center shadow-2xl border active:scale-95 transition-all ${
                      theme === "light"
                        ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
                        : "bg-[#1c201a]/95 border-[#2c3327] text-white hover:text-[#facc15]"
                    }`}
                    title="Expand to Fullscreen Map"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Right: Travel Information Form Panel */}
                <div className={`lg:col-span-4 rounded-xl p-4 sm:p-5 shadow-xl space-y-3.5 border transition-all ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200 text-slate-900"
                    : "bg-[#161916] border-[#262a25] text-white"
                }`}>
                  
                  {/* Estimated time */}
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Estimated time
                    </label>
                    <div className={`flex items-center rounded-xl overflow-hidden border ${
                      theme === "light"
                        ? "bg-white border-slate-200"
                        : "bg-[#1d211c] border-[#2f352d]"
                    }`}>
                      <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                        theme === "light"
                          ? "bg-slate-100 text-slate-900 border-r border-slate-200"
                          : "bg-[#2b0d0d] text-[#fca5a5] border-r border-[#4a1818]"
                      }`}>
                        {navigationRoute ? `${navigationRoute.durationMinutes} MIN` : "00:12 M"}
                      </div>
                      <div className={`px-3 py-2 text-xs font-bold truncate ${
                        theme === "light" ? "text-slate-800" : "text-slate-200"
                      }`}>
                        Tongi
                      </div>
                    </div>
                  </div>

                  {/* Current location */}
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Current location
                    </label>
                    <div className={`rounded-xl px-3 py-2 text-xs font-bold truncate border ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800"
                        : "bg-[#1d211c] border-[#2f352d] text-slate-200"
                    }`}>
                      {startPoint || "Cherag Ali, Tongi, Gazipur"}
                    </div>
                  </div>

                  {/* Next stopage */}
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Next stopage
                    </label>
                    <div className={`flex items-center rounded-xl overflow-hidden border ${
                      theme === "light"
                        ? "bg-white border-slate-200"
                        : "bg-[#1d211c] border-[#2f352d]"
                    }`}>
                      <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                        theme === "light"
                          ? "bg-slate-100 text-slate-900 border-r border-slate-200"
                          : "bg-[#28230b] text-[#d4c264] border-r border-[#4c4217]"
                      }`}>
                        00:45 M
                      </div>
                      <div className={`px-3 py-2 text-xs font-bold truncate ${
                        theme === "light" ? "text-slate-800" : "text-slate-200"
                      }`}>
                        Abdullahpur, Dhaka
                      </div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className={`text-[10px] font-bold block mb-1 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Destination
                    </label>
                    <div className={`flex items-center rounded-xl overflow-hidden border ${
                      theme === "light"
                        ? "bg-white border-slate-200"
                        : "bg-[#1d211c] border-[#2f352d]"
                    }`}>
                      <div className={`px-3 py-2 font-black text-xs shrink-0 ${
                        theme === "light"
                          ? "bg-slate-100 text-slate-900 border-r border-slate-200"
                          : "bg-[#0c2419] text-[#7be4aa] border-r border-[#164630]"
                      }`}>
                        01:20 H
                      </div>
                      <div className={`px-3 py-2 text-xs font-bold truncate ${
                        theme === "light" ? "text-slate-800" : "text-slate-200"
                      }`}>
                        {destination || "IUBAT University"}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stop Suggestions */}
                  <div>
                    <label className={`text-[10px] font-bold block mb-1.5 ${
                      theme === "light" ? "text-slate-500" : "text-slate-400"
                    }`}>
                      Quick Destination Stop
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {KNOWN_STOPS.slice(0, 4).map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => handleQuickSelect(stop.name, true)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                            destination === stop.name
                              ? theme === "light"
                                ? "bg-black text-white border-black"
                                : "bg-[#facc15] text-black border-[#facc15]"
                              : theme === "light"
                                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                                : "bg-[#1b1e1a] border-[#262a25] text-slate-300 hover:text-white"
                          }`}
                        >
                          {stop.name.split('(')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form Inputs (Current location & Destination) */}
                  <div className={`pt-2 border-t space-y-2.5 ${
                    theme === "light" ? "border-slate-200" : "border-[#242823]"
                  }`}>
                    <div>
                      <label className={`text-[10px] font-bold block mb-1 ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}>
                        Current location
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={startPoint}
                          onChange={(e) => setStartPoint(e.target.value)}
                          placeholder="Enter your current location"
                          className={`w-full rounded-xl px-3.5 py-2 pr-9 text-xs outline-none transition-all ${
                            theme === "light"
                              ? "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-black"
                              : "bg-[#121410] border border-[#2b2f28] text-white placeholder:text-slate-600 focus:border-[#facc15]"
                          }`}
                        />
                        <Crosshair 
                          onClick={onUseMyLocation}
                          className={`w-3.5 h-3.5 absolute right-3 top-2.5 cursor-pointer transition-colors ${
                            theme === "light" ? "text-slate-400 hover:text-black" : "text-slate-400 hover:text-[#facc15]"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-[10px] font-bold block mb-1 ${
                        theme === "light" ? "text-slate-500" : "text-slate-400"
                      }`}>
                        Destination
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter your destination"
                        className={`w-full rounded-xl px-3.5 py-2 text-xs outline-none transition-all ${
                          theme === "light"
                            ? "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-black"
                            : "bg-[#121410] border border-[#2b2f28] text-white placeholder:text-slate-600 focus:border-[#facc15]"
                        }`}
                      />
                    </div>

                    {/* Action Buttons: Enter & Reset */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={onEnter}
                        className={`font-black text-xs py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-center ${
                          theme === "light"
                            ? "bg-[#1a1a1a] hover:bg-black text-white"
                            : "bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20"
                        }`}
                      >
                        Enter
                      </button>
                      <button
                        onClick={onReset}
                        className={`font-bold text-xs py-2.5 rounded-xl border active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                          theme === "light"
                            ? "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
                            : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-300 hover:text-white"
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: BUS SCHEDULE VIEW (Dedicated Independent View) */}
          {activeTab === "schedule" && (
            <div className="pt-5">
              <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl ${
                theme === "light" ? "bg-white border-slate-200" : "bg-[#121411] border-[#262a25]"
              }`}>
                <BusSchedule theme={theme} />
              </div>
            </div>
          )}

          {/* TAB 3: CLASS SCHEDULE VIEW (Dedicated Independent View) */}
          {activeTab === "class" && (
            <div className="pt-5">
              <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl ${
                theme === "light" ? "bg-white border-slate-200" : "bg-[#121411] border-[#262a25]"
              }`}>
                <ClassSchedule theme={theme} />
              </div>
            </div>
          )}

          {/* TAB 4: DRIVER NAVIGATION COCKPIT (Embedded on Dashboard) */}
          {activeTab === "driver" && (
            <div className="pt-5">
              <DriverCockpit theme={theme} onBack={() => setActiveTab("dashboard")} />
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === "settings" && (
            <div className="pt-5">
              <Settings theme={theme} />
            </div>
          )}

          {/* TAB 4: SUPPORT */}
          {activeTab === "support" && (
            <div className="pt-10 max-w-lg mx-auto text-center space-y-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mx-auto ${
                theme === "light"
                  ? "bg-slate-100 border-slate-200 text-black"
                  : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
              }`}>
                <HelpCircle className="w-6 h-6" />
              </div>
              <h2 className={`text-xl font-black ${theme === "light" ? "text-slate-900" : "text-white"}`}>
                UBus Support & Dispatch Desk
              </h2>
              <p className={`text-xs leading-relaxed ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                Need immediate transit assistance or want to report a bus route delay? Contact the IUBAT Transport Division 24/7.
              </p>
              <div className={`border rounded-xl p-4 text-xs font-semibold space-y-1 ${
                theme === "light"
                  ? "bg-slate-50 border-slate-200 text-slate-800"
                  : "bg-[#161916] border-[#262a25] text-slate-300"
              }`}>
                <div>Email: transport@iubat.edu</div>
                <div>Helpline: +880 183000400 • Ext: 204</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
