"use client";

import { useState, useEffect } from "react";
import { Search, Clock, ArrowRight, Bus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BusSchedule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase bus_schedules table
  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from("bus_schedules")
        .select("*");

      if (error) throw error;
      if (data) setSchedules(data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Filter logic based on database column names (route_name)
  const filteredSchedule = schedules.filter((item) =>
    item.route_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-10 text-center font-bold animate-pulse text-slate-400 uppercase text-[10px] tracking-widest">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
          Bus Timetable
        </h2>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white border border-slate-200 text-[11px] p-3 pl-9 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
        </div>
      </div>

      <div className="grid gap-3 overflow-y-auto pr-1 custom-scrollbar">
        {filteredSchedule.map((bus) => (
          <div
            key={bus.id}
            className="bg-white/90 backdrop-blur-sm p-3 rounded-[20px] border border-white shadow-sm flex items-center justify-between hover:scale-[1.01] transition-all group cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-[14px] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 tracking-tight">
                  {bus.route_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    To: {bus.destination}
                  </span>
                  <span className="text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-tighter bg-green-100 text-green-600 ml-2 hidden sm:inline-block">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-blue-600 justify-end">
                  <Clock className="w-3 h-3" />
                  <p className="text-xs font-black tracking-tighter">
                    {bus.departure_time}
                  </p>
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                  Departure
                </p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}

        {filteredSchedule.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              No schedules found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}