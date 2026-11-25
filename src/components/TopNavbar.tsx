"use client";

import { useState, useEffect } from "react";
import { Bus, ChevronDown, ChevronUp, Clock, Calendar, Bell, Sun, Moon } from "lucide-react";
import { signOutUser } from "@/lib/supabase";

interface TopNavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTrackNow?: () => void;
  onOpenDriver?: () => void;
  onOpenAuth?: (mode: "login" | "signup") => void;
  onOpenNotices?: () => void;
}

export default function TopNavbar({
  activeTab,
  setActiveTab,
  onTrackNow,
  onOpenDriver,
  onOpenAuth,
  onOpenNotices,
}: TopNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navTheme, setNavTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setNavTheme(custom.detail);
    };
    window.addEventListener("set-map-theme", handleThemeChange);
    window.addEventListener("set-app-theme", handleThemeChange);
    return () => {
      window.removeEventListener("set-map-theme", handleThemeChange);
      window.removeEventListener("set-app-theme", handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = navTheme === "dark" ? "light" : "dark";
    setNavTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("ubus_theme", next);
      window.dispatchEvent(new CustomEvent("set-map-theme", { detail: next }));
      window.dispatchEvent(new CustomEvent("set-app-theme", { detail: next }));
    }
  };

  const isLight = navTheme === "light";

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("student_id");
    }
    return null;
  });
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const currentTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const currentDate = now
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  const handleNav = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    window.location.reload();
  };

  const userInitials = currentUser
    ? currentUser
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "MM";

  return (
    <>
      {/* --- Top Navigation Header Bar (Elevated) --- */}
      <header className={`sticky top-0 z-50 w-full border-b px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between select-none transition-colors duration-200 ${
        isLight
          ? "bg-white/95 backdrop-blur-md border-slate-200 text-slate-900 shadow-md shadow-slate-900/5"
          : "bg-[#0e100f]/95 backdrop-blur-md border-[#242823] text-white shadow-lg shadow-black/40"
      }`}>
        
        {/* Left: Brand Logo (Always links directly to Live Map) */}
        <div
          onClick={() => handleNav("dashboard")}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#facc15] to-[#eab308] flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition-transform">
            <Bus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className={`font-black text-lg tracking-tight group-hover:text-amber-500 transition-colors ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            UBus
          </span>
          <span className={`hidden sm:inline text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
            isLight ? "bg-amber-100 border-amber-200 text-amber-700" : "bg-[#1c201a] border-[#2c3327] text-amber-400"
          }`}>
            Realtime
          </span>
        </div>

        {/* Center Desktop Navigation Links */}
        <nav className={`hidden lg:flex items-center gap-6 text-xs font-bold ${
          isLight ? "text-slate-600" : "text-slate-300"
        }`}>
          <button
            onClick={() => handleNav("dashboard")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "dashboard"
                ? isLight
                  ? "bg-slate-100 text-slate-950 font-black border border-slate-300"
                  : "bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]"
                : isLight ? "hover:text-black" : "hover:text-[#facc15]"
            }`}
          >
            Live Map
          </button>
          <button
            onClick={() => handleNav("schedule")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "schedule"
                ? isLight
                  ? "bg-slate-100 text-slate-950 font-black border border-slate-300"
                  : "bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]"
                : isLight ? "hover:text-black" : "hover:text-[#facc15]"
            }`}
          >
            Bus Schedule
          </button>
          <button
            onClick={() => handleNav("class")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "class"
                ? isLight
                  ? "bg-slate-100 text-slate-950 font-black border border-slate-300"
                  : "bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]"
                : isLight ? "hover:text-black" : "hover:text-[#facc15]"
            }`}
          >
            Class Schedule
          </button>
          <button
            onClick={() => handleNav("about")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "about"
                ? isLight
                  ? "bg-slate-100 text-slate-950 font-black border border-slate-300"
                  : "bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]"
                : isLight ? "hover:text-black" : "hover:text-[#facc15]"
            }`}
          >
            About & Team
          </button>
          <button
            onClick={() => {
              if (onOpenDriver) onOpenDriver();
              else handleNav("driver");
            }}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "driver"
                ? isLight
                  ? "bg-slate-100 text-slate-950 font-black border border-slate-300"
                  : "bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]"
                : isLight ? "text-amber-700 hover:bg-amber-50" : "text-amber-400 hover:text-amber-300 hover:bg-[#1a1d18]"
            }`}
          >
            Driver App
          </button>
        </nav>

        {/* Center Mobile Pill Switcher (from Frame 69.png) */}
        <div className="flex lg:hidden items-center gap-1.5">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md border ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                : "bg-[#1b1e1a] hover:bg-[#252a23] border-[#2f352d] text-slate-200"
            }`}
          >
            <span>menu</span>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform duration-300 ${
              isMenuOpen ? "rotate-180" : ""
            } ${isLight ? "bg-slate-200" : "bg-white/10"}`}>
              <ChevronDown className="w-2.5 h-2.5 text-yellow-500" />
            </div>
          </button>

          {/* Quick theme toggle for mobile header */}
          <button
            onClick={toggleTheme}
            title="Toggle Light / Dark Mode"
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              isLight
                ? "bg-slate-100 border-slate-300 text-indigo-600 hover:bg-slate-200"
                : "bg-[#171a16] border-[#262a25] text-[#facc15] hover:bg-[#252a23]"
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Section: Status Badges, Profile & Auth Triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Quick Map Button */}
          <button
            onClick={() => {
              if (activeTab !== "dashboard") handleNav("dashboard");
              else if (onTrackNow) onTrackNow();
            }}
            className="lg:hidden bg-[#facc15] hover:bg-[#eab308] text-black font-black text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-md shadow-yellow-500/20 active:scale-95 transition-transform"
          >
            <Bus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>MAP</span>
          </button>

          {/* Compact Mobile Auth Trigger when logged out */}
          {!currentUser && (
            <button
              onClick={() => onOpenAuth?.("login")}
              className={`sm:hidden text-[11px] font-bold px-2 py-1.5 rounded-xl border transition-colors ${
                isLight
                  ? "border-slate-300 text-slate-700 hover:text-black bg-slate-100"
                  : "border-[#262a25] text-slate-200 hover:text-white bg-[#171a16]"
              }`}
            >
              Sign in
            </button>
          )}

          {/* Desktop Status Indicators */}
          <div className="hidden lg:flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
              isLight ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-[#171a16] border-[#262a25] text-slate-200"
            }`}>
              <Clock className="w-3.5 h-3.5 text-[#facc15]" />
              <span>{currentTime}</span>
            </div>

            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
              isLight ? "bg-slate-100 border-slate-200 text-slate-800" : "bg-[#171a16] border-[#262a25] text-slate-200"
            }`}>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentDate}</span>
            </div>

            {/* Desktop Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${isLight ? "Dark" : "Light"} Mode`}
              className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200"
                  : "bg-[#171a16] border-[#262a25] text-[#facc15] hover:bg-[#252a23]"
              }`}
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onOpenNotices?.()}
              title="Campus Transit Notices & Alerts"
              className={`relative w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors active:scale-95 border ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-700 hover:text-amber-600"
                  : "bg-[#171a16] border-[#262a25] text-slate-300 hover:text-[#facc15]"
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#facc15]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#facc15] rounded-full animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#facc15] rounded-full" />
            </button>
          </div>

          {/* User Profile or Login Trigger */}
          {currentUser ? (
            <div className={`hidden sm:flex items-center gap-2 pl-2 border-l ${
              isLight ? "border-slate-200" : "border-[#242823]"
            }`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#facc15] to-[#eab308] flex items-center justify-center text-black font-black text-xs border border-white/20 shadow-sm">
                {userInitials}
              </div>
              <span className={`hidden xl:inline text-xs font-bold truncate max-w-[120px] ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}>
                {currentUser}
              </span>
              <button
                onClick={handleSignOut}
                title="Log Out"
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                    : "bg-[#171a16] hover:bg-[#252a23] border-[#262a25] text-[#facc15]"
                }`}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => onOpenAuth?.("login")}
                className={`text-xs font-bold px-2 py-1 transition-colors ${
                  isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => onOpenAuth?.("signup")}
                className="bg-[#facc15] hover:bg-[#eab308] text-black text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md shadow-yellow-500/20 active:scale-95 transition-all"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </header>

      {/* --- Mobile Drawer (Theme-aware) --- */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col items-center justify-start pt-3 px-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm border rounded-2xl p-4 shadow-2xl flex flex-col space-y-3 relative ${
              isLight
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#161916] border-[#262a25] text-white"
            }`}
          >
            {/* Top Bar of Drawer */}
            <div className={`flex items-center justify-between pb-2 border-b px-1 ${
              isLight ? "border-slate-200" : "border-[#242823]"
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#facc15] flex items-center justify-center text-black">
                  <Bus className="w-3.5 h-3.5" />
                </div>
                <span className={`font-black text-sm ${isLight ? "text-slate-900" : "text-white"}`}>UBus</span>
              </div>

              <span className="text-xs font-bold text-slate-400">navigation</span>

              <div className="flex items-center gap-2">
                {currentUser ? (
                  <button
                    onClick={handleSignOut}
                    className={`text-xs font-bold hover:underline ${isLight ? "text-amber-600" : "text-[#facc15]"}`}
                  >
                    Log Out
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuth?.("login");
                      }}
                      className={`text-xs font-bold ${isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"}`}
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuth?.("signup");
                      }}
                      className="bg-[#facc15] text-black font-black text-xs px-3 py-1 rounded-lg"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Big Main Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleNav("dashboard")}
                className={`w-full py-2.5 border rounded-xl text-xs font-black tracking-widest uppercase transition-colors ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                    : "bg-[#1d211c] hover:bg-[#252a23] border-[#2f352d] text-slate-100"
                }`}
              >
                LIVE MAP
              </button>
              <button
                onClick={() => handleNav("schedule")}
                className={`w-full py-2.5 border rounded-xl text-xs font-black tracking-widest uppercase transition-colors ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                    : "bg-[#1d211c] hover:bg-[#252a23] border-[#2f352d] text-slate-100"
                }`}
              >
                BUS SCHEDULE
              </button>
              <button
                onClick={() => handleNav("class")}
                className={`w-full py-2.5 border rounded-xl text-xs font-black tracking-widest uppercase transition-colors ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                    : "bg-[#1d211c] hover:bg-[#252a23] border-[#2f352d] text-slate-100"
                }`}
              >
                CLASS SCHEDULE
              </button>
              <button
                onClick={() => handleNav("about")}
                className={`w-full py-2.5 border rounded-xl text-xs font-black tracking-widest uppercase transition-colors ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900"
                    : "bg-[#1d211c] hover:bg-[#252a23] border-[#2f352d] text-slate-100"
                }`}
              >
                ABOUT & TEAM
              </button>
            </div>

            {/* Feature Menu Sub-block */}
            <div className={`border rounded-xl p-3 text-center space-y-2 ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#121411] border-[#262a25]"
            }`}>
              <p className={`text-xs font-black tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Feature Menu</p>
              <div className="w-8 h-0.5 bg-[#facc15] mx-auto rounded-full mb-2" />

              <div className="space-y-1.5 text-xs font-bold">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onOpenDriver) onOpenDriver();
                    else handleNav("driver");
                  }}
                  className={`w-full py-1 flex items-center justify-center gap-1.5 ${
                    isLight ? "text-amber-600 hover:text-amber-700" : "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  <Bus className="w-3.5 h-3.5" />
                  <span>Driver Companion App</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenNotices?.();
                  }}
                  className={`w-full py-1 flex items-center justify-center gap-1.5 ${
                    isLight ? "text-slate-700 hover:text-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>Notices & Alerts</span>
                </button>
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMenuOpen(false);
                  }}
                  className={`w-full py-1 flex items-center justify-center gap-1.5 transition-colors ${
                    isLight ? "text-slate-700 hover:text-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-500" /> : <Sun className="w-3.5 h-3.5 text-[#facc15]" />}
                  <span>{isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}</span>
                </button>
                <button
                  onClick={() => handleNav("settings")}
                  className={`w-full py-1 transition-colors ${
                    activeTab === "settings"
                      ? isLight ? "text-amber-600 font-black" : "text-[#facc15] font-black"
                      : isLight ? "text-slate-700 hover:text-black" : "text-slate-300 hover:text-white"
                  }`}
                >
                  Settings & Preferences
                </button>
              </div>
            </div>

            {/* Bottom Circular Chevron ^ */}
            <div
              onClick={() => setIsMenuOpen(false)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center mx-auto cursor-pointer transition-colors ${
                isLight
                  ? "bg-slate-100 border-slate-300 text-slate-600 hover:text-black hover:bg-slate-200"
                  : "bg-[#1b1e1a] border-[#2f352d] text-slate-300 hover:text-white hover:bg-[#252a23]"
              }`}
            >
              <ChevronUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
