"use client";

import { ReactNode } from "react";

// --- Panel Card Component (Dark Theme & Crisp Borders) ---
export function PanelCard({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="bg-[#161916] p-4 rounded-xl shadow-xl border border-[#262a25] text-white">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-0.5">{title}</p>
      {children}
    </div>
  );
}

// --- Info Block Component (Dark Theme & Crisp Borders) ---
export function InfoBlock({ label, value, subValue }: { label: string, value: string, subValue?: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-0.5">{label}</p>
      <div className={`flex bg-[#1b1e1a] border border-[#2f352d] rounded-xl overflow-hidden ${subValue ? '' : 'p-2.5'}`}>
        {subValue ? (
          <>
            <div className="flex-1 p-2 text-center border-r border-[#2f352d] bg-[#222720]">
              <p className="text-[10px] font-black text-[#facc15]">{subValue}</p>
            </div>
            <div className="flex-[2] p-2 text-center flex items-center justify-center">
              <p className="text-[10px] font-bold text-slate-200 uppercase leading-tight truncate">{value}</p>
            </div>
          </>
        ) : (
          <p className="text-[10px] font-bold text-slate-200 uppercase w-full text-center truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

// --- Nav Item (Dark Theme & Crisp Borders) ---
export function NavItem({ icon, label, active = false, onClick, collapsed }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center transition-all duration-200 group relative rounded-xl
      ${active ? 'bg-[#1f241d] text-[#facc15] font-black border border-[#2f382b]' : 'text-slate-400 hover:bg-[#1a1d18] hover:text-white'}
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
        <div className="absolute left-10 bg-[#161916] border border-[#262a25] text-white px-2 py-1 rounded-lg text-[9px] font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl hidden lg:block">
          {label}
        </div>
      )}
    </button>
  );
}