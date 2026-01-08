"use client";

import { ReactNode } from "react";

// --- Panel Card Component ---
export function PanelCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-xl border border-slate-100">
      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">{title}</p>
      {children}
    </div>
  );
}

// --- Info Block Component ---
export function InfoBlock({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{label}</p>
      <div className={`flex bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden ${subValue ? '' : 'p-4'}`}>
        {subValue ? (
          <>
            <div className="flex-1 p-3.5 text-center border-r border-slate-200 bg-slate-100/50">
              <p className="text-[11px] font-black text-slate-800">{subValue}</p>
            </div>
            <div className="flex-[2] p-3.5 text-center flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-700 uppercase leading-tight text-center">{value}</p>
            </div>
          </>
        ) : (
          <p className="text-[10px] font-bold text-slate-700 uppercase w-full text-center">{value}</p>
        )}
      </div>
    </div>
  );
}

// --- Nav Item (Perfect Centering Fix) ---
export function NavItem({ icon, label, active = false, onClick, collapsed }: { icon: any, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center transition-all duration-200 group relative rounded-2xl
      ${/* State Logic */ ''}
      ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}
      
      ${/* Size & Alignment Logic */ ''}
      ${collapsed 
        ? 'w-10 h-10 justify-center p-0 mx-auto' // Mobile/Collapsed: Square & Centered
        : 'w-10 h-10 justify-center p-0 mx-auto lg:w-full lg:justify-start lg:px-4 lg:py-3 lg:mx-0' // Desktop Expanded: Full Width
      }`}
    >
      <div className="shrink-0">{icon}</div>
      
      {/* Label only visible on Desktop Expanded */}
      <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 hidden lg:block text-[13px] font-bold ml-3
        ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
        {label}
      </span>
      
      {/* Tooltip for Collapsed State (Desktop Only) */}
      <div className={`absolute left-14 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl hidden lg:block
        ${collapsed ? 'block' : 'hidden'}`}>
        {label}
      </div>
    </button>
  );
}