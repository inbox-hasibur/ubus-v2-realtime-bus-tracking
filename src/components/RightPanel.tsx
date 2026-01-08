"use client";

import { Navigation2, RotateCcw } from "lucide-react";
import { PanelCard, InfoBlock } from "@/components/DashboardUI";

export default function RightPanel({ isOpen }: { isOpen: boolean }) {
  return (
    <div className={`absolute top-24 right-6 w-full max-w-[320px] space-y-4 z-10 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}>
      
      <PanelCard title="Estimated time">
         <div className="flex bg-slate-900 rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg">
            <div className="flex-1 p-4 text-center border-r border-white/10">
              <p className="text-base font-black text-white">00:12 M</p>
            </div>
            <div className="flex-1 p-4 text-center flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tongi</p>
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

      <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-white/60 space-y-3">
         <div className="relative group">
            <input type="text" placeholder="Enter current location" className="w-full bg-slate-100 text-slate-900 text-[11px] font-medium p-3.5 pr-10 rounded-xl outline-none placeholder:text-slate-400 border border-transparent focus:border-blue-500/30 focus:bg-white transition-all" />
            <Navigation2 className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 group-focus-within:text-blue-500" />
         </div>
         <div className="relative">
            <input type="text" placeholder="Enter destination" className="w-full bg-slate-100 text-slate-900 text-[11px] font-medium p-3.5 rounded-xl outline-none placeholder:text-slate-400 border border-transparent focus:border-blue-500/30 focus:bg-white transition-all" />
         </div>
         <div className="flex gap-2 pt-2">
            <button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all">Start Navigation</button>
            <button className="bg-white text-slate-900 border border-slate-200 px-4 py-3.5 rounded-xl shadow-sm hover:shadow-md active:rotate-180 transition-all duration-500"><RotateCcw className="w-4 h-4" /></button>
         </div>
      </div>
    </div>
  );
}