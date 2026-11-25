"use client";

import { useState } from "react";
import { 
  ArrowRight, 
  MapPin, 
  Bell, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Bus, 
  Send, 
  Linkedin, 
  Github, 
  Twitter, 
  CheckCircle2 
} from "lucide-react";

interface LandingPageProps {
  onTrackNow: () => void;
  onOpenAuth?: (mode: "login" | "signup") => void;
}

export default function LandingPage({ onTrackNow }: LandingPageProps) {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const testimonials = [
    {
      quote:
        "The bus tracking system has transformed my daily commute. I can now plan my schedule more effectively and never miss a bus!",
      name: "Hasibur Rahman",
      role: "Student, CSE Department, IUBAT",
      avatar: "HR",
    },
    {
      quote:
        "Real-time GPS tracking and congestion alerts save me at least 30 minutes every morning between Tongi and campus.",
      name: "Tanvir Ahmed",
      role: "Student, BBA Department, IUBAT",
      avatar: "TA",
    },
    {
      quote:
        "The turn-by-turn traffic layer helps us know exactly when the shuttle leaves Abdullahpur and arrives at Kamarpara.",
      name: "Fatima Akter",
      role: "Student, CSE Department, IUBAT",
      avatar: "FA",
    },
  ];

  const teamMembers = [
    { name: "Hasibur Rahman", role: "Team Lead & Embedded/AI", initials: "HR" },
    { name: "Hasibur Rahman", role: "Frontend & Geospatial", initials: "HR" },
    { name: "Hasibur Rahman", role: "Hardware & IoT GPS", initials: "HR" },
    { name: "Hasibur Rahman", role: "Backend & Supabase", initials: "HR" },
    { name: "Hasibur Rahman", role: "UI/UX Design", initials: "HR" },
    { name: "Hasibur Rahman", role: "QA & Telemetry Tester", initials: "HR" },
  ];

  const handleNextTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-[#141613] text-white font-sans selection:bg-[#facc15] selection:text-black">
      {/* --- HERO SECTION --- */}
      <section className="relative pt-12 pb-16 px-4 max-w-4xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 -z-10 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Track. Notify. Simplify.
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-lg mb-8 leading-relaxed">
          Welcome to the IUBAT Bus Tracking System. Access live bus locations, schedules, and important updates all in one place.
        </p>

        {/* Yellow CTA Button */}
        <button
          onClick={onTrackNow}
          className="group inline-flex items-center gap-2.5 bg-[#facc15] hover:bg-[#eab308] text-black font-black text-sm px-7 py-3.5 rounded-xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all mb-12"
        >
          <span>Track Now</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* 3D Route Map Board Graphic (Replicating Video 00:01) */}
        <div className="relative w-full max-w-md p-6 bg-[#161916] border border-[#262a25] rounded-2xl shadow-2xl flex flex-col items-center overflow-hidden">
          {/* Subtle grid texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Curved Route Visual */}
          <div className="relative w-full h-48 flex items-center justify-center">
            <svg
              className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              viewBox="0 0 320 180"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Path glowing base */}
              <path
                d="M 30 140 C 90 140, 100 80, 160 85 C 220 90, 230 40, 280 40"
                stroke="#38bdf8"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 30 140 C 90 140, 100 80, 160 85 C 220 90, 230 40, 280 40"
                stroke="#60a5fa"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Start node */}
              <circle cx="30" cy="140" r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
              {/* End pin pin-point */}
              <circle cx="280" cy="40" r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
              <circle cx="280" cy="40" r="4" fill="#ffffff" />
            </svg>

            {/* Glowing Map Pin Tag */}
            <div className="absolute top-4 right-12 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30 shadow-lg animate-bounce">
              IUBAT Main Gate
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: DISCOVER THE KEY BENEFITS (Video 00:02) --- */}
      <section id="benefits-section" className="py-16 px-4 max-w-4xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
          Discover the key benefits
        </h2>
        <p className="text-sm text-slate-400 max-w-md mb-10">
          Track buses in real-time and get instant notifications, all from an easy-to-use dashboard.
        </p>

        {/* 3D Bus Illustration & Badge */}
        <div className="relative mb-12 flex flex-col items-center">
          {/* Animated 3D Bus SVG Badge */}
          <div className="relative w-48 h-36 bg-gradient-to-tr from-[#facc15] to-[#fde047] rounded-3xl p-4 shadow-2xl shadow-yellow-500/30 flex flex-col justify-between border-4 border-slate-900 group hover:rotate-1 transition-transform">
            {/* Bus Roof & windshield */}
            <div className="flex justify-between items-center px-2 pt-1">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-1.5 bg-slate-900 rounded-sm" />
                <span className="w-2.5 h-1.5 bg-slate-900 rounded-sm" />
              </div>
              <span className="text-[10px] font-black tracking-widest text-slate-900 bg-white/70 px-2 py-0.5 rounded-md">
                UBUS
              </span>
            </div>

            {/* Windshield */}
            <div className="w-full h-12 bg-slate-900/90 rounded-xl flex items-center justify-around px-2 border border-slate-700/50">
              <div className="w-5/12 h-8 bg-sky-300/40 rounded-lg backdrop-blur-sm" />
              <div className="w-5/12 h-8 bg-sky-300/40 rounded-lg backdrop-blur-sm" />
            </div>

            {/* Grille & Headlights */}
            <div className="flex justify-between items-center px-1">
              <span className="w-4 h-4 bg-white rounded-full border-2 border-slate-900 shadow-md" />
              <div className="flex gap-1">
                <span className="w-4 h-1 bg-slate-900 rounded-full" />
                <span className="w-4 h-1 bg-slate-900 rounded-full" />
                <span className="w-4 h-1 bg-slate-900 rounded-full" />
              </div>
              <span className="w-4 h-4 bg-white rounded-full border-2 border-slate-900 shadow-md" />
            </div>
          </div>

          {/* Floating Calendar Notification Icon */}
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#1e2330] border border-white/20 rounded-2xl flex items-center justify-center text-yellow-400 shadow-xl">
            📅
          </div>
        </div>

        {/* Two Key Benefit Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl text-center sm:text-left">
          {/* Benefit 1 */}
          <div className="bg-[#161916] border border-[#262a25] rounded-2xl p-6 flex flex-col items-center sm:items-start space-y-3 hover:border-[#facc15]/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-[#1b1e1a] border border-[#262a25] flex items-center justify-center text-[#facc15]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg text-white">Real-Time Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              View live bus locations and stay updated on their arrival times.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="bg-[#161916] border border-[#262a25] rounded-2xl p-6 flex flex-col items-center sm:items-start space-y-3 hover:border-[#facc15]/40 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-[#1b1e1a] border border-[#262a25] flex items-center justify-center text-[#facc15]">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg text-white">Schedule Notifications</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive alerts about bus schedules and any important service changes.
            </p>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: EXPLORE ESSENTIAL FEATURES (Video 00:04) --- */}
      <section className="py-16 px-4 max-w-2xl mx-auto flex flex-col items-center text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight">
          Explore Our Essential Bus Tracking Features
        </h2>

        <div className="w-full space-y-6">
          <div className="bg-[#161916] border border-[#262a25] rounded-xl p-5 text-center">
            <h4 className="font-black text-white text-base mb-1.5">User-Friendly Dashboard</h4>
            <p className="text-xs text-slate-400">
              The dashboard provides instant access to bus tracking, schedules, and notifications.
            </p>
          </div>

          <div className="bg-[#161916] border border-[#262a25] rounded-xl p-5 text-center">
            <h4 className="font-black text-white text-base mb-1.5">Find Nearest Bus</h4>
            <p className="text-xs text-slate-400">
              Find the nearest bus from your current location.
            </p>
          </div>

          <div className="bg-[#161916] border border-[#262a25] rounded-xl p-5 text-center">
            <h4 className="font-black text-white text-base mb-1.5">Stay Informed With Our Notice Board</h4>
            <p className="text-xs text-slate-400">
              Receive timely updates on schedules and important notices.
            </p>
          </div>
        </div>
      </section>

      {/* --- SECTION 4: TESTIMONIALS SLIDER (Video 00:05) --- */}
      <section id="testimonials-section" className="py-16 px-4 max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Star Rating */}
        <div className="flex gap-1 text-yellow-400 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        {/* Quote & Carousel Controls */}
        <div className="relative w-full flex items-center justify-between gap-3 mb-6">
          <button
            onClick={handlePrevTestimonial}
            className="w-9 h-9 rounded-full bg-[#1b1e1a] hover:bg-[#262a25] border border-[#262a25] flex items-center justify-center text-slate-300 hover:text-white shrink-0 active:scale-95 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <p className="text-sm sm:text-base font-medium text-slate-200 italic px-2">
            &ldquo;{testimonials[currentTestimonialIndex].quote}&rdquo;
          </p>

          <button
            onClick={handleNextTestimonial}
            className="w-9 h-9 rounded-full bg-[#1b1e1a] hover:bg-[#262a25] border border-[#262a25] flex items-center justify-center text-slate-300 hover:text-white shrink-0 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center font-black text-black text-xs border border-white/20">
            {testimonials[currentTestimonialIndex].avatar}
          </div>
          <div className="text-left">
            <h5 className="font-black text-sm text-white">
              {testimonials[currentTestimonialIndex].name}
            </h5>
            <p className="text-[11px] text-slate-400">
              {testimonials[currentTestimonialIndex].role}
            </p>
          </div>
        </div>
      </section>

      {/* --- SECTION 5: TOGETHER OUR TEAM (Video 00:06) --- */}
      <section className="py-16 px-4 max-w-3xl mx-auto flex flex-col items-center text-center">
        <span className="text-xs font-black text-[#facc15] uppercase tracking-widest mb-1">
          Together
        </span>
        <h2 className="text-3xl font-black text-white mb-2">Our Team</h2>
        <p className="text-xs text-slate-400 mb-10 max-w-sm">
          Meet the dedicated professionals behind our service.
        </p>

        {/* 2-column or 3-column Team Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="bg-[#161916] border border-[#262a25] rounded-xl p-5 flex flex-col items-center hover:border-[#383e35] transition-all group"
            >
              {/* Avatar placeholder tile matching video */}
              <div className="w-full aspect-square bg-[#1b1e1a] rounded-lg mb-3 flex items-center justify-center text-slate-500 font-black text-sm group-hover:bg-[#262a25] transition-colors">
                {member.initials}
              </div>
              <h5 className="font-bold text-xs text-white mb-0.5">{member.name}</h5>
              <p className="text-[10px] text-slate-400 mb-3">{member.role}</p>

              {/* Social icons */}
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-200">
                <Linkedin className="w-3.5 h-3.5 hover:text-[#facc15] cursor-pointer" />
                <Github className="w-3.5 h-3.5 hover:text-[#facc15] cursor-pointer" />
                <Twitter className="w-3.5 h-3.5 hover:text-[#facc15] cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- SECTION 6: CONTACT OUR TEAM (Video 00:08) --- */}
      <section id="contact-section" className="py-16 px-4 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Contact our team</h2>
          <p className="text-xs text-slate-400">
            Got any questions about the product or scaling on our platform? We&apos;re here to help. Chat to our friendly team 24/7.
          </p>
        </div>

        {contactSubmitted ? (
          <div className="bg-green-950/40 border border-green-500/30 rounded-xl p-6 text-center text-green-300">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="font-bold text-sm">Message received!</p>
            <p className="text-xs text-slate-400 mt-1">Our team will get back to you within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">First name</label>
                <input
                  type="text"
                  required
                  placeholder="First name"
                  className="w-full bg-[#1b1e1a] border border-[#262a25] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#facc15]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Last name</label>
                <input
                  type="text"
                  required
                  placeholder="Last name"
                  className="w-full bg-[#1b1e1a] border border-[#262a25] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="w-full bg-[#1b1e1a] border border-[#262a25] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone number</label>
              <input
                type="tel"
                placeholder="+088 183000400"
                className="w-full bg-[#1b1e1a] border border-[#262a25] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Message</label>
              <textarea
                rows={3}
                required
                placeholder="Leave us a message..."
                className="w-full bg-[#1b1e1a] border border-[#262a25] rounded-lg px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#facc15] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-black text-xs py-3 rounded-lg shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send message</span>
            </button>
          </form>
        )}
      </section>

      {/* --- FOOTER (Video 00:09) --- */}
      <footer className="border-t border-white/10 py-12 px-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-black">
                <Bus className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-base tracking-tight text-white">UBus</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Access live bus locations, schedules, and important updates all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <h6 className="font-black text-white uppercase text-[10px] tracking-wider mb-2">Resources</h6>
              <ul className="space-y-1.5 text-slate-400">
                <li className="hover:text-yellow-400 cursor-pointer">Newsletter</li>
                <li className="hover:text-yellow-400 cursor-pointer">Blog</li>
                <li className="hover:text-yellow-400 cursor-pointer">Support</li>
              </ul>
            </div>
            <div>
              <h6 className="font-black text-white uppercase text-[10px] tracking-wider mb-2">Socials</h6>
              <ul className="space-y-1.5 text-slate-400">
                <li className="hover:text-yellow-400 cursor-pointer">Facebook</li>
                <li className="hover:text-yellow-400 cursor-pointer">LinkedIn</li>
                <li className="hover:text-yellow-400 cursor-pointer">GitHub</li>
              </ul>
            </div>
            <div>
              <h6 className="font-black text-white uppercase text-[10px] tracking-wider mb-2">Important</h6>
              <ul className="space-y-1.5 text-slate-400">
                <li className="hover:text-yellow-400 cursor-pointer">Settings</li>
                <li className="hover:text-yellow-400 cursor-pointer">Contact</li>
              </ul>
            </div>
            <div>
              <h6 className="font-black text-white uppercase text-[10px] tracking-wider mb-2">Legals</h6>
              <ul className="space-y-1.5 text-slate-400">
                <li className="hover:text-yellow-400 cursor-pointer">License</li>
                <li className="hover:text-yellow-400 cursor-pointer">Privacy</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} UBus V2 — IUBAT Real-Time Transit Intelligence. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
