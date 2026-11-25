"use client";

import { Map, Bus, Calendar, Settings, Navigation } from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCenterTrack: () => void;
  theme?: "dark" | "light";
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  onCenterTrack,
  theme = "dark",
}: MobileBottomNavProps) {
  const isLight = theme === "light";

  const itemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-xl transition-all active:scale-95 ${
      isActive
        ? isLight
          ? "text-slate-950 font-black"
          : "text-[#facc15] font-black"
        : isLight
          ? "text-slate-400 hover:text-slate-700 font-semibold"
          : "text-slate-500 hover:text-slate-200 font-semibold"
    }`;

  return (
    <nav
      className={`md:hidden shrink-0 w-full border-t px-2 pt-1.5 pb-2 grid grid-cols-5 items-center relative z-30 select-none transition-colors ${
        isLight
          ? "bg-white/95 backdrop-blur-xl border-slate-200 shadow-[0_-4px_20px_rgba(15,23,42,0.06)]"
          : "bg-[#121411]/95 backdrop-blur-xl border-[#242823] shadow-[0_-4px_24px_rgba(0,0,0,0.45)]"
      }`}
    >
      {/* 1. Live Map */}
      <button
        type="button"
        onClick={() => setActiveTab("dashboard")}
        className={itemClass(activeTab === "dashboard")}
      >
        <Map className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] leading-none">Map</span>
      </button>

      {/* 2. Bus Schedule */}
      <button
        type="button"
        onClick={() => setActiveTab("schedule")}
        className={itemClass(activeTab === "schedule")}
      >
        <Bus className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] leading-none">Buses</span>
      </button>

      {/* 3. Center Raised Track FAB */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            setActiveTab("dashboard");
            onCenterTrack();
          }}
          title="Track Near Me"
          className={`-mt-6 w-12 h-12 rounded-full bg-gradient-to-tr from-[#eab308] to-[#facc15] text-black flex items-center justify-center shadow-lg shadow-yellow-500/30 border-4 active:scale-95 transition-transform ${
            isLight ? "border-white" : "border-[#121411]"
          }`}
        >
          <Navigation className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Class Schedule */}
      <button
        type="button"
        onClick={() => setActiveTab("class")}
        className={itemClass(activeTab === "class")}
      >
        <Calendar className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] leading-none">Classes</span>
      </button>

      {/* 5. Settings */}
      <button
        type="button"
        onClick={() => setActiveTab("settings")}
        className={itemClass(activeTab === "settings")}
      >
        <Settings className="w-5 h-5 stroke-[2.2]" />
        <span className="text-[10px] leading-none">Settings</span>
      </button>
    </nav>
  );
}
