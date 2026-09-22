import { NextRequest } from "next/server";
import { GOOGLE_PLACES_BASE, getGoogleApiKey } from "@/lib/google";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const width = Math.min(Math.max(Number(request.nextUrl.searchParams.get("width") || 800), 100), 1600);
  if (!name) return new Response("name is required", { status: 400 });

  const url = `${GOOGLE_PLACES_BASE}/${name}/media?maxWidthPx=${width}&key=${encodeURIComponent(getGoogleApiKey())}`;
  const response = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!response.ok) return new Response(await response.text(), { status: response.status });

  const contentType = response.headers.get("content-type") || "image/jpeg";
  return new Response(response.body, { status: 200, headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" } });
}
