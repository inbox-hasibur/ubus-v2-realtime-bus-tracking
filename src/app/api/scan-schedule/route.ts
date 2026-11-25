import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "image/png";

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          classes: [],
          mode: "manual",
          message:
            "Routine image saved! Add GEMINI_API_KEY in environment variables for automatic OCR scan, or use Add/Modify below.",
        },
        { status: 200 }
      );
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Extract all class schedule rows from this university routine image. Return ONLY a valid JSON array of objects with keys: "time" (e.g. "08:30 AM"), "code" (e.g. "CSC 283"), and "title" (e.g. "Database Management System"). No markdown, no explanation.`,
                },
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        classes: [],
        mode: "manual",
        message: "Routine image saved! Auto-scan unavailable right now — please verify or add rows manually.",
      });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    const classes = Array.isArray(parsed)
      ? parsed
          .filter((item) => item && (item.time || item.code || item.title))
          .map((item, idx) => ({
            id: String(Date.now() + idx),
            time: String(item.time || "09:00 AM"),
            code: String(item.code || "COURSE"),
            title: String(item.title || "Class Session"),
            status: "next" as const,
          }))
      : [];

    return NextResponse.json({
      classes,
      mode: "gemini",
      message:
        classes.length > 0
          ? `Detected ${classes.length} classes from your routine image!`
          : "Routine image saved! Could not auto-detect rows — please add or modify manually.",
    });
  } catch {
    return NextResponse.json({
      classes: [],
      mode: "manual",
      message: "Routine image saved! Auto-scan failed — you can still view the image and edit rows manually.",
    });
  }
}
