import { NextRequest, NextResponse } from "next/server";
import { getGoogleApiKey, GOOGLE_PLACES_BASE, SEARCH_FIELDS, normalizePlace } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat")); const lng = Number(searchParams.get("lng")); const type = searchParams.get("type");
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) return NextResponse.json({ error: "lat, lng and type are required" }, { status: 400 });
    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:searchNearby`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": getGoogleApiKey(), "X-Goog-FieldMask": SEARCH_FIELDS },
      body: JSON.stringify({ includedTypes: [type], maxResultCount: 20, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000 } } }), cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Nearby Search failed", details: data }, { status: response.status });
    return NextResponse.json({ count: (data.places ?? []).length, places: (data.places ?? []).map(normalizePlace) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Nearby search failed" }, { status: 500 }); }
}
