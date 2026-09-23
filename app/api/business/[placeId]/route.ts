import { NextRequest, NextResponse } from "next/server";
import { DETAIL_FIELDS, GOOGLE_PLACES_BASE, getGoogleApiKey, normalizePlace } from "@/lib/google";

export async function GET(_request: NextRequest, context: { params: Promise<{ placeId: string }> }) {
  try {
    const { placeId } = await context.params;
    if (!placeId) return NextResponse.json({ error: "placeId is required" }, { status: 400 });
    const response = await fetch(`${GOOGLE_PLACES_BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: { "X-Goog-Api-Key": getGoogleApiKey(), "X-Goog-FieldMask": DETAIL_FIELDS }, cache: "no-store"
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "Google Place Details failed", details: data }, { status: response.status });
    return NextResponse.json(normalizePlace(data));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Business details failed" }, { status: 500 }); }
}
