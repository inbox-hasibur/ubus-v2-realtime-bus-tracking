"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ClassSchedule() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch classes from Supabase class_schedules table
  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("class_schedules")
        .select("*")
        .order('class_day', { ascending: true }); // Basic ordering

      if (error) throw error;
      if (data) setClasses(data);
    } catch (err) {
      console.error("Error fetching class schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center font-bold animate-pulse text-slate-400 uppercase text-[10px] tracking-widest">
        Loading Class Schedule...
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col font-sans">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">My Class Schedule</h2>
        <button className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        {classes.map((item) => (
          <div key={item.id} className="bg-white/80 backdrop-blur-sm p-5 rounded-[28px] border border-white shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">{item.course_name}</p>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <Clock className="w-3 h-3" /> {item.class_time}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                  <MapPin className="w-3 h-3" /> {item.room_no}
                </span>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500">
              {item.class_day}
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No classes scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}