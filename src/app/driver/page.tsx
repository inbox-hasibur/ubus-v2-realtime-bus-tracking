"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import DriverCockpit from "@/components/DriverCockpit";

export default function DriverPage() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ubus_theme") as "dark" | "light") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const custom = e as CustomEvent<"dark" | "light">;
      if (custom.detail) setTheme(custom.detail);
    };
    window.addEventListener("set-map-theme", handleThemeChange);
    window.addEventListener("set-app-theme", handleThemeChange);
    return () => {
      window.removeEventListener("set-map-theme", handleThemeChange);
      window.removeEventListener("set-app-theme", handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("ubus_theme", next);
      window.dispatchEvent(new CustomEvent("set-map-theme", { detail: next }));
      window.dispatchEvent(new CustomEvent("set-app-theme", { detail: next }));
    }
  };

  const isLight = theme === "light";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 p-3 sm:p-6 ${
      isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#0d0f0d] text-white"
    }`}>
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-md ${
          isLight ? "bg-white border-slate-200" : "bg-[#141613] border-[#262a25]"
        }`}>
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              isLight
                ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                : "bg-[#1c201a] hover:bg-[#252b21] border-[#2c3327] text-slate-200"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Live Map & Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                isLight
                  ? "bg-slate-100 border-slate-300 text-indigo-600 hover:bg-slate-200"
                  : "bg-[#171a16] border-[#262a25] text-[#facc15] hover:bg-[#252a23]"
              }`}
              title="Toggle Theme"
            >
              {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Embedded Driver Cockpit */}
        <DriverCockpit 
          theme={theme} 
          onBack={() => {
            window.location.href = "/";
          }} 
        />
      </div>
    </div>
  );
}
