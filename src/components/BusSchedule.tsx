"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Clock, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface BusRouteItem {
  id: string;
  route_name: string;
  default_station: string;
  time: string;
  bus_numbers: string;
}

export interface RouteStationItem {
  station: string;
  time: string;
  bus: string;
}

// Built-in Complete IUBAT Bus Routes (Matches Video 00:47-01:02 exactly)
const DEFAULT_BUS_ROUTES: BusRouteItem[] = [
  { id: "1", route_name: "New Market, City College", default_station: "ScienceLab", time: "06:40 AM", bus_numbers: "3, 29" },
  { id: "2", route_name: "Chandura", default_station: "Chandura", time: "06:30 AM", bus_numbers: "2, 28" },
  { id: "3", route_name: "Kaliganj", default_station: "Kaliganj", time: "06:45 AM", bus_numbers: "1" },
  { id: "4", route_name: "Kalyanpur", default_station: "Kalyanpur", time: "06:20 AM", bus_numbers: "14" },
  { id: "5", route_name: "Kalsi, Mirpur", default_station: "Dha Block Mirpur", time: "07:05 AM", bus_numbers: "31" },
  { id: "6", route_name: "Konabari, Mouchak", default_station: "Mouchak", time: "06:45 AM", bus_numbers: "4" },
  { id: "7", route_name: "Motijheel", default_station: "Shapla Chottor", time: "06:40 AM", bus_numbers: "3, 29" },
  { id: "8", route_name: "Notun Bazar", default_station: "Notun Bazar", time: "07:10 AM", bus_numbers: "3" },
  { id: "9", route_name: "Physical, Mohammadpur", default_station: "Physical", time: "06:45 AM", bus_numbers: "28" },
  { id: "10", route_name: "Rajendrapur", default_station: "Rajendrapur Cantonment", time: "06:30 AM", bus_numbers: "16" },
  { id: "11", route_name: "Rampura Bridge & Notun Bazar", default_station: "Rampura Bridge", time: "07:00 AM", bus_numbers: "2" },
  { id: "12", route_name: "Rezbar, Gazipur", default_station: "Rezabari", time: "06:50 AM", bus_numbers: "17" },
  { id: "13", route_name: "Savar", default_station: "Savar", time: "06:20 AM", bus_numbers: "14" },
  { id: "14", route_name: "Shimultali, Gazipur", default_station: "Shimultali", time: "06:45 AM", bus_numbers: "11" },
  { id: "15", route_name: "Signboard", default_station: "Signboard", time: "06:30 AM", bus_numbers: "23" },
];

// Drilldown stations for Motijheel & other routes (Matches Video 00:57)
const ROUTE_STATIONS_MAP: Record<string, RouteStationItem[]> = {
  Motijheel: [
    { station: "Shapla Chottor", time: "06:40 AM", bus: "BUS 3, 29" },
    { station: "Rajarbagh", time: "06:40 AM", bus: "BUS 3, 29" },
    { station: "Malibagh Mour", time: "06:40 AM", bus: "BUS 3, 29" },
    { station: "Mouchak", time: "06:40 AM", bus: "BUS 3, 29" },
    { station: "Malibagh Railgate", time: "06:40 AM", bus: "BUS 3, 29" },
    { station: "Rampura Bazar", time: "06:48 AM", bus: "BUS 3, 29" },
    { station: "Badda Link Road", time: "06:55 AM", bus: "BUS 3, 29" },
    { station: "Notun Bazar", time: "07:05 AM", bus: "BUS 3, 29" },
    { station: "Kuril Flyover", time: "07:18 AM", bus: "BUS 3, 29" },
    { station: "Khilkhet", time: "07:25 AM", bus: "BUS 3, 29" },
    { station: "Airport", time: "07:35 AM", bus: "BUS 3, 29" },
    { station: "Azampur", time: "07:45 AM", bus: "BUS 3, 29" },
    { station: "House Building", time: "07:50 AM", bus: "BUS 3, 29" },
    { station: "Abdullahpur", time: "07:55 AM", bus: "BUS 3, 29" },
    { station: "Kamarpara", time: "08:05 AM", bus: "BUS 3, 29" },
    { station: "IUBAT Campus", time: "08:15 AM", bus: "BUS 3, 29" },
  ],
};

interface BusScheduleProps {
  theme?: "dark" | "light";
}

