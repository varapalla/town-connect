import { NextRequest, NextResponse } from "next/server";
import { analyzeMenuImage, parseTownQuery } from "../../../../lib/gemini";
import { getGooglePhoto, searchGooglePlaces } from "../../../../lib/google";

function scorePlace(place: any, intent: Awaited<ReturnType<typeof parseTownQuery>>) {
  let score = 0;
  const haystack = `${place.name} ${place.address} ${place.type ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  const keywords = [intent.category, ...intent.keywords, intent.businessName ?? ""].filter(Boolean).map((x) => x.toLowerCase());
  for (const keyword of keywords) {
    const tokens = keyword.split(/\s+/).filter((x) => x.length > 2);
    for (const token of tokens) if (haystack.includes(token)) score += 2;
  }
  if (intent.openNow && place.openingHours?.openNow) score += 4;
  if (typeof place.rating === "number") score += Math.min(place.rating, 5);
  score += Math.min((place.reviewCount || 0) / 500, 2);
  return score;
}

function reasons(place: any, intent: Awaited<ReturnType<typeof parseTownQuery>>) {
  const list: string[] = [];
  const haystack = `${place.name} ${place.address} ${place.type ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  const categoryTokens = intent.category.toLowerCase().split(/\s+/).filter((x) => x.length > 2);
  if (categoryTokens.some((token) => haystack.includes(token))) list.push(`Matches ${intent.category}`);
  if (intent.businessName && place.name.toLowerCase().includes(intent.businessName.toLowerCase())) list.push(`Matches ${intent.businessName}`);
  if (place.rating) list.push(`${place.rating}★ on Google`);
  if (intent.openNow && place.openingHours?.openNow) list.push("Open now");
  if (intent.budgetMax !== null) list.push("Budget requested; price not verified by Google Places");
  if (intent.dateQuery) list.push(`${intent.dateQuery} requested; availability not verified`);
  return list.slice(0, 3);
}

async function findMenusForBusiness(business: any) {
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
      console.warn("Menu photo skipped", photo.name, error);
    }
  }
  return menus;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const lat = Number(body?.location?.latitude);
    const lng = Number(body?.location?.longitude);
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });

    const intent = await parseTownQuery(message);
    const places = await searchGooglePlaces({
      query: intent.searchQuery,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      maxResultCount: 20,
    });

    const ranked = places
      .map((place: any) => ({ ...place, matchReasons: reasons(place, intent), _score: scorePlace(place, intent) }))
      .sort((a: any, b: any) => b._score - a._score)
      .map(({ _score, ...place }: any) => place);

    if (intent.intent === "find_menu" && intent.businessName) {
      const business = ranked.find((place: any) => place.name.toLowerCase().includes(intent.businessName!.toLowerCase())) ?? ranked[0];
      if (business) {
        const menus = await findMenusForBusiness(business);
        return NextResponse.json({
          message,
          intent,
          places: [business],
          menu: {
            found: menus.length > 0,
            business: {
              id: business.id,
              name: business.name,
              address: business.address,
              mapsUrl: business.mapsUrl,
              rating: business.rating,
              reviewCount: business.reviewCount,
            },
            menus,
            message: menus.length > 0 ? "Menu found in Google Places photos." : "Menu photo not found in Google Places.",
          },
          notes: {
            menu: "Menu detection is based on available Google Places photos. Prices are not independently verified.",
          },
        });
      }
    }

    return NextResponse.json({
      message,
      intent,
      places: ranked,
      notes: {
        budget: intent.budgetMax === null ? null : `₹${intent.budgetMax} requested. Google Places does not provide verified pricing for these results.`,
        date: intent.dateQuery ? `${intent.dateQuery} requested. Availability is not verified by Google Places.` : null,
      },
    });
  } catch (error) {
    console.error("AI search error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI search failed" }, { status: 500 });
  }
}
