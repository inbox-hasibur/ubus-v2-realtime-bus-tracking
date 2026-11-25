"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Clock, Bell, Upload, Image as ImageIcon, Loader2, X, UserCheck, LogOut } from "lucide-react";

export interface ClassScheduleItem {
  id: string;
  time: string;
  code: string;
  title: string;
  status: "missed" | "active" | "next";
  countdown?: string;
}

const INITIAL_CLASSES: ClassScheduleItem[] = [
  { id: "1", time: "08:30 AM", code: "CSC 283", title: "C++", status: "missed" },
  { id: "2", time: "09:55 AM", code: "CSC 433", title: "Database Management System", status: "active", countdown: "0h 3m" },
  { id: "3", time: "11:20 AM", code: "CSC 197", title: "Assembly", status: "next" },
  { id: "4", time: "02:35 PM", code: "CSC 247", title: "Computer Architecture & Organization", status: "next" },
  { id: "5", time: "11:20 AM", code: "CSC 397", title: "Theory of Computation", status: "next" },
];

interface ClassScheduleProps {
  theme?: "dark" | "light";
}

export default function ClassSchedule({ theme: propTheme }: ClassScheduleProps) {
  const [studentId, setStudentId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ubus_class_student_id");
    }
    return null;
  });
  const [studentIdInput, setStudentIdInput] = useState("");

  const [classes, setClasses] = useState<ClassScheduleItem[]>(() => {
    if (typeof window !== "undefined") {
      const activeId = localStorage.getItem("ubus_class_student_id") || "guest";
      const saved = localStorage.getItem(`ubus_class_schedule_${activeId}`);
      if (saved) {
        try {
          return JSON.parse(saved) as ClassScheduleItem[];
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_CLASSES;
  });

  const [routineImage, setRoutineImage] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const activeId = localStorage.getItem("ubus_class_student_id") || "guest";
      return localStorage.getItem(`ubus_class_image_${activeId}`);
    }
    return null;
  });
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Persist schedule changes per Student ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeId = studentId || "guest";
      localStorage.setItem(`ubus_class_schedule_${activeId}`, JSON.stringify(classes));
    }
  }, [classes, studentId]);

  const handleStudentIdLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = studentIdInput.trim();
    if (!cleaned) return;
    setStudentId(cleaned);
    setStudentIdInput("");
    if (typeof window !== "undefined") {
      localStorage.setItem("ubus_class_student_id", cleaned);
      const saved = localStorage.getItem(`ubus_class_schedule_${cleaned}`);
      if (saved) {
        try {
          setClasses(JSON.parse(saved) as ClassScheduleItem[]);
        } catch {
          setClasses(INITIAL_CLASSES);
        }
      } else {
        setClasses(INITIAL_CLASSES);
      }
      setRoutineImage(localStorage.getItem(`ubus_class_image_${cleaned}`));
    }
    setScanStatus(null);
  };

  const handleStudentIdLogout = () => {
    setStudentId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ubus_class_student_id");
      const guestSaved = localStorage.getItem("ubus_class_schedule_guest");
      setClasses(guestSaved ? (JSON.parse(guestSaved) as ClassScheduleItem[]) : INITIAL_CLASSES);
      setRoutineImage(localStorage.getItem("ubus_class_image_guest"));
    }
    setScanStatus(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setRoutineImage(dataUrl);
      if (typeof window !== "undefined") {
        const activeId = studentId || "guest";
        localStorage.setItem(`ubus_class_image_${activeId}`, dataUrl);
      }

      setIsScanning(true);
      setScanStatus("Scanning routine image...");
      try {
        const res = await fetch("/api/scan-schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type || "image/png",
          }),
        });
        const data = await res.json();
        if (Array.isArray(data?.classes) && data.classes.length > 0) {
          setClasses(data.classes);
        }
        setScanStatus(data?.message || "Routine image saved!");
      } catch {
        setScanStatus("Routine image saved! You can view it anytime or edit rows manually below.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isLight = (propTheme || localTheme) === "light";

  // Bottom action states
  const [selectedModifyRow, setSelectedModifyRow] = useState("03");
  const [modifyTime, setModifyTime] = useState("11:20 AM");
  const [modifyName, setModifyName] = useState("CSC 197 Assembly");

  const [addTime, setAddTime] = useState("");
  const [addName, setAddName] = useState("");

  const [selectedDeleteRow, setSelectedDeleteRow] = useState("01");
  const [isAlertActive, setIsAlertActive] = useState(false);

  // Handle Modify
  const handleModify = () => {
    const rowIdx = parseInt(selectedModifyRow, 10) - 1;
    if (rowIdx >= 0 && rowIdx < classes.length) {
      const updated = [...classes];
      const parts = modifyName.split(" ");
      const code = parts.slice(0, 2).join(" ");
      const title = parts.slice(2).join(" ") || modifyName;

      updated[rowIdx] = {
        ...updated[rowIdx],
        time: modifyTime || updated[rowIdx].time,
        code: code || updated[rowIdx].code,
        title: title || updated[rowIdx].title,
      };
      setClasses(updated);
    }
  };

  // Handle Add
  const handleAdd = () => {
    if (!addTime || !addName) return;
    const parts = addName.split(" ");
    const code = parts.length > 1 ? parts.slice(0, 2).join(" ") : "CSC 100";
    const title = parts.length > 1 ? parts.slice(2).join(" ") : addName;

    const newClass: ClassScheduleItem = {
      id: String(Date.now()),
      time: addTime,
      code,
      title,
      status: "next",
    };
    setClasses([...classes, newClass]);
    setAddTime("");
    setAddName("");
  };

  // Handle Delete
  const handleDelete = () => {
    const rowIdx = parseInt(selectedDeleteRow, 10) - 1;
    if (rowIdx >= 0 && rowIdx < classes.length) {
      const updated = classes.filter((_, idx) => idx !== rowIdx);
      setClasses(updated);
    }
  };

  return (
    <div className={`w-full max-w-xl mx-auto py-4 px-3 sm:px-4 font-sans transition-colors ${
      isLight ? "text-slate-900" : "text-white"
    }`}>
      {/* Passwordless Student ID Bar */}
      <div className={`rounded-lg p-3 mb-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
        isLight ? "bg-slate-50 border-slate-200" : "bg-[#161916] border-[#262a25]"
      }`}>
        {studentId ? (
          <>
            <div className="flex items-center gap-2 text-xs font-bold">
              <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Student ID: <span className="font-black text-[#facc15] bg-black/80 px-2 py-0.5 rounded">{studentId}</span></span>
            </div>
            <button
              type="button"
              onClick={handleStudentIdLogout}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 self-start sm:self-auto ${
                isLight ? "bg-white border-slate-300 text-slate-700 hover:text-black" : "bg-[#1b1e1a] border-[#2f352d] text-slate-300 hover:text-white"
              }`}
            >
              <LogOut className="w-3 h-3" />
              <span>Switch ID</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleStudentIdLogin} className="w-full flex items-center gap-2">
            <input
              type="text"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              placeholder="Enter Student ID (e.g. 22303089)"
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none border ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-slate-900"
                  : "bg-[#1b1e1a] border-[#2f352d] text-white placeholder:text-slate-500 focus:border-[#facc15]"
              }`}
            />
            <button
              type="submit"
              className="bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs px-3.5 py-1.5 rounded-lg shrink-0 active:scale-95 transition-all"
            >
              Load ID
            </button>
          </form>
        )}
      </div>

      {/* Title & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className={`text-xl sm:text-2xl font-black tracking-tight uppercase ${
          isLight ? "text-slate-900" : "text-white"
        }`}>
          Class Schedule
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isLight
                ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                : "bg-[#161916] border-[#262a25] text-slate-200 hover:text-white"
            }`}
          >
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#facc15]" /> : <Upload className="w-3.5 h-3.5 text-[#facc15]" />}
            <span>{isScanning ? "Scanning..." : "Scan Image"}</span>
          </button>

          {routineImage && (
            <button
              type="button"
              onClick={() => setShowRoutineModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-[#facc15] hover:bg-[#eab308] text-black flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>View Image</span>
            </button>
          )}

          <button
            onClick={() => setIsAlertActive(!isAlertActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
              isAlertActive
                ? "bg-[#facc15] text-black shadow-md shadow-yellow-500/20 border-yellow-400"
                : isLight
                  ? "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900"
                  : "bg-[#161916] border-[#262a25] text-slate-300 hover:text-white"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isAlertActive ? "Alerts ON" : "Notify Me"}</span>
          </button>
        </div>
      </div>

      {scanStatus && (
        <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-semibold border ${
          isLight ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-[#1c201a] border-[#2c3327] text-amber-300"
        }`}>
          {scanStatus}
        </div>
      )}

      {/* --- Schedule Table / Rows --- */}
      <div className="space-y-2.5 mb-8">
        {classes.map((cls, index) => {
          return (
            <div
              key={cls.id || index}
              className={`rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2.5 shadow-md transition-all group border ${
                isLight
                  ? "bg-white border-slate-200 hover:border-slate-300 shadow-slate-900/5"
                  : "bg-[#161916] border-[#262a25] hover:border-[#383e35]"
              }`}
            >
              {/* Left: Time Badge */}
              <div className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shrink-0 border ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-900"
                  : "bg-[#1b1e1a] border-[#262a25] text-slate-100"
              }`}>
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-500 shrink-0" />
                <span className="text-[11px] sm:text-sm font-black whitespace-nowrap">
                  {cls.time}
                </span>
              </div>

              {/* Middle: Course Code & Title */}
              <div className="flex-1 min-w-0 px-1 sm:px-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1">
                  <span className={`text-xs sm:text-sm font-black tracking-tight shrink-0 ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}>
                    {cls.code}
                  </span>
                  <span className={`text-[11px] sm:text-xs font-semibold truncate ${
                    isLight ? "text-slate-600" : "text-slate-300"
                  }`}>
                    {cls.title}
                  </span>
                </div>
              </div>

              {/* Right: Status Pill (Missed / 0h 3m / Next) */}
              <div className="shrink-0">
                {cls.status === "missed" && (
                  <span className="inline-block text-center text-[11px] sm:text-xs font-black text-red-500 bg-red-500/10 border border-red-500/30 px-2 sm:px-3 py-1 rounded-lg min-w-[56px] sm:min-w-[70px]">
                    Missed
                  </span>
                )}
                {cls.status === "active" && (
                  <span className="inline-block text-center text-[11px] sm:text-xs font-black text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 sm:px-3 py-1 rounded-lg min-w-[56px] sm:min-w-[70px] animate-pulse">
                    {cls.countdown || "0h 3m"}
                  </span>
                )}
                {cls.status === "next" && (
                  <span className="inline-block text-center text-[11px] sm:text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-3 py-1 rounded-lg min-w-[56px] sm:min-w-[70px]">
                    Next
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Bottom Controls Panel --- */}
      <div className={`rounded-lg p-4 sm:p-5 shadow-2xl space-y-4 border ${
        isLight
          ? "bg-slate-50 border-slate-200 text-slate-900 shadow-slate-900/5"
          : "bg-[#141613] border-[#262a25] text-white shadow-black/50"
      }`}>
        
        {/* 1. Modify Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleModify}
              className={`font-black text-xs px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 shrink-0 border ${
                isLight
                  ? "bg-white hover:bg-[#facc15] hover:text-black text-slate-800 border-slate-300"
                  : "bg-[#1b1e1a] hover:bg-[#facc15] hover:text-black text-slate-200 border-[#262a25]"
              }`}
            >
              Modify
            </button>

            <div className="relative">
              <select
                value={selectedModifyRow}
                onChange={(e) => {
                  setSelectedModifyRow(e.target.value);
                  const idx = parseInt(e.target.value, 10) - 1;
                  if (classes[idx]) {
                    setModifyTime(classes[idx].time);
                    setModifyName(`${classes[idx].code} ${classes[idx].title}`);
                  }
                }}
                className={`text-xs font-bold rounded-lg px-3 py-2 pr-7 outline-none appearance-none cursor-pointer border ${
                  isLight
                    ? "bg-white text-slate-900 border-slate-300"
                    : "bg-[#1b1e1a] text-white border-[#262a25]"
                }`}
              >
                {classes.map((_, i) => {
                  const label = String(i + 1).padStart(2, "0");
                  return (
                    <option key={i} value={label} className={isLight ? "bg-white text-slate-900" : "bg-[#161916] text-white"}>
                      Row {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={modifyTime}
              onChange={(e) => setModifyTime(e.target.value)}
              placeholder="11:20 AM"
              className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-all border ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                  : "bg-[#1b1e1a] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
              }`}
            />
            <input
              type="text"
              value={modifyName}
              onChange={(e) => setModifyName(e.target.value)}
              placeholder="Course Code & Name"
              className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-all border ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                  : "bg-[#1b1e1a] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
              }`}
            />
          </div>
        </div>

        <div className={`w-full h-px ${isLight ? "bg-slate-200" : "bg-white/5"}`} />

        {/* 2. Add Section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handleAdd}
            className={`font-black text-xs px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 shrink-0 border ${
              isLight
                ? "bg-white hover:bg-[#facc15] hover:text-black text-slate-800 border-slate-300"
                : "bg-[#1b1e1a] hover:bg-[#facc15] hover:text-black text-slate-200 border-[#262a25]"
            }`}
          >
            Add
          </button>
          <input
            type="text"
            value={addTime}
            onChange={(e) => setAddTime(e.target.value)}
            placeholder="Time (e.g. 03:00 PM)"
            className={`flex-1 rounded-lg px-3 py-2 text-xs outline-none transition-all border ${
              isLight
                ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                : "bg-[#1b1e1a] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
            }`}
          />
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Course Name (e.g. CSC 440 AI)"
            className={`flex-1 rounded-lg px-3 py-2 text-xs outline-none transition-all border ${
              isLight
                ? "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500"
                : "bg-[#1b1e1a] border-[#262a25] text-white placeholder:text-slate-500 focus:border-[#facc15]"
            }`}
          />
        </div>

        <div className={`w-full h-px ${isLight ? "bg-slate-200" : "bg-white/5"}`} />

        {/* 3. Delete Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className={`font-black text-xs px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 shrink-0 border ${
              isLight
                ? "bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border-red-200"
                : "bg-[#2e1414] hover:bg-red-600 text-red-300 hover:text-white border-red-500/20"
            }`}
          >
            Delete
          </button>
          <div className="relative">
            <select
              value={selectedDeleteRow}
              onChange={(e) => setSelectedDeleteRow(e.target.value)}
              className={`text-xs font-bold rounded-lg px-3 py-2 pr-7 outline-none appearance-none cursor-pointer border ${
                isLight
                  ? "bg-white text-slate-900 border-slate-300"
                  : "bg-[#1b1e1a] text-white border-[#262a25]"
              }`}
            >
              {classes.map((_, i) => {
                const label = String(i + 1).padStart(2, "0");
                return (
                  <option key={i} value={label} className={isLight ? "bg-white text-slate-900" : "bg-[#161916] text-white"}>
                    Row {label}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Saved Routine Image Viewer Modal */}
      {showRoutineModal && routineImage && (
        <div
          onClick={() => setShowRoutineModal(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-2xl w-full rounded-lg border p-3 shadow-2xl ${
              isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#161916] border-[#262a25] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/10 dark:border-white/10">
              <span className="text-xs font-black uppercase tracking-wider">
                Saved Routine Image {studentId ? `(${studentId})` : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowRoutineModal(false)}
                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={routineImage}
              alt="Saved Class Routine"
              className="w-full max-h-[75vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