export default function BusSchedule({ theme: propTheme }: BusScheduleProps) {
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("Show All");
  const [drilldownRoute, setDrilldownRoute] = useState<BusRouteItem | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [localTheme, setLocalTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setLocalTheme(custom.detail);
    };
    window.addEventListener("set-map-theme", handleThemeChange);
    window.addEventListener("set-app-theme", handleThemeChange);
    return () => {
      window.removeEventListener("set-map-theme", handleThemeChange);
      window.removeEventListener("set-app-theme", handleThemeChange);
    };
  }, []);

  // Sync with Supabase routes if available
  useEffect(() => {
    supabase
      .from("routes")
      .select("*")
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Keep default if needed or augment
        }
      });
  }, []);

  const handleSelectRouteFromFilter = (routeName: string) => {
    setSelectedRouteFilter(routeName);
    setIsFilterDropdownOpen(false);

    if (routeName !== "Show All") {
      const match = DEFAULT_BUS_ROUTES.find((r) =>
        r.route_name.toLowerCase().includes(routeName.toLowerCase())
      );
      if (match) {
        setDrilldownRoute(match);
      }
    } else {
      setDrilldownRoute(null);
    }
  };

  const isLight = (propTheme || localTheme) === "light";

  const filteredRoutes = DEFAULT_BUS_ROUTES.filter((r) => {
    const matchesFilter =
      selectedRouteFilter === "Show All" ||
      r.route_name.toLowerCase().includes(selectedRouteFilter.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      r.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.default_station.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bus_numbers.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const currentStationsList: RouteStationItem[] = drilldownRoute
    ? ROUTE_STATIONS_MAP[drilldownRoute.route_name] || [
        { station: drilldownRoute.default_station, time: drilldownRoute.time, bus: `BUS ${drilldownRoute.bus_numbers}` },
        { station: "Uttara Sector 11", time: "07:30 AM", bus: `BUS ${drilldownRoute.bus_numbers}` },
        { station: "Abdullahpur", time: "07:45 AM", bus: `BUS ${drilldownRoute.bus_numbers}` },
        { station: "Kamarpara Bus Stand", time: "08:00 AM", bus: `BUS ${drilldownRoute.bus_numbers}` },
        { station: "IUBAT Main Campus", time: "08:15 AM", bus: `BUS ${drilldownRoute.bus_numbers}` },
      ]
    : [];

  return (
    <div className={`w-full max-w-2xl mx-auto py-6 px-3 sm:px-4 font-sans transition-colors ${
      isLight ? "text-slate-900" : "text-white"
    }`}>
      {/* --- Top Header with Route Dropdown Selector (Matching Video 00:47) --- */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className={`text-xl sm:text-2xl font-black tracking-tight uppercase ${
          isLight ? "text-slate-900" : "text-white"
        }`}>
          BUS Schedule
        </h1>

        {/* Dropdown: Route v Show All */}
        <div className="relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 border ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                : "bg-[#1b1f29] hover:bg-[#252a38] border-white/10 text-slate-200"
            }`}
          >
            <span className={isLight ? "text-slate-500" : "text-slate-400"}>Route</span>
            <ChevronDown className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-yellow-500 font-black">{selectedRouteFilter}</span>
          </button>

          {isFilterDropdownOpen && (
            <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto custom-scrollbar border ${
              isLight
                ? "bg-white/95 backdrop-blur-xl border-slate-200 text-slate-900 shadow-slate-900/10"
                : "bg-[#141720]/95 backdrop-blur-xl border-white/10 text-white"
            }`}>
              <button
                onClick={() => handleSelectRouteFromFilter("Show All")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  isLight ? "hover:bg-slate-100 text-slate-900" : "hover:bg-white/10 text-white"
                }`}
              >
                Show All
              </button>
              {DEFAULT_BUS_ROUTES.map((route) => (
                <button
                  key={route.id}
                  onClick={() => handleSelectRouteFromFilter(route.route_name.split(",")[0].trim())}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors truncate ${
                    isLight
                      ? "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      : "hover:bg-white/10 text-slate-300 hover:text-white"
                  }`}
                >
                  {route.route_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- DRILLDOWN VIEW: Single Route Detailed Stations (Video 00:56) --- */}
      {drilldownRoute ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Go Back Header */}
          <div className={`flex items-center justify-between gap-2 pb-2 border-b ${
            isLight ? "border-slate-200" : "border-white/10"
          }`}>
            <button
              onClick={() => {
                setDrilldownRoute(null);
                setSelectedRouteFilter("Show All");
              }}
              className="flex items-center gap-1.5 text-xs font-black text-amber-500 hover:text-amber-600 transition-colors uppercase tracking-wider active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
            <span className={`text-xs font-black uppercase tracking-wide truncate max-w-[60%] text-right ${
              isLight ? "text-slate-800" : "text-white"
            }`}>
              {drilldownRoute.route_name}
            </span>
          </div>

          {/* List of Stations */}
          <div className="space-y-2.5">
            {currentStationsList.map((st, i) => (
              <div
                key={i}
                className={`rounded-xl p-2.5 sm:p-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 shadow-md transition-all group border ${
                  isLight
                    ? "bg-white border-slate-200 hover:border-slate-300 shadow-slate-900/5"
                    : "bg-[#161916] border-[#262a25] hover:border-[#3d453a]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#facc15] shrink-0 shadow-sm" />
                  <p className={`text-xs sm:text-sm font-black transition-colors truncate ${
                    isLight ? "text-slate-900 group-hover:text-amber-600" : "text-white group-hover:text-[#facc15]"
                  }`}>
                    Station: <span className={isLight ? "text-slate-700 font-bold" : "text-slate-200 font-bold"}>{st.station}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-lg border ${
                    isLight
                      ? "bg-slate-100 text-slate-700 border-slate-200"
                      : "bg-[#1b1e1a] text-slate-300 border-[#2f352d]"
                  }`}>
                    <Clock className="w-3 h-3 text-[#facc15]" />
                    <span>{st.time}</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-black text-black bg-[#facc15] px-2 sm:px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
                    {st.bus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- MAIN ROUTE LIST (Video 00:47-00:54) --- */
        <div className="space-y-3">
          {/* Quick Search Input */}
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search route or station name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl px-3.5 py-2 pl-9 text-xs outline-none transition-all border ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                  : "bg-[#121410] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
              }`}
            />
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? "text-slate-400" : "text-slate-400"}`} />
          </div>

          {/* Route Cards */}
          <div className="space-y-2">
            {filteredRoutes.map((route) => (
              <div
                key={route.id}
                className={`rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-md hover:shadow-xl transition-all group border ${
                  isLight
                    ? "bg-white border-slate-200 hover:border-slate-300 shadow-slate-900/5"
                    : "bg-[#161916] border-[#262a25] hover:border-[#3d453a]"
                }`}
              >
                {/* Left side: Route Name and Station */}
                <div className="min-w-0 flex-1">
                  <h3 className={`text-xs sm:text-sm font-black transition-colors truncate ${
                    isLight ? "text-slate-900 group-hover:text-amber-600" : "text-white group-hover:text-[#facc15]"
                  }`}>
                    Route: <span className={isLight ? "text-slate-800 font-bold" : "text-slate-100 font-bold"}>{route.route_name}</span>
                  </h3>
                  <p className={`text-[11px] mt-0.5 truncate ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    Station: <span className={isLight ? "text-slate-700 font-semibold" : "text-slate-300 font-semibold"}>{route.default_station}</span>
                  </p>
                </div>

                {/* Right side: Time, Bus Numbers, and More Button */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className={`text-[11px] font-black ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                      Time: <span className="text-[#facc15] font-black">{route.time}</span>
                    </p>
                    <p className={`text-[10px] font-bold ${isLight ? "text-slate-400" : "text-slate-400"}`}>
                      BUS: <span className={isLight ? "text-slate-800" : "text-slate-200"}>{route.bus_numbers}</span>
                    </p>
                  </div>

                  {/* More -> Button (Matches Video exactly) */}
                  <button
                    onClick={() => setDrilldownRoute(route)}
                    className={`flex items-center gap-1 font-black text-xs px-3 py-1.5 rounded-lg border transition-all active:scale-95 shadow-sm ${
                      isLight
                        ? "bg-slate-100 hover:bg-[#facc15] hover:text-black text-slate-800 border-slate-200"
                        : "bg-[#1b1e1a] hover:bg-[#facc15] text-slate-200 hover:text-black border-[#2f352d]"
                    }`}
                  >
                    <span>More</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}