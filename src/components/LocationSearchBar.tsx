"use client";

import { useState } from "react";
import { MapPin, Navigation, ChevronDown, Check, Loader2 } from "lucide-react";

interface LocationSearchBarProps {
  currentStopName: string;
  onSelectStopName: (stopName: string, isDestination: boolean) => void;
  onEnter: () => void;
  isLoading?: boolean;
}

export default function LocationSearchBar({
  currentStopName,
  onSelectStopName,
  onEnter,
  isLoading = false,
}: LocationSearchBarProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [mode, setMode] = useState<"current" | "destination">("current");

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
      {/* --- Search Bar Container (Matching Video 00:11) --- */}
      <div className="bg-[#141613]/95 backdrop-blur-xl border border-[#262a25] rounded-2xl p-1.5 sm:p-2 shadow-2xl flex items-center gap-2 text-white">
        
        {/* Left Target Pin Button / Indicator */}
        <div 
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className="flex items-center gap-1.5 pl-2 cursor-pointer text-slate-300 hover:text-white transition-colors shrink-0"
        >
          <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
            <Navigation className="w-3 h-3 text-[#facc15]" />
          </div>
          <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-tight">
            {mode === "current" ? "Current location" : "Destination"}
          </span>
        </div>

        {/* Selected Location Selector / Input */}
        <div 
          onClick={() => setIsOpenDropdown(!isOpenDropdown)}
          className="flex-1 flex items-center justify-between bg-[#1b1e1a] border border-[#2f352d] rounded-xl px-2.5 py-2 cursor-pointer hover:border-[#3d453a] transition-all min-w-0"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-100 truncate">
              {currentStopName || "Cherag ali bus stand, Tongi, Gazipur"}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </div>

        {/* Right: Enter Yellow Button */}
        <button
          onClick={onEnter}
          disabled={isLoading}
          className="bg-[#facc15] hover:bg-[#eab308] disabled:opacity-50 text-black font-black text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <span>Enter</span>
          )}
        </button>
      </div>

      {/* --- Popover Dropdown (Matching Video 00:35) --- */}
      {isOpenDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 bg-[#161916]/95 backdrop-blur-xl border border-[#262a25] rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 mb-3 pb-2 border-b border-[#242823]">
            <button
              onClick={() => setMode("current")}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                mode === "current"
                  ? "bg-[#facc15] text-black shadow-sm font-black"
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
                      ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                      : "text-slate-200 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-yellow-400" : "text-slate-500"}`} />
                    <span className="truncate">{stop}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
