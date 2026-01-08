"use client";

import { ReactNode } from "react";

// --- Panel Card Component ---
export function PanelCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[28px] shadow-2xl border border-white/60">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{title}</p>
      {children}
    </div>
  );
}

// --- Info Block Component ---
export function InfoBlock({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{label}</p>
      <div className={`flex bg-slate-50/80 border border-slate-100 rounded-xl overflow-hidden ${subValue ? '' : 'p-3.5'}`}>
        {subValue ? (
          <>
            <div className="flex-1 p-3.5 text-center border-r border-slate-200/50">
              <p className="text-[11px] font-black text-slate-700">{subValue}</p>
            </div>
            <div className="flex-1 p-3.5 text-center flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-600 uppercase leading-tight text-center">{value}</p>
            </div>
          </>
        ) : (
          <p className="text-[10px] font-bold text-slate-600 uppercase w-full text-center">{value}</p>
        )}
      </div>
    </div>
  );
}

// --- Nav Item Component ---
export function NavItem({ icon, label, active = false, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl font-bold text-[13px] transition-all group relative duration-200
      ${active ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-[1.02]' : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'}
      ${collapsed ? 'justify-center' : 'justify-center lg:justify-start'}`}
    >
      <div className="shrink-0">{icon}</div>
      
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 hidden lg:block 
        ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      
      {/* Tooltip */}
      <div className={`absolute left-16 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl
        ${collapsed ? 'block' : 'hidden'} lg:group-hover:block hidden`}>
        {label}
      </div>
    </button>
  );
}