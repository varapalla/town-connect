import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_PLACES_BASE, getGoogleApiKey } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const input = p.get("input")?.trim();
    const lat = Number(p.get("lat"));
    const lng = Number(p.get("lng"));

    if (!input) return NextResponse.json({ suggestions: [] });

    const body: Record<string, unknown> = { input, languageCode: "en", includedRegionCodes: ["in"] };
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 10000 } };
    }

    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:autocomplete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": getGoogleApiKey() },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Autocomplete failed", details: data }, { status: response.status });

    const suggestions = (data.suggestions ?? []).map((s: any) => {
      const prediction = s.placePrediction;
      return prediction ? {
        placeId: prediction.placeId,
        text: prediction.text?.text ?? "",
        primaryText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "",
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? ""
      } : null;
    }).filter(Boolean);

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Autocomplete failed" }, { status: 500 });
  }
}
