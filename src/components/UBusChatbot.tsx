"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface UBusChatbotProps {
  theme?: "dark" | "light";
}

const QUICK_PROMPTS = [
  "How to track nearest bus?",
  "Motijheel route stops?",
  "How does Driver App work?",
];

export default function UBusChatbot({ theme = "dark" }: UBusChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hi! I'm UBus AI. Ask me about bus routes, stops, or live tracking.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isLight = theme === "light";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: query }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.reply || "Unable to respond right now. Try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-3 md:bottom-5 md:right-5 z-40 select-none">
      {isOpen && (
        <div
          className={`mb-2.5 w-80 sm:w-88 border rounded-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isLight
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-[#161916] border-[#262a25] text-white"
          }`}
        >
          {/* Header */}
          <div
            className={`px-3.5 py-2.5 border-b flex items-center justify-between ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#121411] border-[#242823]"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#facc15] text-black flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-black leading-none">UBus AI Assistant</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Powered by Gemini</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isLight ? "hover:bg-slate-200 text-slate-600" : "hover:bg-white/10 text-slate-400"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="p-3 space-y-2.5 h-64 overflow-y-auto custom-scrollbar text-xs"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#facc15] text-black font-semibold"
                      : isLight
                        ? "bg-slate-100 text-slate-800 border border-slate-200"
                        : "bg-[#1d211c] text-slate-200 border border-[#2f352d]"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`px-3 py-2 rounded-lg flex items-center gap-1.5 ${
                    isLight ? "bg-slate-100 text-slate-600" : "bg-[#1d211c] text-slate-400"
                  }`}
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Chips */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-[#1b1e1a] border-[#262a25] text-slate-300 hover:text-white"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className={`p-2.5 border-t flex items-center gap-2 ${
              isLight ? "border-slate-200 bg-slate-50" : "border-[#242823] bg-[#121411]"
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about buses or routes..."
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs outline-none border ${
                isLight
                  ? "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900"
                  : "bg-[#1b1e1a] border-[#2f352d] text-white placeholder:text-slate-500 focus:border-[#facc15]"
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 rounded-lg bg-[#facc15] hover:bg-[#eab308] disabled:opacity-50 text-black flex items-center justify-center shrink-0 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="UBus AI Assistant"
        className="ml-auto w-11 h-11 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black shadow-xl shadow-yellow-500/25 flex items-center justify-center active:scale-95 transition-all border border-yellow-300"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 stroke-[2.2]" />}
      </button>
    </div>
  );
}
