import { NextRequest } from "next/server";
import { getGoogleApiKey, GOOGLE_PLACES_BASE } from "@/lib/google";

export async function GET(request: NextRequest) {
  try {
    const name = new URL(request.url).searchParams.get("name");
    if (!name || !name.startsWith("places/")) return new Response("Invalid photo name", { status: 400 });
    const width = Math.min(Math.max(Number(new URL(request.url).searchParams.get("width") ?? 1200), 200), 1600);
    const photoUrl = `${GOOGLE_PLACES_BASE}/${name}/media?maxWidthPx=${width}&key=${encodeURIComponent(getGoogleApiKey())}`;
    const response = await fetch(photoUrl, { cache: "no-store" });
    if (!response.ok) return new Response(await response.text(), { status: response.status });
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return new Response(await response.arrayBuffer(), { headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" } });
  } catch (error) { return new Response(error instanceof Error ? error.message : "Photo fetch failed", { status: 500 }); }
}
