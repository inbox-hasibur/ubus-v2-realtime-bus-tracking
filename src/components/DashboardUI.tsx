"use client";

import { ReactNode } from "react";

// --- Panel Card Component (Compact) ---
export function PanelCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="bg-white p-4 md:p-5 rounded-[24px] shadow-lg border border-slate-100">
      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">{title}</p>
      {children}
    </div>
  );
}

// --- Info Block Component (Compact) ---
export function InfoBlock({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{label}</p>
      <div className={`flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden ${subValue ? '' : 'p-3'}`}>
        {subValue ? (
          <>
            <div className="flex-1 p-2.5 text-center border-r border-slate-200 bg-slate-100/50">
              <p className="text-[10px] font-black text-slate-800">{subValue}</p>
            </div>
            <div className="flex-[2] p-2.5 text-center flex items-center justify-center">
              <p className="text-[9px] font-bold text-slate-700 uppercase leading-tight text-center">{value}</p>
            </div>
          </>
        ) : (
          <p className="text-[9px] font-bold text-slate-700 uppercase w-full text-center">{value}</p>
        )}
      </div>
    </div>
  );
}

// --- Nav Item (Compact Size) ---
export function NavItem({ icon, label, active = false, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center transition-all duration-200 group relative rounded-xl
      ${active ? 'bg-slate-900 text-white shadow-md shadow-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
      ${collapsed 
        ? 'w-8 h-8 justify-center p-0 mx-auto' 
        : 'w-8 h-8 justify-center p-0 mx-auto lg:w-full lg:justify-start lg:px-3 lg:py-2.5 lg:mx-0'
      }`}
    >
      <div className="shrink-0">{icon}</div>
      
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 hidden lg:block text-[11px] font-bold ml-2.5
        ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      
      {/* Tooltip */}
      {collapsed && (
        <div className="absolute left-10 bg-slate-800 text-white px-2 py-1 rounded text-[9px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg hidden lg:block">
          {label}
        </div>
      )}
    </button>
  );
}