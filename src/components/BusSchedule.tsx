"use client";

import { useState, useEffect } from "react";
import { Search, Clock, Bus, ChevronDown, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface RouteItem {
  id: string;
  route_name: string;
  bus_number: string;
  route_color?: string;
}

interface StopDetail {
  pickup_time?: string;
  sequence_order?: number;
  stops?: {
    stop_name?: string;
  } | null;
}

const FALLBACK_ROUTES: RouteItem[] = [
  { id: "route-1", bus_number: "01", route_name: "Uttara Sector 7 - IUBAT Campus", route_color: "#3b82f6" },
  { id: "route-2", bus_number: "04", route_name: "Mirpur 10 - Airport - Campus", route_color: "#10b981" },
  { id: "route-3", bus_number: "09", route_name: "Abdullahpur - Kamarpara Shuttle", route_color: "#f59e0b" },
  { id: "route-4", bus_number: "12", route_name: "Gazipur Chowrasta - Campus Express", route_color: "#8b5cf6" },
];

const FALLBACK_STOPS: Record<string, StopDetail[]> = {
  "route-1": [
    { pickup_time: "07:15:00", sequence_order: 1, stops: { stop_name: "Sector 7 Bus Stop" } },
    { pickup_time: "07:30:00", sequence_order: 2, stops: { stop_name: "Rajlakshmi Complex" } },
    { pickup_time: "07:45:00", sequence_order: 3, stops: { stop_name: "House Building" } },
    { pickup_time: "08:00:00", sequence_order: 4, stops: { stop_name: "IUBAT Main Gate" } },
  ],
  "route-2": [
    { pickup_time: "07:00:00", sequence_order: 1, stops: { stop_name: "Mirpur 10 Roundabout" } },
    { pickup_time: "07:25:00", sequence_order: 2, stops: { stop_name: "Airport Intersection" } },
    { pickup_time: "07:55:00", sequence_order: 3, stops: { stop_name: "IUBAT Campus" } },
  ],
};

function formatPickupTime(timeStr?: string): string {
  if (!timeStr) return "--:--";
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return timeStr.slice(0, 5);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${m} ${period}`;
}

export default function BusSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Expandable Logic
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<StopDetail[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        if (!isSupabaseConfigured) {
          setRoutes(FALLBACK_ROUTES);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("routes")
          .select("*")
          .order("bus_number", { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setRoutes(data as RouteItem[]);
        } else {
          setRoutes(FALLBACK_ROUTES);
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        setRoutes(FALLBACK_ROUTES);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleExpand = async (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
      return;
    }
    setExpandedRouteId(routeId);
    setDetailsLoading(true);
    
    try {
      if (!isSupabaseConfigured) {
        setRouteDetails(FALLBACK_STOPS[routeId] || [
          { pickup_time: "07:30:00", sequence_order: 1, stops: { stop_name: "Initial Pickup" } },
          { pickup_time: "08:00:00", sequence_order: 2, stops: { stop_name: "Campus Gate" } },
        ]);
        setDetailsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("route_schedule")
        .select(`pickup_time, sequence_order, stops(stop_name)`)
        .eq("route_id", routeId)
        .order("sequence_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setRouteDetails(data as unknown as StopDetail[]);
      } else {
        setRouteDetails(FALLBACK_STOPS[routeId] || []);
      }
    } catch (err) {
      console.error("Error fetching stop details:", err);
      setRouteDetails(FALLBACK_STOPS[routeId] || []);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredRoutes = routes.filter((item) =>
    String(item.route_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.bus_number || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-10 text-center font-bold animate-pulse text-slate-400 uppercase text-[10px] tracking-widest">Loading...</div>;
  }

  return (
    <div className="p-4 h-full flex flex-col font-sans">
      
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
          BUS TIMETABLE
        </h2>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search Route..."
            className="w-full bg-white border border-slate-200 text-[11px] p-3 pl-9 rounded-2xl outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* --- Cards List (Clean Style) --- */}
      <div className="grid gap-4 overflow-y-auto pr-1 custom-scrollbar">
        {filteredRoutes.map((route) => (
          <div
            key={route.id}
            onClick={() => handleExpand(route.id)}
            className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            {/* Top Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
                  <Bus className="w-5 h-5" />
                </div>
                
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                    {route.route_name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      TO: IUBAT MAIN GATE
                    </p>
                    {/* Active Badge */}
                    <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-md tracking-wider">
                      ACTIVE
                    </span>
                  </div>
                  {/* Bus Number shown cleanly */}
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">Bus No: {route.bus_number}</p>
                </div>
              </div>

              {/* Right Side Time & Arrow */}
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5 text-blue-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm font-black tracking-tight">VIEW</span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    SCHEDULE
                  </p>
                </div>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-all">
                  {expandedRouteId === route.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* --- Expanded Timeline --- */}
            {expandedRouteId === route.id && (
              <div className="mt-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-1">
                {detailsLoading ? (
                  <p className="text-center text-[10px] font-bold text-slate-300 uppercase py-2">Loading details...</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {routeDetails.map((stop, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-blue-500" : "bg-slate-300"}`}></div>
                          <span className="text-[11px] font-bold text-slate-700">{stop.stops?.stop_name || "Designated Stop"}</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                          {formatPickupTime(stop.pickup_time)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              No routes found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}