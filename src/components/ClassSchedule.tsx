"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Plus, BookOpen, ChevronDown, Trash2, Edit3, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClassSchedule() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    course_name: "",
    class_day: "Sunday",
    class_time: "",
    room_no: ""
  });

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelectedDay(today);
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("class_schedules")
      .select("*")
      .order('class_time', { ascending: true });
    if (!error && data) setClasses(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      await supabase.from("class_schedules").update(formData).eq("id", editingId);
    } else {
      await supabase.from("class_schedules").insert([formData]);
    }

    setEditingId(null);
    setFormData({ course_name: "", class_day: selectedDay, class_time: "", room_no: "" });
    setIsModalOpen(false);
    fetchClasses();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this class?")) {
      await supabase.from("class_schedules").delete().eq("id", id);
      fetchClasses();
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      course_name: item.course_name,
      class_day: item.class_day,
      class_time: item.class_time,
      room_no: item.room_no
    });
    setIsModalOpen(true);
  };

  const filteredClasses = classes.filter(c => c.class_day === selectedDay);

  // Helper function to split time into two lines
  const formatTime = (timeStr: string) => {
    const parts = timeStr.split("-");
    return (
      <div className="flex flex-col">
        <span className="text-slate-900 font-bold">{parts[0]?.trim()}</span>
        <span className="text-slate-400 font-medium">{parts[1]?.trim()}</span>
      </div>
    );
  };

  // Helper function to split Room and Number
  const formatRoom = (roomStr: string) => {
    const match = roomStr.match(/([a-zA-Z]+)\s*(.*)/);
    if (match) {
      return (
        <div className="flex flex-col">
          <span className="text-slate-900 font-bold uppercase">{match[1]}</span>
          <span className="text-slate-400 font-medium">{match[2]}</span>
        </div>
      );
    }
    return roomStr;
  };

  if (loading && classes.length === 0) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[9px] tracking-widest">Loading...</div>;

  return (
    <div className="p-4 h-full flex flex-col font-sans relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Schedule</h2>
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Showing {selectedDay}</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full appearance-none bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wider px-3 py-2 pr-8 rounded-lg outline-none shadow-sm">
              {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-blue-600 transition-all shadow-md active:scale-95">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {filteredClasses.map((item) => (
          <div key={item.id} className="bg-white/90 backdrop-blur-sm p-4 rounded-[24px] border border-white shadow-sm flex items-center gap-4 hover:border-blue-200 transition-all group">
            <div className="w-10 h-10 bg-slate-50 rounded-[14px] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 leading-tight truncate mb-2">{item.course_name}</p>
              <div className="flex items-start gap-5">
                <div className="flex items-start gap-2">
                   <Clock className="w-3 h-3 text-blue-500 mt-0.5" />
                   <div className="text-[9px] uppercase leading-tight tracking-tight">
                      {formatTime(item.class_time)}
                   </div>
                </div>
                <div className="flex items-start gap-2">
                   <MapPin className="w-3 h-3 text-red-500 mt-0.5" />
                   <div className="text-[9px] uppercase leading-tight tracking-tight">
                      {formatRoom(item.room_no)}
                   </div>
                </div>
              </div>
            </div>
            
            {/* Actions: Always visible on mobile, slightly transparent on idle */}
            <div className="flex flex-col gap-1 shrink-0">
               <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
               <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {filteredClasses.length === 0 && (
          <div className="text-center py-16 bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">No classes for {selectedDay}</p>
          </div>
        )}
      </div>

      {/* Modal code remains same but updated to be more compact ... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-[320px] rounded-[28px] p-6 shadow-2xl relative z-10 border border-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-900"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-5">{editingId ? 'Edit Class' : 'Add Class'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Course Name" required className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" 
                value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})} />
              
              <select className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                value={formData.class_day} onChange={e => setFormData({...formData, class_day: e.target.value})}>
                {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
              </select>

              <input type="text" placeholder="Time (08:30 AM - 10:00 AM)" required className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" 
                value={formData.class_time} onChange={e => setFormData({...formData, class_time: e.target.value})} />

              <input type="text" placeholder="Room (Room 402)" required className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" 
                value={formData.room_no} onChange={e => setFormData({...formData, room_no: e.target.value})} />

              <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-blue-600 transition-all mt-2">
                {editingId ? 'Update Entry' : 'Create Entry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}