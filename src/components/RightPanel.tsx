"use client";

import { Navigation2, RotateCcw } from "lucide-react";
import { PanelCard, InfoBlock } from "@/components/DashboardUI";

export default function RightPanel({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={`absolute top-20 right-4 md:right-6 w-full md:w-[360px] space-y-4 z-10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) 
      ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
      
      {/* High Contrast Cards */}
      <PanelCard title="Estimated time">
         <div className="flex bg-slate-900 rounded-2xl overflow-hidden shadow-lg shadow-slate-900/20">
            <div className="flex-1 p-5 text-center border-r border-white/10 bg-slate-900">
              <p className="text-xl font-black text-white tracking-tight">00:12 M</p>
            </div>
            <div className="flex-1 p-5 text-center flex items-center justify-center bg-slate-800">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Tongi</p>
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

      {/* Input Action Card */}
      <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100 space-y-4">
         <div className="relative group">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Start Point</label>
            <div className="relative">
                <input type="text" placeholder="Your location..." className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-4 pr-10 rounded-2xl outline-none placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
                <Navigation2 className="w-4 h-4 text-slate-400 absolute right-4 top-4 group-focus-within:text-blue-600" />
            </div>
         </div>
         
         <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block">Destination</label>
            <input type="text" placeholder="Search destination..." className="w-full bg-slate-50 text-slate-900 text-xs font-bold p-4 rounded-2xl outline-none placeholder:text-slate-400 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all" />
         </div>

         <div className="flex gap-3 pt-2">
            <button className="flex-1 bg-[#facc15] hover:bg-[#eab308] text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-yellow-400/20 active:scale-[0.98] transition-all">
                Start Navigation
            </button>
            <button className="bg-slate-100 text-slate-600 border border-slate-200 px-5 py-4 rounded-2xl shadow-sm hover:bg-white hover:shadow-md active:rotate-180 transition-all duration-500">
                <RotateCcw className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}