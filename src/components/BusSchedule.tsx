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
        Loading Live Schedules...
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
          Bus Timetable
        </h2>

        <div className="relative w-72">
          <input
            type="text"
            placeholder="Search Route or Destination..."
            className="w-full bg-white border border-slate-200 text-xs p-4 pl-12 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
        </div>
      </div>

      <div className="grid gap-4 overflow-y-auto pr-2">
        {filteredSchedule.map((bus) => (
          <div
            key={bus.id}
            className="bg-white/80 backdrop-blur-sm p-5 rounded-[28px] border border-white shadow-sm flex items-center justify-between hover:scale-[1.01] transition-all group cursor-default"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-slate-100 rounded-[20px] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <Bus className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 tracking-tight">
                  {bus.route_name}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    To: {bus.destination}
                  </span>
                  <span className="text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter bg-green-100 text-green-600">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-blue-600 justify-end">
                  <Clock className="w-3.5 h-3.5" />
                  <p className="text-base font-black tracking-tighter">
                    {bus.departure_time}
                  </p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Scheduled Departure
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}

        {filteredSchedule.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              No schedules found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}