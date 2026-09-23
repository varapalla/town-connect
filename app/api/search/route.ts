import { NextRequest, NextResponse } from "next/server";
import { getGoogleApiKey, GOOGLE_PLACES_BASE, SEARCH_FIELDS, normalizePlace } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (!q) return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    const key = getGoogleApiKey();
    const body: Record<string, unknown> = { textQuery: q, languageCode: "en", regionCode: "IN", maxResultCount: 20 };
    if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      body.locationBias = { circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: 10000 } };
    }
    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:searchText`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": SEARCH_FIELDS },
      body: JSON.stringify(body), cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Places API failed", details: data }, { status: response.status });
    return NextResponse.json({ query: q, count: (data.places ?? []).length, places: (data.places ?? []).map(normalizePlace) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
