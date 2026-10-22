"use client";

import { Navigation2, RotateCcw, MapPin, Bus, Compass, Loader2 } from "lucide-react";
import { PanelCard, InfoBlock } from "@/components/DashboardUI";
import { KNOWN_STOPS } from "@/lib/routing";

export interface JourneyInfo {
  currentLocation: string;
  nextStop: string;
  finalDestination: string;
  eta: string;
  distanceKm?: number;
  trafficLevel?: 'smooth' | 'moderate' | 'congested';
  trafficLabel?: string;
  trafficColor?: string;
  nearestBus?: string;
}

interface RightPanelProps {
  isOpen: boolean;
  currentLocation?: string | null;
  startPoint: string;
  setStartPoint: (value: string) => void;
  destination: string;
  setDestination: (value: string) => void;
  journeyInfo: JourneyInfo;
  isNavigating?: boolean;
  isLoadingRoute?: boolean;
  onStart: () => void;
  onReset: () => void;
  onUseMyLocation?: () => void;
}

export default function RightPanel({
  isOpen,
  currentLocation,
  startPoint,
  setStartPoint,
  destination,
  setDestination,
  journeyInfo,
  isNavigating = false,
  isLoadingRoute = false,
  onStart,
  onReset,
  onUseMyLocation,
}: RightPanelProps) {
  return (
    <div className={`absolute top-16 right-3 left-3 sm:left-auto sm:top-20 sm:right-4 w-auto sm:w-[340px] space-y-3 z-30 transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
      
      {/* Live Estimated Travel Time Card */}
      <PanelCard title="Live Estimated Travel Time">
        <div className="flex flex-col bg-[#121410] rounded-xl overflow-hidden shadow-lg border border-[#262a25]">
          <div className="flex">
            <div className="flex-1 p-3.5 text-center border-r border-[#242823] bg-[#121410]">
              <p className="text-xl font-black text-white tracking-tight">{journeyInfo.eta}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {journeyInfo.distanceKm ? `${journeyInfo.distanceKm} km trip` : "Estimated ETA"}
              </p>
            </div>
            <div className="flex-1 p-3 text-center flex flex-col items-center justify-center bg-[#1b1e1a]">
              <p className="text-xs font-black text-slate-200 uppercase tracking-wider truncate max-w-[130px]">
                {journeyInfo.finalDestination}
              </p>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Destination</span>
            </div>
          </div>

          {/* Live Traffic Condition Bar */}
          {journeyInfo.trafficLabel && (
            <div className="px-3 py-1.5 bg-[#0e100f] border-t border-[#242823] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: journeyInfo.trafficColor || '#22c55e' }}
                />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                  Traffic: {journeyInfo.trafficLabel}
                </span>
              </div>
              {isNavigating && (
                <span className="text-[8px] font-black text-[#facc15] bg-[#28230b] px-2 py-0.5 rounded-md border border-[#4c4217]">
                  ACTIVE ROUTE
                </span>
              )}
            </div>
          )}
        </div>
      </PanelCard>

      {/* Live Travel Information Card */}
      <PanelCard title="Live Travel Information">
        <div className="space-y-2">
          <InfoBlock 
            label="Current Location / Origin" 
            value={journeyInfo.currentLocation} 
          />
          <InfoBlock 
            label="Nearest Active Bus" 
            value={journeyInfo.nearestBus || "Searching active buses..."} 
            subValue={journeyInfo.nextStop}
          />
          <InfoBlock 
            label="Destination" 
            value={journeyInfo.finalDestination} 
            subValue={journeyInfo.eta} 
          />
        </div>
      </PanelCard>

      {/* Input Action Card (Exact Figma Dark Theme) */}
      <div className="bg-[#161916] p-4 rounded-xl shadow-2xl border border-[#262a25] space-y-3 text-white">
        
        {/* Start Point Input with Quick GPS locator */}
        <div className="relative group">
          <div className="flex items-center justify-between mb-1 ml-0.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Point</label>
            {onUseMyLocation && (
              <button 
                type="button" 
                onClick={onUseMyLocation}
                className="text-[9px] font-bold text-[#facc15] hover:underline flex items-center gap-1 uppercase tracking-tight"
              >
                <Compass className="w-3 h-3" /> Use My GPS
              </button>
            )}
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder={currentLocation ?? "Enter start or 'My Location'..."} 
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              className="w-full bg-[#121410] text-white text-xs font-bold p-2.5 pr-9 rounded-xl outline-none placeholder:text-slate-600 border border-[#262a25] focus:border-[#facc15] transition-all" 
            />
            <Navigation2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 group-focus-within:text-[#facc15]" />
          </div>
        </div>
         
        {/* Destination Input */}
        <div className="relative">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5 mb-1 block">Destination</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="e.g. IUBAT Campus, Abdullahpur..." 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-[#121410] text-white text-xs font-bold p-2.5 pr-9 rounded-xl outline-none placeholder:text-slate-600 border border-[#262a25] focus:border-[#facc15] transition-all" 
            />
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 group-focus-within:text-[#facc15]" />
          </div>
        </div>

        {/* Quick University Stop Selector Chips */}
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5 mb-1.5 block">
            Popular Campus Stops:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {KNOWN_STOPS.slice(0, 5).map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => setDestination(stop.name)}
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                  destination === stop.name
                    ? 'bg-[#facc15] text-black border-[#facc15] shadow-sm font-black'
                    : 'bg-[#1b1e1a] text-slate-300 border-[#2f352d] hover:bg-[#252a23]'
                }`}
              >
                {stop.name.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button 
            type="button"
            onClick={onStart}
            disabled={isLoadingRoute}
            className="flex-1 bg-[#facc15] hover:bg-[#eab308] text-black py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
            {isLoadingRoute ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Routing...</span>
              </>
            ) : (
              <>
                <Bus className="w-3.5 h-3.5" />
                <span>{isNavigating ? 'Update Route' : 'Start Navigation'}</span>
              </>
            )}
          </button>
          <button 
            type="button"
            onClick={onReset}
            title="Reset Navigation"
            className="bg-[#1b1e1a] hover:bg-[#252a23] text-slate-300 hover:text-white border border-[#2f352d] px-3 py-2.5 rounded-xl shadow-sm active:scale-95 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}