"use client";

import { useState } from "react";
import { User, ArrowRight } from "lucide-react";

export default function StudentLogin({ onLogin }: { onLogin: (id: string) => void }) {
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate 8 digit numeric ID
    if (/^\d{8}$/.test(studentId)) {
      localStorage.setItem("student_id", studentId);
      onLogin(studentId);
    } else {
      setError("Please enter a valid 8-digit Student ID");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full font-sans">
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl border border-white text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
          <User className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Student Access</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Enter your IUBAT ID to manage schedule</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              maxLength={8}
              placeholder="e.g. 22303089"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center text-lg font-black tracking-[0.2em] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-200"
            />
          </div>
          
          {error && <p className="text-[9px] font-bold text-red-500 uppercase">{error}</p>}

          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 group">
            Login Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}