import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are UBus AI, a concise and helpful transit assistant for the IUBAT University Bus Tracking System (UBUS V2).
Key facts:
- Main campus: IUBAT Campus (Kamarpara, Uttara Sector 10, Dhaka).
- Major stops: Cherag Ali, Tongi Station Road, Abdullahpur, House Building, Azampur, Jashimuddin, Airport, Kuril, Kamarpara, Motijheel, Mirpur, Savar, Gazipur.
- Features: Live GPS bus tracking (Google Streets, OSM, Google Satellite, Google Terrain + MapLibre 3D), OSRM turn-by-turn ETA & traffic layer, Bus Schedule, Class Schedule, Driver App (/driver), and Notice Board.
Keep answers short (2-4 sentences), friendly, and practical. You can reply in English or Banglish matching the user's language.`;

function getFallbackReply(message: string): string {
  const q = message.toLowerCase();
  if (q.includes("motijheel") || q.includes("route") || q.includes("bus")) {
    return "You can view all 15+ IUBAT bus routes (including Motijheel, Uttara, Mirpur, Savar, and Gazipur) in the **Bus Schedule** tab. Tap any route to see stop-by-stop pickup times and bus numbers.";
  }
  if (q.includes("track") || q.includes("live") || q.includes("gps") || q.includes("near")) {
    return "Click **Track Near Me** (or the center yellow navigation button on mobile) to share your GPS location and find the nearest active bus with live road-snapped ETA.";
  }
  if (q.includes("driver")) {
    return "Bus drivers can open **Driver App** (`/driver`) to select their bus number and broadcast live GPS coordinates directly to the student map.";
  }
  if (q.includes("class") || q.includes("schedule")) {
    return "Open the **Class Schedule** tab to add, edit, or delete your daily classes and toggle countdown alerts.";
  }
  return "Hi! I'm **UBus AI**. Ask me about IUBAT bus routes, stops (Abdullahpur, Kamarpara, Tongi, Motijheel), live GPS tracking, or class schedules. (Add `GEMINI_API_KEY` in `.env.local` for full Gemini AI responses.)";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: getFallbackReply(message), mode: "fallback" });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${message}` }],
            },
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ reply: getFallbackReply(message), mode: "fallback" });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      getFallbackReply(message);

    return NextResponse.json({ reply, mode: "gemini" });
  } catch {
    return NextResponse.json({
      reply: "Sorry, I had trouble answering that. Please try again.",
      mode: "error",
    });
  }
}
