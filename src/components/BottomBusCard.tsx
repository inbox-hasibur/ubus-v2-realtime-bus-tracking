"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, MapPin, Gauge, Users, Compass, Eye } from "lucide-react";

export interface BottomBusCardData {
  busNo: string;
  currentLocationName: string;
  nextStopName: string;
  etaToNext: string;
  destinationName: string;
  totalEta: string;
  speedKmh?: number;
  occupancy?: "seats_available" | "standing_only" | "full" | string;
  trafficLevel?: "smooth" | "moderate" | "congested";
  vehicleCount?: number;
}

interface BottomBusCardProps {
  data: BottomBusCardData;
  onExpandToggle?: () => void;
  onSelectBus?: () => void;
  theme?: "dark" | "light";
}

export default function BottomBusCard({
  data,
  onSelectBus,
  theme = "dark",
}: BottomBusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLight = theme === "light";

  return (
    <div className="w-full max-w-md mx-auto select-none transition-all duration-300">
      {/* --- Main Floating Bottom Card --- */}
      <div className={`backdrop-blur-xl border rounded-lg p-2.5 sm:p-3 shadow-xl transition-colors ${
        isLight
          ? "bg-white/95 border-slate-200 text-slate-900"
          : "bg-[#141613]/95 border-[#262a25] text-white"
      }`}>
        
        {/* Top Centered Collapse/Expand Handle (Chevron ^) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center -mt-0.5 mb-1.5 cursor-pointer group"
        >
          <div className={`w-8 h-3.5 rounded-md flex items-center justify-center transition-colors ${
            isLight ? "bg-slate-200 group-hover:bg-slate-300" : "bg-white/10 group-hover:bg-white/20"
          }`}>
            {isExpanded ? (
              <ChevronDown className={`w-3.5 h-3.5 ${isLight ? "text-slate-600" : "text-slate-300"}`} />
            ) : (
              <ChevronUp className={`w-3.5 h-3.5 ${isLight ? "text-slate-600" : "text-slate-300"}`} />
            )}
          </div>
        </div>

        {/* 1. Bus Current Location Row */}
        <div className="mb-1.5">
          <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}>
            <MapPin className="w-2.5 h-2.5 text-[#facc15]" />
            <span>Bus current location</span>
          </p>
          <div className={`flex items-center gap-2.5 border rounded-xl p-1.5 sm:p-2 ${
            isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
          }`}>
            {/* Yellow Square Bus Number Badge */}
            <div className="w-9 h-7 sm:h-8 rounded-lg bg-[#facc15] text-black font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {data.busNo || "12"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className={`text-xs sm:text-sm font-black truncate ${
                isLight ? "text-slate-900" : "text-slate-100"
              }`}>
                {data.currentLocationName || "Hossen Market, Tongi, Gazipur"}
              </p>
            </div>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          </div>
        </div>

        {/* 2. Estimated Time Row */}
        <div className="mb-1.5">
          <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}>
            Estimated time
          </p>
          <div className={`flex items-center gap-2.5 border rounded-xl p-1.5 sm:p-2 ${
            isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
          }`}>
            <div className={`px-2.5 h-7 sm:h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border ${
              isLight
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#2b0d0d] border-[#4a1818] text-[#fca5a5]"
            }`}>
              {data.etaToNext || "00:12 M"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className={`text-xs sm:text-sm font-bold truncate ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}>
                {data.nextStopName || "Cherag Ali, Tongi, Gazipur"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Destination Row */}
        <div>
          <p className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}>
            Destination
          </p>
          <div className={`flex items-center gap-2.5 border rounded-xl p-1.5 sm:p-2 ${
            isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
          }`}>
            <div className={`px-2.5 h-7 sm:h-8 rounded-lg font-black text-xs flex items-center justify-center shrink-0 border ${
              isLight
                ? "bg-white border-slate-200 text-slate-900"
                : "bg-[#2b0d0d] border-[#4a1818] text-[#fca5a5]"
            }`}>
              {data.totalEta || "00:12 M"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className={`text-xs sm:text-sm font-bold truncate ${
                isLight ? "text-slate-800" : "text-slate-200"
              }`}>
                {data.destinationName || "Kamarpara, IUBAT University"}
              </p>
            </div>
          </div>
        </div>

        {/* --- Expandable Drawer (Telemetry & Traffic Status) --- */}
        {isExpanded && (
          <div className={`mt-2.5 pt-2.5 border-t space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            isLight ? "border-slate-200" : "border-[#242823]"
          }`}>
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Live Speed */}
              <div className={`p-2 rounded-xl border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
              }`}>
                <div className={`flex items-center justify-center gap-1 text-[9px] font-bold mb-0.5 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Gauge className="w-3 h-3 text-sky-500" />
                  <span>Speed</span>
                </div>
                <p className={`text-xs font-black ${isLight ? "text-slate-900" : "text-white"}`}>
                  {data.speedKmh ?? 32} km/h
                </p>
              </div>

              {/* Occupancy */}
              <div className={`p-2 rounded-xl border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
              }`}>
                <div className={`flex items-center justify-center gap-1 text-[9px] font-bold mb-0.5 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Users className="w-3 h-3 text-amber-500" />
                  <span>Seats</span>
                </div>
                <p className="text-xs font-black text-amber-500">
                  {data.occupancy === "full"
                    ? "Bus Full"
                    : data.occupancy === "standing_only"
                    ? "Standing"
                    : "Seats Open"}
                </p>
              </div>

              {/* AI Traffic Vision */}
              <div className={`p-2 rounded-xl border ${
                isLight ? "bg-slate-100 border-slate-200" : "bg-[#1b1e1a] border-[#2f352d]"
              }`}>
                <div className={`flex items-center justify-center gap-1 text-[9px] font-bold mb-0.5 ${
                  isLight ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Eye className="w-3 h-3 text-emerald-500" />
                  <span>AI Flow</span>
                </div>
                <p className="text-xs font-black text-emerald-500">
                  {data.trafficLevel === "congested"
                    ? "Jam (Red)"
                    : data.trafficLevel === "moderate"
                    ? "Moderate"
                    : "Clear Flow"}
                </p>
              </div>
            </div>

            {onSelectBus && (
              <button
                onClick={onSelectBus}
                className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Track Bus #{data.busNo} Live</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
