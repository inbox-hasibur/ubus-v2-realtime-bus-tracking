"use client";

import dynamic from "next/dynamic";
import { Clock, Target, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import BusSchedule from "@/components/BusSchedule";
import ClassSchedule from "@/components/ClassSchedule";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";

const MapView = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-200 animate-pulse" />
});

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  
  // UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Mobile first: Start collapsed
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);    // Mobile first: Start closed

  useEffect(() => {
    // Clock Logic
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Responsive Logic: Open panels automatically only on Desktop
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false);
        setIsRightPanelOpen(true);
      } else {
        setIsSidebarCollapsed(true);
        setIsRightPanelOpen(false);
      }
    };

    // Set initial state based on screen size
    handleResize();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen bg-[#e2e8f0] overflow-hidden font-sans antialiased text-slate-900">
      
      {/* --- Sidebar Component --- */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        
        {activeTab === "dashboard" ? (
          <>
            <div key="map-container" className="absolute inset-0 z-0">
              <MapView />
            </div>

            {/* Top Overlay Badges (Time & Date) */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2 z-10 transition-all duration-300">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[12px] shadow-2xl flex items-center gap-2 border border-white/10">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" /> {currentTime}
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-[12px] shadow-2xl border border-white/10 hidden sm:block">
                {currentDate}
              </div>
            </div>

            {/* Top Right Actions (Hamburger & Track) */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-2 md:gap-3 z-20">
              
              {/* Track Me Button - Hides text on mobile to save space */}
              <button className={`bg-[#facc15] hover:bg-[#eab308] text-slate-900 h-9 md:h-11 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] uppercase shadow-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 border border-yellow-400/50 ${isRightPanelOpen ? 'px-4 md:px-6' : 'w-9 md:w-11 px-0'}`}>
                <Target className="shrink-0 w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className={`overflow-hidden transition-all duration-300 hidden md:block ${isRightPanelOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>Track Near Me</span>
              </button>
              
              {/* Menu Toggle Button */}
              <button 
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className={`h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-2xl shadow-xl border transition-all active:scale-95 ${!isRightPanelOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/80 backdrop-blur-md border-white/60 text-slate-900'}`}
              >
                <Menu className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* --- Right Panel Component --- */}
            <RightPanel isOpen={isRightPanelOpen} />
          </>
        ) : (
          <div className="z-10 h-full w-full p-0 md:p-4 lg:p-8 overflow-auto bg-white/50 backdrop-blur-md">
            {activeTab === "schedule" ? <BusSchedule /> : activeTab === "class" ? <ClassSchedule /> : 
              <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs">Settings Coming Soon</div>
            }
          </div>
        )}

      </main>
    </div>
  );
}