"use client";

import { Bus, MapPin, Clock, Calendar, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { NavItem } from "@/components/DashboardUI";

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <aside 
      className={`bg-white/95 backdrop-blur-2xl border-r border-slate-100 flex flex-col z-30 transition-all duration-300 ease-in-out relative shrink-0 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      ${/* Logic: Mobile is always 74px. Desktop toggles based on state */ ''}
      w-[74px] ${isCollapsed ? 'lg:w-[74px]' : 'lg:w-[280px]'}`}
    >
      <div className="flex flex-col h-full py-6">
        
        {/* Logo Section */}
        <div className={`flex items-center mb-8 transition-all duration-300 h-12 
          ${isCollapsed ? 'justify-center px-0' : 'justify-center lg:justify-start lg:px-6'}`}>
          
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 shrink-0 z-10 relative">
             <Bus className="w-5 h-5 text-white" />
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-0 lg:w-auto lg:opacity-100 pl-3'}`}>
            <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap text-slate-900">
              UBus V2
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2 flex-1 px-3 flex flex-col items-center lg:items-stretch">
          <NavItem icon={<MapPin className="w-5 h-5" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} collapsed={isCollapsed} />
          <NavItem icon={<Clock className="w-5 h-5" />} label="Bus Schedule" active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} collapsed={isCollapsed} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Class Schedule" active={activeTab === "class"} onClick={() => setActiveTab("class")} collapsed={isCollapsed} />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} collapsed={isCollapsed} />
        </nav>

        {/* User Profile Section */}
        <div className="mt-auto pt-6 px-3 border-t border-slate-100 mx-2">
          <div className={`flex items-center rounded-2xl bg-slate-50/80 border border-slate-100 p-1.5 transition-all duration-300
            ${isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'justify-center w-10 h-10 mx-auto lg:w-full lg:h-auto lg:p-2.5 lg:justify-start'}`}>
            
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-md ring-2 ring-white">
              HR
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-0 lg:w-auto lg:opacity-100 pl-3'}`}>
              <p className="text-xs font-bold truncate text-slate-800">Hasibur Rahman</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Student ID: 2230</p>
            </div>
          </div>
        </div>

      </div>

      {/* Desktop Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[88px] bg-white border border-slate-100 text-slate-400 rounded-full p-1.5 shadow-md hover:bg-slate-50 hover:text-blue-600 transition-all z-40 hidden lg:flex scale-90 hover:scale-100"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}