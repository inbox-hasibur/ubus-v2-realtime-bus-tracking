"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  LayoutDashboard, 
  Bus, 
  LogOut, 
  Activity, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Plus,
  Cpu,
  Video,
  Send,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface RouteData {
  id: string;
  route_name: string;
  bus_number: string;
  route_color: string;
}

export interface BusItem {
  id: string;
  bus_no: string;
  route_name: string;
}

interface SettingsProps {
  theme?: "dark" | "light";
}

export default function Settings({ theme: propTheme }: SettingsProps) {
  const [localTheme, setLocalTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setLocalTheme(custom.detail);
    };
    window.addEventListener("set-map-theme", handleThemeChange);
    window.addEventListener("set-app-theme", handleThemeChange);
    return () => {
      window.removeEventListener("set-map-theme", handleThemeChange);
      window.removeEventListener("set-app-theme", handleThemeChange);
    };
  }, []);

  const isLight = (propTheme || localTheme) === "light";

  // Auth States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_session") === "true";
    }
    return false;
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Management States
  const [isManageMode, setIsManageMode] = useState(false);
  const [isSimMode, setIsSimMode] = useState(false);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [activeBusCount, setActiveBusCount] = useState(0);
  
  // Edit/Add States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ route_name: "", bus_number: "", route_color: "#3b82f6" });
  const [isAdding, setIsAdding] = useState(false);

  // Hardware & YOLO Simulator States
  const [simBusNo, setSimBusNo] = useState("12");
  const [simSpeed, setSimSpeed] = useState(10);
  const [simVehicleCount, setSimVehicleCount] = useState(16);
  const [simLat, setSimLat] = useState(23.8820);
  const [simLng, setSimLng] = useState(90.4005);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);
  const [isSendingSim, setIsSendingSim] = useState(false);

  // Emergency Alert State
  const [emergencyText, setEmergencyText] = useState("");
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Fetch initial system telemetry stats
  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchSystemStats = async () => {
      try {
        const { data: busList } = await supabase.from("buses").select("id, bus_no, route_name");
        if (busList) setBuses(busList);

        const { data: locs } = await supabase.from("bus_locations").select("id");
        if (locs) setActiveBusCount(locs.length);
      } catch (e) {
        console.warn("Failed to fetch system stats:", e);
      }
    };

    fetchSystemStats();
  }, [isAdmin]);

  // --- ACTIONS ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "admin123";
    if (password === expectedPasscode) {
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
    try {
      const { data, error: fetchError } = await supabase.from("routes").select("*").order('bus_number', { ascending: true });
      if (fetchError) throw fetchError;
      if (data) setRoutes(data as RouteData[]);
    } catch (err: unknown) {
      console.error("Error fetching routes:", err);
    } finally {
      setLoading(false);
    }
  };

  const openManageMode = () => {
    setIsManageMode(true);
    fetchRoutes();
  };

  const startEdit = (route: RouteData) => {
    setEditingId(route.id);
    setEditForm({ route_name: route.route_name, bus_number: route.bus_number, route_color: route.route_color });
    setIsAdding(false);
  };

  const saveRoute = async () => {
    try {
      if (isAdding) {
        const { error: insertErr } = await supabase.from("routes").insert([editForm]);
        if (insertErr) throw insertErr;
      } else if (editingId) {
        const { error: updateErr } = await supabase.from("routes").update(editForm).eq("id", editingId);
        if (updateErr) throw updateErr;
      }
      setEditingId(null);
      setIsAdding(false);
      fetchRoutes(); // Refresh list
    } catch (err: unknown) {
      console.error("Error saving route:", err);
      alert("Failed to save route. Please try again.");
    }
  };

  const deleteRoute = async (id: string) => {
    if (confirm("Are you sure you want to delete this route? This will delete all associated schedules.")) {
      try {
        const { error: deleteErr } = await supabase.from("routes").delete().eq("id", id);
        if (deleteErr) throw deleteErr;
        fetchRoutes();
      } catch (err: unknown) {
        console.error("Error deleting route:", err);
        alert("Failed to delete route.");
      }
    }
  };

  // Transmit ESP32 GPS + YOLO Telemetry
  const handleTransmitTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSim(true);
    setSimSuccess(null);

    try {
      const res = await fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bus_no: simBusNo,
          latitude: simLat,
          longitude: simLng,
          speed: simSpeed,
          vehicle_count: simVehicleCount,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSimSuccess(`Telemetry broadcasted! Status: ${data.traffic_label} (${simSpeed} km/h, ${simVehicleCount} vehicles)`);
      } else {
        alert(data.error || "Failed to transmit telemetry");
      }
    } catch (err) {
      console.error("Simulation error:", err);
      alert("Transmission failed. Make sure the server is reachable.");
    } finally {
      setIsSendingSim(false);
    }
  };

  // Broadcast Emergency Alert
  const handleBroadcastEmergency = () => {
    if (!emergencyText.trim()) return;
    alert(`EMERGENCY BROADCAST SENT TO ALL STUDENTS:\n"${emergencyText}"`);
    setEmergencyText("");
    setShowEmergencyModal(false);
  };

  // --- LOGIN VIEW ---
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 font-sans">
        <div className={`p-8 rounded-2xl shadow-2xl border text-center w-full max-w-sm transition-colors ${
          isLight
            ? "bg-white border-slate-200 shadow-slate-900/10"
            : "bg-[#161916] border-[#262a25]"
        }`}>
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 text-[#facc15] shadow-lg border ${
            isLight ? "bg-amber-50 border-amber-200" : "bg-[#1b1e1a] border-[#262a25]"
          }`}>
            <Shield className="w-7 h-7" />
          </div>
          <h2 className={`text-xl font-black uppercase tracking-tight mb-1 ${
            isLight ? "text-slate-900" : "text-white"
          }`}>Admin Portal</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Restricted Access Only</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative group">
              <input 
                type="password" 
                placeholder="Enter Passcode" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3.5 pl-12 rounded-xl text-sm font-bold outline-none transition-all text-center border ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                    : "bg-[#1b1e1a] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
                }`}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-focus-within:text-[#facc15] transition-colors" />
            </div>
            {error && <p className="text-[10px] font-bold text-red-400 uppercase animate-pulse">{error}</p>}
            <button type="submit" className="w-full bg-[#facc15] hover:bg-[#eab308] text-black py-3.5 rounded-xl font-black text-xs uppercase shadow-xl transition-all active:scale-95">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- HARDWARE & YOLO SIMULATOR VIEW ---
  if (isSimMode) {
    return (
      <div className="p-4 h-full flex flex-col font-sans relative overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setIsSimMode(false)} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider">
            <X className="w-4 h-4" /> Back to System Control
          </button>
          <span className="text-[10px] font-black uppercase text-[#facc15] bg-[#28230b] px-3 py-1 rounded-lg border border-yellow-500/30">
            Hardware & Vision AI Testbench
          </span>
        </div>

        <div className="max-w-xl mx-auto w-full bg-[#161916] p-6 rounded-2xl shadow-xl border border-[#262a25] space-y-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#1b1e1a] border border-[#262a25] rounded-xl flex items-center justify-center text-[#facc15] shadow-md">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">ESP32 & YOLO Traffic Ingestion</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Simulate ESP32 GPS telemetry + ESP32-CAM vehicle detection live</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleTransmitTelemetry} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Target Bus</label>
                <select 
                  value={simBusNo} 
                  onChange={(e) => setSimBusNo(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#1b1e1a] border border-[#262a25] text-xs font-bold text-white outline-none focus:border-[#facc15]"
                >
                  {buses.map((b) => (
                    <option key={b.id} value={b.bus_no} className="bg-[#161916] text-white">Bus #{b.bus_no} - {b.route_name}</option>
                  ))}
                  {buses.length === 0 && (
                    <>
                      <option value="12" className="bg-[#161916] text-white">Bus #12 (Uttara-Campus)</option>
                      <option value="19" className="bg-[#161916] text-white">Bus #19 (Uttara-Campus)</option>
                      <option value="32" className="bg-[#161916] text-white">Bus #32 (Uttara-Campus)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Location Preset</label>
                <select 
                  onChange={(e) => {
                    const [lat, lng] = e.target.value.split(",").map(Number);
                    if (lat && lng) {
                      setSimLat(lat);
                      setSimLng(lng);
                    }
                  }}
                  className="w-full p-3 rounded-xl bg-[#1b1e1a] border border-[#262a25] text-xs font-bold text-white outline-none focus:border-[#facc15]"
                >
                  <option value="23.8820,90.4005" className="bg-[#161916] text-white">Near Abdullahpur</option>
                  <option value="23.8860,90.3870" className="bg-[#161916] text-white">Kamarpara Bridge</option>
                  <option value="23.8759,90.3795" className="bg-[#161916] text-white">IUBAT Main Gate</option>
                  <option value="23.8680,90.4010" className="bg-[#161916] text-white">Azampur Stand</option>
                </select>
              </div>
            </div>

            {/* GPS Speed Slider */}
            <div className="bg-[#1b1e1a] p-3.5 rounded-xl border border-[#262a25]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#facc15]" /> GPS Speed: {simSpeed} km/h
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                  simSpeed >= 30 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : simSpeed >= 15 ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                }`}>
                  {simSpeed >= 30 ? 'Free Flow' : simSpeed >= 15 ? 'Moderate' : 'Heavy Jam'}
                </span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={60} 
                value={simSpeed} 
                onChange={(e) => setSimSpeed(Number(e.target.value))}
                className="w-full accent-[#facc15] cursor-pointer"
              />
            </div>

            {/* ESP32-CAM YOLO Vehicle Count Slider */}
            <div className="bg-[#1b1e1a] p-3.5 rounded-xl border border-[#262a25]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-sky-400" /> Camera Detection (YOLO): {simVehicleCount} Vehicles
                </span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                  simVehicleCount >= 18 ? 'bg-red-950 text-red-400 border border-red-500/30' : simVehicleCount >= 8 ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {simVehicleCount >= 18 ? 'Congested Road' : simVehicleCount >= 8 ? 'Normal Flow' : 'Clear Road'}
                </span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={30} 
                value={simVehicleCount} 
                onChange={(e) => setSimVehicleCount(Number(e.target.value))}
                className="w-full accent-[#facc15] cursor-pointer"
              />
            </div>

            {simSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{simSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingSim}
              className="w-full bg-[#facc15] hover:bg-[#eab308] text-black py-3.5 rounded-xl font-black text-xs uppercase shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingSim ? "Broadcasting..." : "Broadcast Telemetry to Map"}</span>
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
          <button onClick={() => setIsManageMode(false)} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider">
            <X className="w-4 h-4" /> Back to Dashboard
          </button>
          <button 
            onClick={() => { setIsAdding(true); setEditingId("new"); setEditForm({ route_name: "", bus_number: "", route_color: "#facc15" }); }}
            className="bg-[#facc15] hover:bg-[#eab308] text-black px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Route
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {/* Add New Form */}
          {isAdding && (
            <div className="bg-[#1b1e1a] p-4 rounded-xl border border-[#262a25] shadow-sm animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Bus Number (e.g. 99)" className="w-full p-3 rounded-xl bg-[#161916] text-xs font-bold text-white border border-[#262a25] outline-none focus:border-[#facc15]" value={editForm.bus_number} onChange={e => setEditForm({...editForm, bus_number: e.target.value})} />
                <input type="text" placeholder="Route Name" className="w-full p-3 rounded-xl bg-[#161916] text-xs font-bold text-white border border-[#262a25] outline-none focus:border-[#facc15]" value={editForm.route_name} onChange={e => setEditForm({...editForm, route_name: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={saveRoute} className="flex-1 bg-[#facc15] text-black py-3 rounded-xl font-bold text-xs">Save Route</button>
                  <button onClick={() => setIsAdding(false)} className="px-4 bg-[#161916] text-slate-400 border border-[#262a25] py-3 rounded-xl font-bold text-xs">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Routes List */}
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
              Loading routes...
            </div>
          ) : (
            routes.map((route) => (
            <div key={route.id} className="bg-[#161916] p-4 rounded-xl border border-[#262a25] shadow-sm flex flex-col gap-3 group">
              {editingId === route.id ? (
                // Edit Mode
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input type="text" className="w-16 p-2 rounded-xl bg-[#1b1e1a] border border-[#262a25] text-xs font-black text-center text-white outline-none focus:border-[#facc15]" value={editForm.bus_number} onChange={e => setEditForm({...editForm, bus_number: e.target.value})} />
                    <input type="text" className="flex-1 p-2 rounded-xl bg-[#1b1e1a] border border-[#262a25] text-xs font-bold text-white outline-none focus:border-[#facc15]" value={editForm.route_name} onChange={e => setEditForm({...editForm, route_name: e.target.value})} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveRoute} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-bold text-[10px] uppercase flex items-center justify-center gap-1"><Save className="w-3 h-3" /> Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 bg-[#1b1e1a] border border-[#262a25] text-slate-400 py-2 rounded-lg font-bold text-[10px] uppercase">Cancel</button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-xs shadow-md bg-[#facc15]">
                      {route.bus_number}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{route.route_name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active Route</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(route)} className="p-2 text-slate-400 hover:text-[#facc15] hover:bg-[#1b1e1a] rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteRoute(route.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-[#1b1e1a] rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )))}
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className={`p-6 h-full flex flex-col font-sans overflow-y-auto custom-scrollbar transition-colors ${
      isLight ? "bg-slate-50 text-slate-900" : "bg-[#141613] text-white"
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className={`text-2xl font-black uppercase tracking-tight ${
            isLight ? "text-slate-900" : "text-white"
          }`}>System Control</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Active</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${
          isLight ? "bg-white border-slate-200" : "bg-[#161916] border-[#262a25]"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${
              isLight ? "bg-amber-100 text-amber-600 border border-amber-200" : "bg-[#1b1e1a] border-[#262a25] text-[#facc15]"
            }`}><Bus className="w-4 h-4" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Buses</span>
          </div>
          <p className={`text-3xl font-black ${isLight ? "text-slate-900" : "text-white"}`}>
            {activeBusCount}
            <span className="text-sm text-slate-400 ml-1">/ {buses.length || 4}</span>
          </p>
        </div>
        <div className={`p-5 rounded-2xl border shadow-sm transition-colors ${
          isLight ? "bg-white border-slate-200" : "bg-[#161916] border-[#262a25]"
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${
              isLight ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "bg-[#1b1e1a] border-[#262a25] text-emerald-400"
            }`}><Activity className="w-4 h-4" /></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">System Health</span>
          </div>
          <p className="text-3xl font-black text-emerald-500">100%</p>
        </div>
      </div>

      {/* Action Menu */}
      <h3 className={`text-sm font-black uppercase tracking-tight mb-4 ${
        isLight ? "text-slate-900" : "text-white"
      }`}>Management & Testing</h3>
      <div className="space-y-3">
        
        {/* Hardware & YOLO Simulator */}
        <button 
          onClick={() => setIsSimMode(true)}
          className={`w-full border p-5 rounded-xl shadow-lg transition-all group flex items-center justify-between active:scale-[0.99] ${
            isLight
              ? "bg-white border-slate-200 hover:border-amber-400 text-slate-900"
              : "bg-[#161916] border-[#262a25] hover:border-[#facc15]/40 text-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-[#1b1e1a] border-[#262a25] text-[#facc15]"
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-black ${isLight ? "text-slate-900" : "text-white"}`}>ESP32 & YOLO Simulator</p>
              <p className="text-[10px] font-bold text-slate-400">Test speed & camera traffic layers</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase bg-[#facc15]/20 text-yellow-600 dark:text-[#facc15] border border-yellow-500/30 px-2.5 py-1 rounded-lg">TESTBENCH</span>
        </button>

        {/* Manage Schedule Button */}
        <button onClick={openManageMode} className={`w-full p-5 rounded-xl border shadow-sm transition-all group flex items-center justify-between active:scale-[0.99] ${
          isLight
            ? "bg-white border-slate-200 hover:border-amber-400 text-slate-900"
            : "bg-[#161916] border-[#262a25] hover:border-[#facc15]/40 text-white"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${
              isLight ? "bg-slate-100 border-slate-200 text-slate-600 group-hover:bg-[#facc15] group-hover:text-black" : "bg-[#1b1e1a] border-[#262a25] text-slate-400 group-hover:bg-[#facc15] group-hover:text-black"
            }`}>
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className={`text-sm font-black ${isLight ? "text-slate-900" : "text-white"}`}>Manage Schedule</p>
              <p className="text-[10px] font-bold text-slate-400">Update routes & timings</p>
            </div>
          </div>
        </button>

        {/* Emergency Alert Button */}
        <button 
          onClick={() => setShowEmergencyModal(true)}
          className="w-full bg-[#161916] p-5 rounded-xl border border-[#262a25] shadow-sm hover:border-red-500/40 transition-all group flex items-center justify-between active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1b1e1a] border border-[#262a25] rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6 text-slate-400 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-black text-white">Emergency Alert</p>
              <p className="text-[10px] font-bold text-slate-400">Broadcast notification to students</p>
            </div>
          </div>
        </button>
      </div>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161916] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative border border-[#262a25]">
            <button onClick={() => setShowEmergencyModal(false)} className="absolute right-5 top-5 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Broadcast Emergency</h3>
            <p className="text-[10px] text-slate-400 font-semibold mb-4">Send instant alert to all active student dashboards.</p>
            
            <textarea
              rows={3}
              placeholder="e.g. Abdullahpur road blocked due to construction. Buses taking Kamarpara detour."
              value={emergencyText}
              onChange={(e) => setEmergencyText(e.target.value)}
              className="w-full p-3 bg-[#1b1e1a] border border-[#262a25] text-white rounded-xl text-xs font-bold outline-none mb-3 resize-none focus:border-red-500"
            />

            <div className="flex gap-2">
              <button 
                onClick={handleBroadcastEmergency}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase shadow-md transition-all active:scale-95"
              >
                Send Broadcast
              </button>
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 bg-[#1b1e1a] border border-[#262a25] text-slate-300 hover:text-white py-3 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}