"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin, Plus, BookOpen, ChevronDown, Trash2, Edit3, X, LogOut, Bell, BellOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import StudentLogin from "./StudentLogin";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper: Calculate Time Range (Start + 1 Hour)
const calculateTimeRange = (time24: string) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  
  // Format 12 Hour Function
  const format12 = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM"; // Simple AM/PM logic
    const h12 = h % 12 || 12; // Convert 0/13/24 to 12-based
    return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const startStr = format12(hours, minutes);
  const endH = (hours + 1) % 24; // Add 1 Hour
  const endStr = format12(endH, minutes);

  return `${startStr} - ${endStr}`;
};

export default function ClassSchedule() {
  // --- States ---
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    course_name: "",
    class_day: "Sunday",
    class_time: "",
    room_no: ""
  });

  // --- Notification Logic ---
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());

  // 1. Permission Request
  const toggleNotification = () => {
    if (!notifyEnabled) {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          setNotifyEnabled(true);
          new Notification("UBUS Alert Active", { body: "You will be notified before classes start!" });
        } else {
          alert("Please allow notifications in your browser settings.");
        }
      });
    } else {
      setNotifyEnabled(false);
    }
  };

  // 2. Time Checker (Runs every 10 seconds)
  useEffect(() => {
    if (!notifyEnabled || classes.length === 0) return;

    const checkTime = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      classes.forEach((cls) => {
        // Parse "08:30 AM" to minutes
        const timePart = cls.class_time.split("-")[0].trim();
        const [time, modifier] = timePart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        
        if (modifier === "PM" && hours < 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        
        const classStartMinutes = hours * 60 + minutes;
        const diff = classStartMinutes - currentMinutes;

        const sendAlert = (key: string, title: string, body: string) => {
          const eventKey = `${cls.id}-${key}`;
          if (!notifiedEvents.has(eventKey)) {
            new Notification(title, { body });
            setNotifiedEvents(prev => new Set(prev).add(eventKey));
          }
        };

        if (diff === 15) sendAlert("15min", "Hurry Up!", `15 mins left for ${cls.course_name}`);
        if (diff === 5) sendAlert("5min", "Get Ready", `5 mins left for ${cls.course_name}`);
        if (diff === 0) sendAlert("start", "Class Started", `${cls.course_name} is starting now!`);
      });
    };

    const interval = setInterval(checkTime, 10000);
    return () => clearInterval(interval);
  }, [notifyEnabled, classes, notifiedEvents]);

  // --- 1. Auth Check & Initial Setup ---
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    setSelectedDay(today);

    // Check Local Storage for Login Session
    const savedId = localStorage.getItem("student_id");
    if (savedId) {
      setCurrentUserId(savedId);
    } else {
      setLoading(false); // Stop loading to show Login Screen
    }
  }, []);

  // --- 2. Fetch Data when User Logs in ---
  useEffect(() => {
    if (currentUserId) {
      fetchClasses();
    }
  }, [currentUserId]);

  const fetchClasses = async () => {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from("class_schedules")
      .select("*")
      .eq("user_id", currentUserId) // Filter by Student ID
      .order('class_time', { ascending: true });
      
    if (!error && data) setClasses(data);
    setLoading(false);
  };

  // --- 3. CRUD Operations ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Add Student ID to the data
    const payload = { ...formData, user_id: currentUserId };

    if (editingId) {
      await supabase.from("class_schedules").update(payload).eq("id", editingId);
    } else {
      await supabase.from("class_schedules").insert([payload]);
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

  // --- 4. Helper Functions ---
  const handleLogout = () => {
    localStorage.removeItem("student_id");
    setCurrentUserId(null);
    setLoading(false);
  };

  const formatTime = (timeStr: string) => {
    const parts = timeStr.split("-");
    return (
      <div className="flex flex-col">
        <span className="text-slate-900 font-bold">{parts[0]?.trim()}</span>
        <span className="text-slate-400 font-medium">{parts[1]?.trim()}</span>
      </div>
    );
  };

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

  // --- 5. Conditional Rendering (Login vs Schedule) ---
  
  // If no user ID, Show Login Screen
  if (!currentUserId && !loading) {
    return <StudentLogin onLogin={(id) => setCurrentUserId(id)} />;
  }

  // Loading State
  if (loading && classes.length === 0) {
    return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase text-[9px] tracking-widest">Loading...</div>;
  }

  const filteredClasses = classes.filter(c => c.class_day === selectedDay);

  // Main Schedule UI
  return (
    <div className="p-4 h-full flex flex-col font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">My Schedule</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">ID: {currentUserId}</p>
            <span className="text-slate-300">•</span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedDay}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full appearance-none bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wider px-3 py-2 pr-8 rounded-lg outline-none shadow-sm">
              {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
          
          <button onClick={() => { setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-blue-600 transition-all shadow-md active:scale-95" title="Add Class">
            <Plus className="w-4 h-4" />
          </button>
          {/* Notification Button */}
          <button 
            onClick={toggleNotification}
            className={`p-2 rounded-lg transition-all shadow-md active:scale-95 border ${
              notifyEnabled 
                ? "bg-yellow-400 text-slate-900 border-yellow-500 animate-pulse" 
                : "bg-white text-slate-400 border-slate-200 hover:text-yellow-600"
            }`}
            title={notifyEnabled ? "Disable Alerts" : "Enable Class Alerts"}
          >
            {notifyEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          
          <button onClick={handleLogout} className="bg-red-50 text-red-500 border border-red-100 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
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
                   <div className="text-[9px] uppercase leading-tight tracking-tight">{formatTime(item.class_time)}</div>
                </div>
                <div className="flex items-start gap-2">
                   <MapPin className="w-3 h-3 text-red-500 mt-0.5" />
                   <div className="text-[9px] uppercase leading-tight tracking-tight">{formatRoom(item.room_no)}</div>
                </div>
              </div>
            </div>
            
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

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-w-[320px] rounded-[28px] p-6 shadow-2xl relative z-10 border border-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-5 top-5 text-slate-400 hover:text-slate-900"><X className="w-4 h-4" /></button>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-5">{editingId ? 'Edit Class' : 'Add Class'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Course Name</label>
                <input type="text" required className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                  value={formData.course_name} onChange={e => setFormData({...formData, course_name: e.target.value})} />
              </div>
              
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Class Day</label>
                <select className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none"
                  value={formData.class_day} onChange={e => setFormData({...formData, class_day: e.target.value})}>
                  {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>

              {/* --- New Auto Time Calculation Input --- */}
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Start Time (Auto 1 Hour)</label>
                <input 
                  type="time" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none cursor-pointer" 
                  onChange={(e) => {
                    const timeString = calculateTimeRange(e.target.value);
                    setFormData({...formData, class_time: timeString});
                  }} 
                />
                {/* Preview the calculated time */}
                <p className="text-[10px] font-black text-blue-600 mt-1 ml-1 tracking-wide">
                  {formData.class_time || "Select a time"}
                </p>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Room / Lab</label>
                <input type="text" required className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none" 
                  value={formData.room_no} onChange={e => setFormData({...formData, room_no: e.target.value})} />
              </div>

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