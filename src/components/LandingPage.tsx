"use client";

import { useState } from "react";
import {
  ArrowRight,
  MapPin,
  Bell,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Send,
  Linkedin,
  Github,
  CheckCircle2,
  Navigation,
} from "lucide-react";

interface LandingPageProps {
  onTrackNow: () => void;
  onOpenAuth?: (mode: "login" | "signup") => void;
  theme?: "dark" | "light";
}

export default function LandingPage({
  onTrackNow,
  theme = "dark",
}: LandingPageProps) {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const isLight = theme === "light";

  const testimonials = [
    {
      quote:
        "UBus has transformed my daily commute. I can check where the shuttle is in real time and never miss a bus.",
      name: "Hasibur Rahman",
      role: "Student, CSE Department, IUBAT",
      avatar: "HR",
    },
    {
      quote:
        "Live GPS tracking and traffic updates save me at least 25 minutes every morning between Tongi and campus.",
      name: "Tanvir Ahmed",
      role: "Student, BBA Department, IUBAT",
      avatar: "TA",
    },
    {
      quote:
        "Turn-by-turn ETAs let us see exactly when the shuttle leaves Abdullahpur and arrives at Kamarpara.",
      name: "Fatima Akter",
      role: "Student, CSE Department, IUBAT",
      avatar: "FA",
    },
  ];

  const teamMembers = [
    { name: "Hasibur Rahman", role: "Lead Developer & Architecture", initials: "HR" },
    { name: "IUBAT Transport", role: "Operations & Dispatch", initials: "IT" },
    { name: "Campus Telemetry", role: "IoT GPS & Traffic API", initials: "CT" },
  ];

  const cardSurface = isLight
    ? "bg-white border-slate-200 text-slate-900 shadow-sm"
    : "bg-[#161916] border-[#262a25] text-white";

  const mutedText = isLight ? "text-slate-600" : "text-slate-400";

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#facc15] selection:text-black transition-colors ${
        isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#141613] text-white"
      }`}
    >
      {/* --- HERO --- */}
      <section className="pt-12 pb-14 px-4 max-w-4xl mx-auto flex flex-col items-center text-center">
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border mb-4 ${
            isLight
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
          }`}
        >
          IUBAT Campus Transit
        </span>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
          Track. Notify. Simplify.
        </h1>

        <p className={`text-sm sm:text-base max-w-lg mb-7 leading-relaxed ${mutedText}`}>
          Live university bus locations, route schedules, and real-time ETAs in one clean dashboard.
        </p>

        <button
          onClick={onTrackNow}
          className="group inline-flex items-center gap-2 bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs sm:text-sm px-6 py-3 rounded-lg shadow-md active:scale-95 transition-all mb-10"
        >
          <Navigation className="w-4 h-4 stroke-[2.5]" />
          <span>Open Live Map</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Minimal Route Preview Strip */}
        <div className={`w-full max-w-2xl border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left ${cardSurface}`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs mb-0.5">Live GPS Tracking</h3>
              <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                Follow campus buses in real time with road-snapped ETAs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs mb-0.5">Smart Schedules</h3>
              <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                Check bus departures and manage your personal class routine.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
              isLight ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-[#1c201a] border-[#2c3327] text-[#facc15]"
            }`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs mb-0.5">Instant Alerts</h3>
              <p className={`text-[11px] leading-relaxed ${mutedText}`}>
                Stay updated on route delays, traffic, and campus notices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-10 px-4 max-w-xl mx-auto flex flex-col items-center text-center">
        <div className="flex gap-1 text-yellow-400 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        <div className="w-full flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() =>
              setCurrentTestimonialIndex((p) => (p - 1 + testimonials.length) % testimonials.length)
            }
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 active:scale-95 transition-all ${cardSurface}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <p className={`text-xs sm:text-sm font-medium italic px-2 ${isLight ? "text-slate-700" : "text-slate-200"}`}>
            &ldquo;{testimonials[currentTestimonialIndex].quote}&rdquo;
          </p>

          <button
            onClick={() => setCurrentTestimonialIndex((p) => (p + 1) % testimonials.length)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 active:scale-95 transition-all ${cardSurface}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center font-black text-black text-xs">
            {testimonials[currentTestimonialIndex].avatar}
          </div>
          <div className="text-left">
            <h5 className="font-black text-xs">{testimonials[currentTestimonialIndex].name}</h5>
            <p className={`text-[10px] ${mutedText}`}>{testimonials[currentTestimonialIndex].role}</p>
          </div>
        </div>
      </section>

      {/* --- TEAM --- */}
      <section className="py-10 px-4 max-w-3xl mx-auto text-center">
        <h2 className="text-xl sm:text-2xl font-black mb-1">Our Team</h2>
        <p className={`text-xs mb-6 ${mutedText}`}>Built for students and campus transit.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {teamMembers.map((member, i) => (
            <div key={i} className={`border rounded-lg p-4 flex flex-col items-center ${cardSurface}`}>
              <div className={`w-12 h-12 rounded-lg mb-2.5 flex items-center justify-center font-black text-sm ${
                isLight ? "bg-slate-100 text-slate-700" : "bg-[#1b1e1a] text-[#facc15]"
              }`}>
                {member.initials}
              </div>
              <h5 className="font-bold text-xs mb-0.5">{member.name}</h5>
              <p className={`text-[10px] mb-2.5 ${mutedText}`}>{member.role}</p>
              <div className={`flex items-center gap-2 ${mutedText}`}>
                <Linkedin className="w-3.5 h-3.5 hover:text-[#facc15] cursor-pointer" />
                <Github className="w-3.5 h-3.5 hover:text-[#facc15] cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact-section" className="py-10 px-4 max-w-md mx-auto pb-16">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black mb-1">Contact Us</h2>
          <p className={`text-xs ${mutedText}`}>Questions or feedback? Send us a quick message.</p>
        </div>

        {contactSubmitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5 text-center text-emerald-500">
            <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5" />
            <p className="font-bold text-xs">Message received! We will get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-3 text-left">
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="First name"
                className={`w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-[#facc15] ${
                  isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#1b1e1a] border-[#262a25] text-white"
                }`}
              />
              <input
                type="text"
                required
                placeholder="Last name"
                className={`w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-[#facc15] ${
                  isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#1b1e1a] border-[#262a25] text-white"
                }`}
              />
            </div>
            <input
              type="email"
              required
              placeholder="you@iubat.edu"
              className={`w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-[#facc15] ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#1b1e1a] border-[#262a25] text-white"
              }`}
            />
            <textarea
              rows={3}
              required
              placeholder="Write your message..."
              className={`w-full border rounded-lg px-3 py-2 text-xs outline-none focus:border-[#facc15] resize-none ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#1b1e1a] border-[#262a25] text-white"
              }`}
            />
            <button
              type="submit"
              className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
