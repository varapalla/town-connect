import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_PLACES_BASE, getGoogleApiKey, normalizePlace, placesFieldMask } from "@/lib/google";

const FIELD_MASK = placesFieldMask([
  "places.id", "places.displayName", "places.formattedAddress", "places.location",
  "places.primaryType", "places.types", "places.rating", "places.userRatingCount",
  "places.googleMapsUri", "places.nationalPhoneNumber", "places.websiteUri",
  "places.currentOpeningHours", "places.photos"
]);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = params.get("q")?.trim();
    const lat = Number(params.get("lat"));
    const lng = Number(params.get("lng"));
    const radius = Math.min(Math.max(Number(params.get("radius") || 10000), 100), 50000);

    if (!q) return NextResponse.json({ error: "q is required" }, { status: 400 });

    const body: Record<string, unknown> = {
      textQuery: q,
      languageCode: "en",
      regionCode: "IN",
      maxResultCount: 20
    };

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius } };
    }

    const response = await fetch(`${GOOGLE_PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": getGoogleApiKey(),
        "X-Goog-FieldMask": FIELD_MASK
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Places request failed", details: data }, { status: response.status });

    return NextResponse.json({ query: q, count: data.places?.length ?? 0, places: (data.places ?? []).map(normalizePlace) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed" }, { status: 500 });
  }
}
