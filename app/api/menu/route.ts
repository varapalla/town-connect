import { NextRequest, NextResponse } from "next/server";
import { analyzeMenuImage } from "../../../lib/gemini";
import { getGooglePhoto, searchGooglePlaces } from "../../../lib/google";

function scoreBusiness(place: any, businessName: string) {
  const name = String(place.name ?? "").toLowerCase();
  const target = businessName.toLowerCase().trim();
  let score = 0;
  if (name === target) score += 100;
  if (name.includes(target)) score += 60;
  for (const token of target.split(/\s+/).filter((x) => x.length > 2)) if (name.includes(token)) score += 10;
  if (typeof place.rating === "number") score += place.rating;
  return score;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
    const locationQuery = typeof body?.locationQuery === "string" ? body.locationQuery.trim() : "";
    if (!businessName) return NextResponse.json({ error: "businessName is required" }, { status: 400 });

    const places = await searchGooglePlaces({ query: `${businessName} ${locationQuery}`.trim(), maxResultCount: 10 });
    if (!places.length) return NextResponse.json({ found: false, business: null, menus: [], message: "Restaurant not found in Google Places." });

    const business = [...places].sort((a, b) => scoreBusiness(b, businessName) - scoreBusiness(a, businessName))[0];
    const menus: any[] = [];

    for (const photo of (business.photos ?? []).slice(0, 10)) {
      try {
        const image = await getGooglePhoto(photo.name);
        const analysis = await analyzeMenuImage(image.buffer, image.contentType);
        if (analysis.isMenu && analysis.confidence >= 0.50) {
          menus.push({
            photoName: photo.name,
            photoUrl: `/api/photo?name=${encodeURIComponent(photo.name)}&width=1400`,
            confidence: analysis.confidence,
            menuText: analysis.menuText,
            items: analysis.items,
            authorAttributions: photo.authorAttributions ?? [],
          });
        }
      } catch (error) {
        console.warn("Skipping Google photo during menu analysis", photo.name, error);
      }
    }

    return NextResponse.json({
      found: menus.length > 0,
      business: { id: business.id, name: business.name, address: business.address, mapsUrl: business.mapsUrl, rating: business.rating, reviewCount: business.reviewCount },
      menus,
      message: menus.length > 0 ? "Menu found in Google Places photos." : "Menu photo not found in Google Places.",
    });
  } catch (error) {
    console.error("Menu search failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Menu search failed" }, { status: 500 });
  }
}
