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
      className={`bg-white/80 backdrop-blur-xl border-r border-white/20 flex flex-col z-30 transition-all duration-300 ease-in-out relative 
      ${isCollapsed ? 'w-20' : 'w-20 lg:w-72'} 
      shrink-0`}
    >
      <div className="p-4 flex flex-col h-full">
        
        {/* Logo Section */}
        <div className={`flex items-center gap-4 mb-10 h-12 transition-all ${isCollapsed ? 'justify-center' : 'justify-center lg:justify-start px-2'}`}>
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-300 shrink-0">
             <Bus className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black tracking-tighter uppercase whitespace-nowrap hidden lg:block opacity-0 lg:opacity-100 transition-opacity duration-300 delay-100">
              UBus V2
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="space-y-3 flex-1">
          <NavItem icon={<MapPin className="w-5 h-5" />} label="Dashboard" active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} collapsed={isCollapsed} />
          <NavItem icon={<Clock className="w-5 h-5" />} label="Bus Schedule" active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} collapsed={isCollapsed} />
          <NavItem icon={<Calendar className="w-5 h-5" />} label="Class Schedule" active={activeTab === "class"} onClick={() => setActiveTab("class")} collapsed={isCollapsed} />
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} collapsed={isCollapsed} />
        </nav>

        {/* User Profile Section */}
        <div className="mt-auto pt-4 border-t border-slate-200/50">
          <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/50 border border-white/60 shadow-sm transition-all duration-300 
            ${isCollapsed ? 'justify-center w-10 h-10 p-0 mx-auto' : 'justify-center w-10 h-10 p-0 mx-auto lg:w-full lg:h-auto lg:p-3 lg:justify-start'}`}>
            
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
              HR
            </div>
            
            {!isCollapsed && (
              <div className="hidden lg:block overflow-hidden">
                <p className="text-xs font-bold truncate text-slate-800">Hasibur Rahman</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Student ID: 2230</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Desktop Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 text-slate-500 rounded-full p-1.5 shadow-md hover:bg-slate-50 hover:text-blue-600 transition-all z-40 hidden lg:flex"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}