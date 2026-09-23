import { NextRequest, NextResponse } from "next/server";
import { getGoogleApiKey, GOOGLE_PLACES_BASE } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input")?.trim();
    if (!input) return NextResponse.json({ suggestions: [] });
    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:autocomplete`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": getGoogleApiKey() },
      body: JSON.stringify({ input, languageCode: "en", includedRegionCodes: ["in"] }), cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Autocomplete failed", details: data }, { status: response.status });
    return NextResponse.json({ suggestions: data.suggestions ?? [] });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Autocomplete failed" }, { status: 500 }); }
}
