import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_PLACES_BASE, getGoogleApiKey, normalizePlace, placesFieldMask } from "@/lib/google";

const FIELD_MASK = placesFieldMask([
  "places.id", "places.displayName", "places.formattedAddress", "places.location",
  "places.primaryType", "places.types", "places.rating", "places.userRatingCount",
  "places.googleMapsUri", "places.nationalPhoneNumber", "places.websiteUri", "places.currentOpeningHours"
]);

export async function GET(request: NextRequest) {
  try {
    const p = request.nextUrl.searchParams;
    const lat = Number(p.get("lat"));
    const lng = Number(p.get("lng"));
    const type = p.get("type")?.trim();
    const radius = Math.min(Math.max(Number(p.get("radius") || 5000), 100), 50000);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !type) {
      return NextResponse.json({ error: "lat, lng and type are required" }, { status: 400 });
    }

    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getGoogleApiKey(),
        "X-Goog-FieldMask": FIELD_MASK
      },
      body: JSON.stringify({
        includedTypes: [type],
        maxResultCount: 20,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } }
      }),
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Nearby Search failed", details: data }, { status: response.status });
    return NextResponse.json({ count: data.places?.length ?? 0, places: (data.places ?? []).map(normalizePlace) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Nearby search failed" }, { status: 500 });
  }
}
