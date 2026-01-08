"use client";

import dynamic from "next/dynamic";
import { Bus, MapPin, Clock, Calendar, Bell, Settings, Target, Menu, Navigation2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import BusSchedule from "@/components/BusSchedule";
import ClassSchedule from "@/components/ClassSchedule";


const MapView = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-200 animate-pulse" />
});

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-[#e2e8f0] overflow-hidden font-sans antialiased text-slate-900">
      
      {/* --- Minimal Sidebar --- */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 flex flex-col hidden lg:flex z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
               <Bus className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">UBus</span>
          </div>

          <nav className="space-y-2">
            <NavItem 
              icon={<MapPin className="w-5 h-5" />} 
              label="Dashboard" 
              active={activeTab === "dashboard"} 
              onClick={() => setActiveTab("dashboard")}
            />
            <NavItem 
              icon={<Clock className="w-5 h-5" />} 
              label="Bus Schedule" 
              active={activeTab === "schedule"} 
              onClick={() => setActiveTab("schedule")}
            />
            <NavItem 
              icon={<Calendar className="w-5 h-5" />} 
              label="Class Schedule" 
              active={activeTab === "class"} 
              onClick={() => setActiveTab("class")}
            />
            <NavItem 
              icon={<Settings className="w-5 h-5" />}
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => setActiveTab("settings")}
            />
        </nav>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/50 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              HR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Hasibur Rahman</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Student Profile</p>
            </div>
          </div>
        </div>
      </aside>

{/* --- Main Area --- */}
      <main className="flex-1 relative flex flex-col">
        
        {activeTab === "dashboard" ? (
          <>
            {/* Background Map */}
            <div className="absolute inset-0 z-0">
              <MapView />
            </div>

            {/* --- Top Pill Badges --- */}
            <div className="absolute top-6 left-6 flex gap-2 z-10">
              <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-[13px] shadow-2xl flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" /> {currentTime}
              </div>
              <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-[13px] shadow-2xl">
                {currentDate}
              </div>
            </div>

            {/* --- Top Right Actions --- */}
            <div className="absolute top-6 right-6 flex gap-2 z-10">
              <button className="bg-[#facc15] hover:bg-[#eab308] text-slate-900 px-5 py-2.5 rounded-xl font-black text-xs uppercase shadow-xl transition-all flex items-center gap-2 active:scale-95">
                <Target className="w-4 h-4" /> Track Near Me
              </button>
              <button className="bg-white/80 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-white/50 text-slate-900 active:scale-95 transition-all">
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* --- Right Floating Panel --- */}
            <div className="absolute top-24 right-6 w-[340px] space-y-4 z-10">
              
              <PanelCard title="Estimated time">
                 <div className="flex bg-slate-900/90 rounded-xl overflow-hidden ring-1 ring-white/10">
                    <div className="flex-1 p-3.5 text-center border-r border-white/5">
                      <p className="text-sm font-black text-white">00:12 M</p>
                    </div>
                    <div className="flex-1 p-3.5 text-center">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tongi</p>
                    </div>
                 </div>
              </PanelCard>

              <PanelCard title="Travel Information">
                 <div className="space-y-3">
                   <InfoBlock label="Current location" value="Cherag Ali, Tongi, Gazipur" />
                   <InfoBlock label="Next stopage" value="Abdullahpur, Dhaka" subValue="00:45 M" />
                   <InfoBlock label="Destination" value="IUBAT University" subValue="01:20 H" />
                 </div>
              </PanelCard>

              <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl border border-white/40 space-y-3">
                 <div className="relative group">
                    <input type="text" placeholder="Enter your current location" className="w-full bg-slate-900/90 text-white text-[11px] p-4 pr-10 rounded-xl outline-none placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-blue-500/50 transition-all" />
                    <Navigation2 className="w-4 h-4 text-slate-500 absolute right-4 top-4 group-focus-within:text-blue-400" />
                 </div>
                 <div className="relative">
                    <input type="text" placeholder="Enter your destination" className="w-full bg-slate-900/90 text-white text-[11px] p-4 rounded-xl outline-none placeholder:text-slate-500 ring-1 ring-white/10 focus:ring-blue-500/50 transition-all" />
                 </div>
                 <div className="flex gap-2 pt-1">
                    <button className="flex-1 bg-[#facc15] hover:bg-[#eab308] text-slate-900 py-3.5 rounded-xl font-black text-xs uppercase shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all">Enter</button>
                    <button className="bg-slate-900 text-white px-4 py-3.5 rounded-xl shadow-lg active:rotate-180 transition-all duration-500"><RotateCcw className="w-4 h-4" /></button>
                 </div>
              </div>
            </div>
          </>
        ) : activeTab === "schedule" ? (
          <div className="z-10 h-full w-full p-8 overflow-auto bg-white/80 backdrop-blur-xl">
             <BusSchedule />
          </div>
        ) : activeTab === "class" ? (
          <div className="z-10 h-full w-full p-8 overflow-auto bg-white/80 backdrop-blur-xl">
             <ClassSchedule />
          </div>
        ) : (
          <div className="z-10 flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs">
            {activeTab} Page Coming Soon
          </div>
        )}

      </main>
    </div>
  );
}

// --- Helper Components for Clean Code ---

function NavItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${
      active ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
    }`}>
      {icon} {label}
    </button>
  );
}

function PanelCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl border border-white/40">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{title}</p>
      {children}
    </div>
  );
}

function InfoBlock({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{label}</p>
      <div className={`flex bg-slate-900/90 rounded-xl overflow-hidden ring-1 ring-white/10 ${subValue ? '' : 'p-3.5'}`}>
        {subValue ? (
          <>
            <div className="flex-1 p-3.5 text-center border-r border-white/5">
              <p className="text-[11px] font-black text-white">{subValue}</p>
            </div>
            <div className="flex-1 p-3.5 text-center flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-300 uppercase leading-tight">{value}</p>
            </div>
          </>
        ) : (
          <p className="text-[10px] font-bold text-white uppercase w-full">{value}</p>
        )}
      </div>
    </div>
  );
}