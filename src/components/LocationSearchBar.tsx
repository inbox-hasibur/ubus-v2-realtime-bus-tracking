"use client";

import { useState } from "react";
import { MapPin, Navigation, ChevronDown, Check, Loader2 } from "lucide-react";

interface LocationSearchBarProps {
  currentStopName: string;
  onSelectStopName: (stopName: string, isDestination: boolean) => void;
  onEnter: () => void;
  isLoading?: boolean;
  theme?: "dark" | "light";
}

export default function LocationSearchBar({
  currentStopName,
  onSelectStopName,
  onEnter,
  isLoading = false,
  theme = "dark",
}: LocationSearchBarProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [mode, setMode] = useState<"current" | "destination">("current");
  const isLight = theme === "light";

  const popularStops = [
    "Cherag ali bus stand, Tongi, Gazipur",
    "Tongi Station Road, Gazipur",
    "Hossen Market, Tongi, Gazipur",
    "Abdullahpur Bus Stand, Uttara",
    "House Building, Uttara Sector 7",
    "Azampur, Uttara Sector 3",
    "Airport Roundabout, Dhaka",
    "Kamarpara, IUBAT University",
    "IUBAT Campus (Main Gate)",
  ];

  return (
    <div className="relative w-full max-w-md mx-auto select-none">
      {/* --- Search Bar Container --- */}
      <div className={`backdrop-blur-xl border rounded-lg p-1.5 sm:p-2 shadow-xl flex items-center gap-2 transition-colors ${
        isLight
          ? "bg-white/95 border-slate-200 text-slate-900"
          : "bg-[#141613]/95 border-[#262a25] text-white"
      }`}>
        
        {/* Left Target Pin Button / Indicator */}
        <div 
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className={`flex items-center gap-1.5 pl-1.5 sm:pl-2 cursor-pointer transition-colors shrink-0 ${
            isLight ? "text-slate-600 hover:text-slate-900" : "text-slate-300 hover:text-white"
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
            <Navigation className="w-3 h-3 text-[#facc15]" />
          </div>
          <span className={`hidden sm:inline text-[10px] font-bold uppercase tracking-tight ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}>
            {mode === "current" ? "Current location" : "Destination"}
          </span>
        </div>

        {/* Selected Location Selector / Input */}
        <div 
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className={`flex-1 flex items-center justify-between border rounded-xl px-2.5 py-2 cursor-pointer transition-all min-w-0 ${
            isLight
              ? "bg-slate-100 border-slate-200 hover:border-slate-300"
              : "bg-[#1b1e1a] border-[#2f352d] hover:border-[#3d453a]"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className={`text-xs font-bold truncate ${
              isLight ? "text-slate-800" : "text-slate-100"
            }`}>
              {currentStopName || "Cherag ali bus stand, Tongi, Gazipur"}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </div>

        {/* Right: Enter Button */}
        <button
          onClick={onEnter}
          disabled={isLoading}
          className={`disabled:opacity-50 font-black text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg active:scale-95 transition-all shrink-0 flex items-center gap-1.5 ${
            isLight
              ? "bg-[#1a1a1a] hover:bg-black text-white shadow-slate-900/15"
              : "bg-[#facc15] hover:bg-[#eab308] text-black shadow-yellow-500/20"
          }`}
        >
          {isLoading ? (
            <Loader2 className={`w-3.5 h-3.5 animate-spin ${isLight ? "text-white" : "text-black"}`} />
          ) : (
            <span>Enter</span>
          )}
        </button>
      </div>

      {/* --- Popover Dropdown --- */}
      {isOpenDropdown && (
        <div className={`absolute top-full mt-2 left-0 right-0 z-50 backdrop-blur-xl border rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 ${
          isLight
            ? "bg-white/95 border-slate-200 text-slate-900"
            : "bg-[#161916]/95 border-[#262a25] text-white"
        }`}>
          {/* Mode Switcher */}
          <div className={`grid grid-cols-2 gap-2 mb-3 pb-2 border-b ${
            isLight ? "border-slate-200" : "border-[#242823]"
          }`}>
            <button
              onClick={() => setMode("current")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                mode === "current"
                  ? "bg-[#facc15] text-black shadow-sm font-black"
                  : isLight
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-[#1b1e1a] text-slate-300 hover:bg-[#252a23]"
              }`}
            >
              Current location
            </button>
            <button
              onClick={() => setMode("destination")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                mode === "destination"
                  ? "bg-[#facc15] text-black shadow-sm font-black"
                  : isLight
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-[#1b1e1a] text-slate-300 hover:bg-[#252a23]"
              }`}
            >
              Destination location
            </button>
          </div>

          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">
            Select Transit Stop
          </p>

          {/* List of stops */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {popularStops.map((stop, i) => {
              const isSelected = currentStopName === stop;
              return (
                <div
                  key={i}
                  onClick={() => {
                    onSelectStopName(stop, mode === "destination");
                    setIsOpenDropdown(false);
                  }}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    isSelected
                      ? isLight
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                      : isLight
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="truncate">{stop}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
