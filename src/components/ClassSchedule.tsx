"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Plus, BookOpen, ChevronDown, Trash2, Edit3, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ClassSchedule() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("");
  
  // Modal & Form States
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

  // Function to Add or Update a Class
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      // Update existing class
      await supabase.from("class_schedules").update(formData).eq("id", editingId);
    } else {
      // Insert new class
      await supabase.from("class_schedules").insert([formData]);
    }

    setEditingId(null);
    setFormData({ course_name: "", class_day: selectedDay, class_time: "", room_no: "" });
    setIsModalOpen(false);
    fetchClasses();
  };

  // Function to Delete a Class
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      await supabase.from("class_schedules").delete().eq("id", id);
      fetchClasses();
    }
  };

  // Function to Open Modal for Editing
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

  if (loading && classes.length === 0) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[10px]">Loading...</div>;

  return (
    <div className="p-6 h-full flex flex-col font-sans relative">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Class Schedule</h2>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Showing {selectedDay}</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="appearance-none bg-white border border-slate-200 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 pr-10 rounded-xl outline-none shadow-sm">
              {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2">
        {filteredClasses.map((item) => (
          <div key={item.id} className="bg-white/70 backdrop-blur-sm p-5 rounded-[28px] border border-white shadow-sm flex items-center gap-5 hover:border-blue-200 transition-all group">
            <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-slate-800">{item.course_name}</p>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.class_time}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.room_no}</span>
              </div>
            </div>
            {/* Actions: Edit & Delete */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
               <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 border border-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-6">{editingId ? 'Edit Class' : 'Add New Class'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Course Name" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-500/10" 
                value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})} />
              
              <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs outline-none"
                value={formData.class_day} onChange={e => setFormData({...formData, class_day: e.target.value})}>
                {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
              </select>

              <input type="text" placeholder="Time (e.g. 08:30 AM - 10:00 AM)" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs outline-none" 
                value={formData.class_time} onChange={e => setFormData({...formData, class_time: e.target.value})} />

              <input type="text" placeholder="Room No (e.g. Room 402)" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs outline-none" 
                value={formData.room_no} onChange={e => setFormData({...formData, room_no: e.target.value})} />

              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all">
                {editingId ? 'Save Changes' : 'Add Class'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}