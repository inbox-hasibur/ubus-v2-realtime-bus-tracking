"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, LayoutDashboard, Bus, LogOut, Activity, AlertTriangle, Edit2, Trash2, Save, X, Plus, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Settings() {
  // Auth States
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Management States
  const [isManageMode, setIsManageMode] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Edit/Add States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ route_name: "", bus_number: "", route_color: "#3b82f6" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const adminSession = localStorage.getItem("admin_session");
    if (adminSession === "true") setIsAdmin(true);
  }, []);

  // --- ACTIONS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAdmin(true);
      localStorage.setItem("admin_session", "true");
      setError("");
    } else {
      setError("Invalid Admin Passcode");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("admin_session");
  };

  const fetchRoutes = async () => {
    setLoading(true);
    const { data } = await supabase.from("routes").select("*").order('bus_number', { ascending: true });
    if (data) setRoutes(data);
    setLoading(false);
  };

  const openManageMode = () => {
    setIsManageMode(true);
    fetchRoutes();
  };

  const startEdit = (route: any) => {
    setEditingId(route.id);
    setEditForm({ route_name: route.route_name, bus_number: route.bus_number, route_color: route.route_color });
    setIsAdding(false);
  };

  const saveRoute = async () => {
    if (isAdding) {
      await supabase.from("routes").insert([editForm]);
    } else if (editingId) {
      await supabase.from("routes").update(editForm).eq("id", editingId);
    }
    setEditingId(null);
    setIsAdding(false);
    fetchRoutes(); // Refresh list
  };

  const deleteRoute = async (id: string) => {
    if (confirm("Are you sure you want to delete this route? This will delete all associated schedules.")) {
      await supabase.from("routes").delete().eq("id", id);
      fetchRoutes();
    }
  };

  // --- LOGIN VIEW ---
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 font-sans">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl border border-white text-center w-full max-w-sm">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white shadow-lg shadow-slate-300">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-1">Admin Portal</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Restricted Access Only</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <input 
                type="password" 
                placeholder="Enter Passcode" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-4 pl-12 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/10 transition-all text-center"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-focus-within:text-slate-900 transition-colors" />
            </div>
            {error && <p className="text-[10px] font-bold text-red-500 uppercase animate-pulse">{error}</p>}
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-slate-800 transition-all active:scale-95">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MANAGE SCHEDULE MODAL ---
  if (isManageMode) {
    return (
      <div className="p-4 h-full flex flex-col font-sans relative">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setIsManageMode(false)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-xs uppercase tracking-wider">
            <X className="w-4 h-4" /> Back to Dashboard
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingId("new"); setEditForm({ route_name: "", bus_number: "", route_color: "#3b82f6" }); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Add New Form */}
          {isAdding && (
            <div className="bg-blue-50 p-4 rounded-[24px] border border-blue-100 shadow-sm animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Bus Number (e.g. 99)" className="w-full p-3 rounded-xl text-xs font-bold border border-blue-200 outline-none" value={editForm.bus_number} onChange={e => setEditForm({...editForm, bus_number: e.target.value})} />
                <input type="text" placeholder="Route Name" className="w-full p-3 rounded-xl text-xs font-bold border border-blue-200 outline-none" value={editForm.route_name} onChange={e => setEditForm({...editForm, route_name: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={saveRoute} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs">Save Route</button>
                  <button onClick={() => setIsAdding(false)} className="px-4 bg-white text-slate-500 py-3 rounded-xl font-bold text-xs">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Routes List */}
          {routes.map((route) => (
            <div key={route.id} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3 group">
              {editingId === route.id ? (
                // Edit Mode
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input type="text" className="w-16 p-2 rounded-xl bg-slate-50 border text-xs font-black text-center" value={editForm.bus_number} onChange={e => setEditForm({...editForm, bus_number: e.target.value})} />
                    <input type="text" className="flex-1 p-2 rounded-xl bg-slate-50 border text-xs font-bold" value={editForm.route_name} onChange={e => setEditForm({...editForm, route_name: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveRoute} className="flex-1 bg-green-500 text-white py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 bg-slate-100 text-slate-500 py-2 rounded-lg font-bold text-[10px] uppercase">Cancel</button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md" style={{ backgroundColor: route.route_color || '#1e293b' }}>
                      {route.bus_number}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{route.route_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Route</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(route)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteRoute(route.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="p-6 h-full flex flex-col font-sans overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">System Control</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Active</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Bus className="w-4 h-4" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Buses</span>
          </div>
          <p className="text-3xl font-black text-slate-900">12<span className="text-sm text-slate-300 ml-1">/ 16</span></p>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl"><Activity className="w-4 h-4" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">System Health</span>
          </div>
          <p className="text-3xl font-black text-green-600">98%</p>
        </div>
      </div>

      {/* Action Menu */}
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">Management</h3>
      <div className="space-y-3">
        {/* Manage Schedule Button */}
        <button onClick={openManageMode} className="w-full bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group flex items-center justify-between active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LayoutDashboard className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Manage Schedule</p>
              <p className="text-[10px] font-bold text-slate-400">Update routes & timings</p>
            </div>
          </div>
        </button>

        {/* Emergency Alert Button */}
        <button className="w-full bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm hover:border-red-500 hover:shadow-md transition-all group flex items-center justify-between active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-slate-800">Emergency Alert</p>
              <p className="text-[10px] font-bold text-slate-400">Broadcast notification</p>
            </div>
          </div>
        </button>
      </div>

    </div>
  );
}