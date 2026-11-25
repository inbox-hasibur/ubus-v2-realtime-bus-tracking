"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Play, 
  Square, 
  Users, 
  AlertTriangle, 
  ArrowLeft, 
  Activity, 
  Gauge, 
  Bus as BusIcon,
  ShieldAlert,
  Plus,
  Minus,
  MapPin
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BusOption {
  id: string;
  bus_no: string;
  route_name: string;
  driver_name?: string;
  status?: string;
}

type CapacityLevel = "seats_available" | "standing_only" | "full";

const ROUTE_STOPS_TIMELINE = [
  { name: "Cherag Ali Bus Stand", dist: "0.0 km", eta: "Departs" },
  { name: "Tongi Station Road", dist: "1.2 km", eta: "3 mins" },
  { name: "Abdullahpur Bus Stand", dist: "2.8 km", eta: "7 mins" },
  { name: "House Building (Uttara)", dist: "4.1 km", eta: "11 mins" },
  { name: "Kamarpara Bus Stand", dist: "5.5 km", eta: "15 mins" },
  { name: "IUBAT Campus Main Gate", dist: "6.8 km", eta: "18 mins" },
];

interface DriverCockpitProps {
  theme?: "dark" | "light";
  onBack?: () => void;
}

export default function DriverCockpit({ theme = "dark", onBack }: DriverCockpitProps) {
  const isLight = theme === "light";

  // Fleet & Trip states
  const [buses, setBuses] = useState<BusOption[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>("");
  const [isTripActive, setIsTripActive] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>({ lat: 23.9005, lng: 90.4005 });
  const [capacity, setCapacity] = useState<CapacityLevel>("seats_available");
  const [passengerCount, setPassengerCount] = useState<number>(32);
  const [lastTransmitTime, setLastTransmitTime] = useState<string>("Standby");
  const [packetCount, setPacketCount] = useState<number>(0);
  const [incidentMessage, setIncidentMessage] = useState<string | null>(null);
  const [isSosActive, setIsSosActive] = useState(false);
  const [currentStopIdx, setCurrentStopIdx] = useState(0);

  // Live Trip Stopwatch
  const [tripSeconds, setTripSeconds] = useState(0);

  useEffect(() => {
    if (!isTripActive) return;
    const interval = setInterval(() => {
      setTripSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTripActive]);

  const formatStopwatch = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const [driverName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("student_id") || "Hasibur Rahman";
    }
    return "Hasibur Rahman";
  });

  const watchIdRef = useRef<number | null>(null);
  const transmitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available buses on load
  useEffect(() => {
    const fetchBuses = async () => {
      const { data } = await supabase.from("buses").select("*").order("bus_no");
      if (data && data.length > 0) {
        setBuses(data);
        const savedBusId = localStorage.getItem("driver_bus_id");
        if (savedBusId && data.some((b) => b.id === savedBusId)) {
          setSelectedBusId(savedBusId);
        } else {
          setSelectedBusId(data[0].id);
        }
      } else {
        const fallbackBuses: BusOption[] = [
          { id: "12", bus_no: "12", route_name: "Tongi - IUBAT Campus", driver_name: "Hasibur Rahman" },
          { id: "07", bus_no: "07", route_name: "Abdullahpur - IUBAT Campus", driver_name: "Rafiqul Islam" },
          { id: "04", bus_no: "04", route_name: "House Building - IUBAT Campus", driver_name: "Abdul Karim" },
          { id: "19", bus_no: "19", route_name: "Station Road - IUBAT Campus", driver_name: "Kabir Hossain" },
        ];
        setBuses(fallbackBuses);
        setSelectedBusId(fallbackBuses[0].id);
      }
    };
    fetchBuses();
  }, []);

  const selectedBus = buses.find((b) => b.id === selectedBusId) || buses[0];

  const handleSelectBus = (id: string) => {
    setSelectedBusId(id);
    localStorage.setItem("driver_bus_id", id);
  };

  // Transmit telemetry to backend API
  const transmitTelemetry = useCallback(async (lat: number, lng: number, speed: number) => {
    if (!selectedBus) return;

    try {
      const res = await fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bus_no: selectedBus.bus_no,
          latitude: lat,
          longitude: lng,
          speed: speed,
        }),
      });

      if (res.ok) {
        setLastTransmitTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setPacketCount((c) => c + 1);
      }
    } catch (e) {
      console.warn("Telemetry transmit failed:", e);
    }
  }, [selectedBus]);

  // Start Trip
  const startTrip = () => {
    setTripSeconds(0);
    setIsTripActive(true);

    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speedKmh = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 34;
          setCurrentCoords({ lat, lng });
          setCurrentSpeed(speedKmh);
          transmitTelemetry(lat, lng, speedKmh);
        },
        () => {
          // Fallback simulation near Tongi corridor
          const fallbackLat = 23.9005;
          const fallbackLng = 90.4005;
          setCurrentCoords({ lat: fallbackLat, lng: fallbackLng });
          setCurrentSpeed(36);
          transmitTelemetry(fallbackLat, fallbackLng, 36);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      watchIdRef.current = id;
    }

    // Heartbeat simulation
    transmitIntervalRef.current = setInterval(() => {
      setCurrentCoords((prev) => {
        if (!prev) return { lat: 23.9005, lng: 90.4005 };
        const simLat = prev.lat - 0.0003;
        const simLng = prev.lng - 0.0002;
        transmitTelemetry(simLat, simLng, 34);
        return { lat: simLat, lng: simLng };
      });
    }, 8000);
  };

  // Stop Trip
  const stopTrip = () => {
    setIsTripActive(false);
    setTripSeconds(0);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (transmitIntervalRef.current) {
      clearInterval(transmitIntervalRef.current);
      transmitIntervalRef.current = null;
    }
    setCurrentSpeed(0);
  };

  // Passenger Capacity Update
  const handleCapacityChange = async (level: CapacityLevel) => {
    setCapacity(level);
    if (!selectedBus) return;

    try {
      await supabase
        .from("buses")
        .update({ driver_number: level })
        .eq("id", selectedBus.id);
    } catch (e) {
      console.warn("Capacity update failed:", e);
    }
  };

  // SOS Emergency Trigger
  const triggerSos = () => {
    const nextState = !isSosActive;
    setIsSosActive(nextState);
    if (nextState) {
      setIncidentMessage("🚨 SOS EMERGENCY BROADCAST: Medical / Collision alert sent to IUBAT Transport Dispatch!");
    } else {
      setIncidentMessage(null);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-4 font-sans transition-colors duration-200 select-none ${
      isLight ? "text-slate-900" : "text-white"
    }`}>
      {/* Top Banner & Header */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
        isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
      }`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isLight ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800" : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-200"
              }`}
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-[#facc15] flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 shrink-0">
            <BusIcon className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight">Driver Navigation Cockpit</h2>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                isTripActive 
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse" 
                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
              }`}>
                {isTripActive ? "LIVE COMMUTE" : "STANDBY"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Assigned Pilot: <span className="font-bold text-[#facc15]">{driverName}</span> • Route: {selectedBus?.route_name || "Tongi - IUBAT Campus"}
            </p>
          </div>
        </div>

        {/* Bus Assignment Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-bold text-slate-400">Vehicle:</label>
          <select
            value={selectedBusId}
            onChange={(e) => handleSelectBus(e.target.value)}
            disabled={isTripActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm outline-none transition-all cursor-pointer ${
              isLight
                ? "bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500"
                : "bg-[#1b1e1a] border-[#2c3327] text-white focus:border-[#facc15]"
            } ${isTripActive ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {buses.map((bus) => (
              <option key={bus.id} value={bus.id} className="bg-[#141613] text-white">
                Bus #{bus.bus_no} ({bus.route_name})
              </option>
            ))}
          </select>

          {/* Quick SOS Trigger */}
          <button
            onClick={triggerSos}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 active:scale-95 transition-all shadow-md ${
              isSosActive
                ? "bg-red-600 text-white border-red-500 animate-bounce"
                : isLight
                ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                : "bg-[#281313] hover:bg-[#381616] text-red-400 border-red-900/60"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isSosActive ? "SOS BROADCASTING" : "SOS Alert"}</span>
          </button>
        </div>
      </div>

      {/* SOS Alert Banner if Active */}
      {incidentMessage && (
        <div className="p-3.5 rounded-xl bg-red-600/20 border border-red-500/50 text-red-400 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
            <span>{incidentMessage}</span>
          </div>
          <button
            onClick={() => setIncidentMessage(null)}
            className="text-[10px] font-black uppercase underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Trip Control & Speedometer (Left 7 cols) + Occupancy & Timeline (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Trip Action + Speed & Telemetry */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Trip Starter & Stopwatch Card */}
          <div className={`p-5 rounded-2xl border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 ${
            isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
          }`}>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Commute Session</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-[#facc15]">
                  {formatStopwatch(tripSeconds)}
                </span>
                <span className="text-xs font-bold text-slate-400">Duration</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Packets Transmitted: {packetCount} • Last Ping: {lastTransmitTime}</span>
              </p>
            </div>

            <div>
              {!isTripActive ? (
                <button
                  onClick={startTrip}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-tr from-[#facc15] to-[#eab308] text-black font-black text-sm shadow-xl shadow-yellow-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>START TRIP</span>
                </button>
              ) : (
                <button
                  onClick={stopTrip}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all hover:scale-[1.02]"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>END TRIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Speedometer & Live Telemetry Card */}
          <div className={`p-5 rounded-2xl border shadow-xl space-y-4 ${
            isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-black/5 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#facc15]" />
                Live Vehicle Telemetry
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                currentSpeed >= 45 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : currentSpeed >= 20 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {currentSpeed >= 45 ? "Speed Alert" : currentSpeed >= 20 ? "Normal Pace" : "Traffic Jam"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className={`p-3 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-[#1a1d18] border-[#2c3327]"
              }`}>
                <p className="text-[10px] font-bold text-slate-400">Velocity</p>
                <p className="text-2xl sm:text-3xl font-black font-mono text-[#facc15] mt-0.5">{currentSpeed}</p>
                <p className="text-[10px] font-bold text-slate-400">KM/H</p>
              </div>

              <div className={`p-3 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-[#1a1d18] border-[#2c3327]"
              }`}>
                <p className="text-[10px] font-bold text-slate-400">GPS Latitude</p>
                <p className="text-xs sm:text-sm font-black font-mono text-slate-200 mt-1.5">
                  {currentCoords ? currentCoords.lat.toFixed(4) : "23.9005"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">North</p>
              </div>

              <div className={`p-3 rounded-xl border ${
                isLight ? "bg-slate-50 border-slate-200" : "bg-[#1a1d18] border-[#2c3327]"
              }`}>
                <p className="text-[10px] font-bold text-slate-400">GPS Longitude</p>
                <p className="text-xs sm:text-sm font-black font-mono text-slate-200 mt-1.5">
                  {currentCoords ? currentCoords.lng.toFixed(4) : "90.4005"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">East</p>
              </div>
            </div>

            {/* Quick Incident Reporting Chips */}
            <div className="pt-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Report Commute Incident</p>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  "🚧 Heavy Traffic Jam",
                  "🌧️ Torrential Rain",
                  "🔧 Technical Check",
                  "⚠️ Road Diversion"
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setIncidentMessage(`Status Alert: ${tag} logged for Bus #${selectedBus?.bus_no || "12"}`)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                        : "bg-[#1a1d18] hover:bg-[#252b21] border-[#2c3327] text-slate-300 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Passenger Capacity & Real-Time Route Progress */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Passenger Capacity Manager */}
          <div className={`p-5 rounded-2xl border shadow-xl space-y-3.5 ${
            isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-black/5 dark:border-white/5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#facc15]" />
                Passenger Occupancy
              </span>
              <span className="text-xs font-black text-slate-300">{passengerCount} / 52 Seats</span>
            </div>

            {/* Capacity Level Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleCapacityChange("seats_available")}
                className={`py-2 rounded-xl text-xs font-black border transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  capacity === "seats_available"
                    ? "bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20"
                    : isLight
                    ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    : "bg-[#1a1d18] border-[#2c3327] text-slate-300 hover:bg-[#252b21]"
                }`}
              >
                <span>💺 Seats Open</span>
              </button>

              <button
                onClick={() => handleCapacityChange("standing_only")}
                className={`py-2 rounded-xl text-xs font-black border transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  capacity === "standing_only"
                    ? "bg-yellow-400 text-black border-yellow-300 shadow-lg shadow-yellow-400/20"
                    : isLight
                    ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    : "bg-[#1a1d18] border-[#2c3327] text-slate-300 hover:bg-[#252b21]"
                }`}
              >
                <span>🚶 Standing</span>
              </button>

              <button
                onClick={() => handleCapacityChange("full")}
                className={`py-2 rounded-xl text-xs font-black border transition-all active:scale-95 flex flex-col items-center gap-1 ${
                  capacity === "full"
                    ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/20"
                    : isLight
                    ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
                    : "bg-[#1a1d18] border-[#2c3327] text-slate-300 hover:bg-[#252b21]"
                }`}
              >
                <span>⛔ Bus Full</span>
              </button>
            </div>

            {/* Passenger Count Incrementor */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#1a1d18] border-[#2c3327]"
            }`}>
              <span className="text-xs font-bold text-slate-400">Boarded Passengers</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPassengerCount((p) => Math.max(0, p - 1))}
                  className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-black active:scale-95"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-base font-black font-mono w-6 text-center">{passengerCount}</span>
                <button
                  onClick={() => setPassengerCount((p) => Math.min(65, p + 1))}
                  className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/40 text-white flex items-center justify-center font-black active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Route Checkpoints Timeline */}
          <div className={`p-5 rounded-2xl border shadow-xl space-y-3 ${
            isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
          }`}>
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b pb-2 border-black/5 dark:border-white/5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Route Checkpoint Timeline
            </span>

            <div className="space-y-2 pt-1">
              {ROUTE_STOPS_TIMELINE.map((stop, idx) => {
                const isPassed = idx < currentStopIdx;
                const isCurrent = idx === currentStopIdx;

                return (
                  <div
                    key={stop.name}
                    onClick={() => setCurrentStopIdx(idx)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? "bg-[#facc15]/15 border-yellow-400/50 text-[#facc15]"
                        : isPassed
                        ? "bg-black/20 border-white/5 text-slate-500"
                        : isLight
                        ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        : "bg-[#1a1d18] border-[#2c3327] text-slate-300 hover:bg-[#252b21]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        isCurrent
                          ? "bg-[#facc15] animate-ping"
                          : isPassed
                          ? "bg-emerald-500"
                          : "bg-slate-500"
                      }`} />
                      <span className="text-xs font-black">{stop.name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-slate-400">{stop.dist}</span>
                      <span className={`px-1.5 py-0.5 rounded font-black ${
                        isCurrent ? "bg-[#facc15] text-black" : "bg-white/10 text-slate-300"
                      }`}>
                        {stop.eta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
