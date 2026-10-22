"use client";

import { X, Bell } from "lucide-react";

export interface NoticeItem {
  id: string;
  title: string;
  category: "service" | "alert" | "schedule" | "system";
  timestamp: string;
  message: string;
  badge: string;
  badgeColor: string;
}

const DEFAULT_NOTICES: NoticeItem[] = [
  {
    id: "1",
    title: "Midterm Exam Special Shuttle Activated",
    category: "schedule",
    timestamp: "10 mins ago",
    message: "Extra shuttles for Bus #12 (Tongi - IUBAT) and Bus #19 (Motijheel) will depart campus at 12:45 PM & 03:30 PM for midterm examinees.",
    badge: "EXAM SCHEDULE",
    badgeColor: "bg-[#28230b] border-[#4c4217] text-[#d4c264]",
  },
  {
    id: "2",
    title: "Tongi Bridge Road Construction Slowdown",
    category: "alert",
    timestamp: "25 mins ago",
    message: "Heavy congestion reported near Cherag Ali bus stand. Average delay is 10-12 minutes. Plan your morning commute accordingly.",
    badge: "CONGESTION",
    badgeColor: "bg-[#2b0d0d] border-[#4a1818] text-[#fca5a5]",
  },
  {
    id: "3",
    title: "AI Vision Telemetry Deployed on Bus #12",
    category: "system",
    timestamp: "1 hour ago",
    message: "ESP32-CAM and YOLO traffic intelligence is now actively estimating real-time crowd density and congestion along the Uttara route.",
    badge: "LIVE AI",
    badgeColor: "bg-[#0c2419] border-[#164630] text-[#7be4aa]",
  },
  {
    id: "4",
    title: "Driver Companion App Now Live",
    category: "service",
    timestamp: "Today at 08:00 AM",
    message: "Bus drivers are now updating passenger crowd density (Seats Open, Standing Only, Bus Full) in real-time.",
    badge: "NEW FEATURE",
    badgeColor: "bg-[#1f241d] border-[#2f382b] text-[#facc15]",
  },
];

interface NoticeBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NoticeBoardModal({ isOpen, onClose }: NoticeBoardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#161916] border border-[#262a25] rounded-2xl p-6 sm:p-7 shadow-2xl text-white select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#242823]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#28230b] border border-[#4c4217] flex items-center justify-center text-[#facc15]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Notice Board & Alerts</h3>
              <p className="text-[10px] text-slate-400">Live service notices & university transit updates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices List */}
        <div className="my-4 space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {DEFAULT_NOTICES.map((notice) => (
            <div
              key={notice.id}
              className="bg-[#1d211c] border border-[#2f352d] hover:border-[#3d453a] rounded-xl p-4 transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${notice.badgeColor}`}>
                  {notice.badge}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{notice.timestamp}</span>
              </div>

              <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-[#facc15] transition-colors mb-1">
                {notice.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {notice.message}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#242823] flex items-center justify-between text-[11px] text-slate-400">
          <span>All transit notices verified by IUBAT Transport Division</span>
          <button
            onClick={onClose}
            className="bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs px-4 py-2 rounded-xl transition-all"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
}
