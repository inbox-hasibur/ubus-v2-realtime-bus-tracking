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
}

export default function BottomBusCard({
  data,
  onSelectBus,
}: BottomBusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto select-none transition-all duration-300">
      {/* --- Main Floating Bottom Card (Exact Replica of Video 00:24-00:30) --- */}
      <div className="bg-[#141613]/95 backdrop-blur-xl border border-[#262a25] rounded-2xl p-3 sm:p-4 shadow-2xl text-white">
        
        {/* Top Centered Collapse/Expand Handle (Chevron ^) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center -mt-1 mb-2 cursor-pointer group"
        >
          <div className="w-8 h-3.5 rounded-md bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
            )}
          </div>
        </div>

        {/* 1. Bus Current Location Row */}
        <div className="mb-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 text-[#facc15]" />
            <span>Bus current location</span>
          </p>
          <div className="flex items-center gap-2.5 bg-[#1b1e1a] border border-[#2f352d] rounded-xl p-1.5 sm:p-2">
            {/* Yellow Square Bus Number Badge */}
            <div className="w-9 h-8 rounded-lg bg-[#facc15] text-black font-black text-xs flex items-center justify-center shrink-0 shadow-md">
              {data.busNo || "12"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                {data.currentLocationName || "Hossen Market, Tongi, Gazipur"}
              </p>
            </div>
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          </div>
        </div>

        {/* 2. Estimated Time Row */}
        <div className="mb-2">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Estimated time
          </p>
          <div className="flex items-center gap-2.5 bg-[#1b1e1a] border border-[#2f352d] rounded-xl p-1.5 sm:p-2">
            {/* Dark Maroon / Red Badge */}
            <div className="px-2.5 h-8 rounded-lg bg-[#2b0d0d] border border-[#4a1818] text-[#fca5a5] font-black text-xs flex items-center justify-center shrink-0">
              {data.etaToNext || "00:12 M"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                {data.nextStopName || "Cherag Ali, Tongi, Gazipur"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Destination Row */}
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Destination
          </p>
          <div className="flex items-center gap-2.5 bg-[#1b1e1a] border border-[#2f352d] rounded-xl p-1.5 sm:p-2">
            {/* Dark Maroon / Red Badge */}
            <div className="px-2.5 h-8 rounded-lg bg-[#2b0d0d] border border-[#4a1818] text-[#fca5a5] font-black text-xs flex items-center justify-center shrink-0">
              {data.totalEta || "00:12 M"}
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                {data.destinationName || "Kamarpara, IUBAT University"}
              </p>
            </div>
          </div>
        </div>

        {/* --- Expandable Drawer (Telemetry & Traffic Status) --- */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-[#242823] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Live Speed */}
              <div className="bg-[#1b1e1a] p-2 rounded-xl border border-[#2f352d]">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 mb-0.5">
                  <Gauge className="w-3 h-3 text-sky-400" />
                  <span>Speed</span>
                </div>
                <p className="text-xs font-black text-white">{data.speedKmh ?? 32} km/h</p>
              </div>

              {/* Occupancy */}
              <div className="bg-[#1b1e1a] p-2 rounded-xl border border-[#2f352d]">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 mb-0.5">
                  <Users className="w-3 h-3 text-[#facc15]" />
                  <span>Seats</span>
                </div>
                <p className="text-xs font-black text-[#facc15]">
                  {data.occupancy === "full"
                    ? "Bus Full"
                    : data.occupancy === "standing_only"
                    ? "Standing"
                    : "Seats Open"}
                </p>
              </div>

              {/* AI Traffic Vision */}
              <div className="bg-[#1b1e1a] p-2 rounded-xl border border-[#2f352d]">
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-400 mb-0.5">
                  <Eye className="w-3 h-3 text-green-400" />
                  <span>AI Flow</span>
                </div>
                <p className="text-xs font-black text-green-400">
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
