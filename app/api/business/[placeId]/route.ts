import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_PLACES_BASE, getGoogleApiKey, normalizePlace, placesFieldMask } from "@/lib/google";

const FIELD_MASK = placesFieldMask([
  "id", "displayName", "formattedAddress", "location", "primaryType", "types",
  "rating", "userRatingCount", "nationalPhoneNumber", "internationalPhoneNumber",
  "websiteUri", "googleMapsUri", "currentOpeningHours", "regularOpeningHours", "photos", "reviews"
]);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ placeId: string }> }) {
  try {
    const { placeId } = await params;
    if (!placeId) return NextResponse.json({ error: "placeId is required" }, { status: 400 });

    const response = await fetch(`${GOOGLE_PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": getGoogleApiKey(), "X-Goog-FieldMask": FIELD_MASK },
      cache: "no-store"
    });

    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Place Details failed", details: data }, { status: response.status });
    return NextResponse.json(normalizePlace(data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Business details failed" }, { status: 500 });
  }
}
