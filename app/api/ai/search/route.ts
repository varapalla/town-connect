import { NextRequest, NextResponse } from "next/server";
import { parseTownQuery } from "../../../../lib/gemini";
import { searchGooglePlaces } from "../../../../lib/google";

function scorePlace(place: any, intent: Awaited<ReturnType<typeof parseTownQuery>>) {
  let score = 0;
  const haystack = `${place.name} ${place.address} ${place.type ?? ""} ${(place.types ?? []).join(" ")}`.toLowerCase();
  const keywords = [intent.category, ...intent.keywords].filter(Boolean).map((x) => x.toLowerCase());

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
  if (place.rating) list.push(`${place.rating}★ on Google`);
  if (intent.openNow && place.openingHours?.openNow) list.push("Open now");
  if (intent.budgetMax !== null) list.push("Budget requested; price not verified by Google Places");
  if (intent.dateQuery) list.push(`${intent.dateQuery} requested; availability not verified`);
  return list.slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const lat = Number(body?.location?.latitude);
    const lng = Number(body?.location?.longitude);

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI search failed" },
      { status: 500 },
    );
  }
}
