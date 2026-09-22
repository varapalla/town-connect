# TownConnect — Google Places V1

Google-only local business discovery for Vercel.

## Google Cloud
Enable **Places API (New)** and configure billing. Create a key restricted to Places API (New). Keep the key out of GitHub.

## Local
```bash
npm install
cp .env.example .env.local
# add GOOGLE_MAPS_API_KEY
npm run dev
```

## APIs
- GET `/api/search?q=restaurants&lat=...&lng=...`
- GET `/api/nearby?lat=...&lng=...&type=bakery`
- GET `/api/autocomplete?input=dark%20purple`
- GET `/api/business/{placeId}`
- GET `/api/photo?name=places/.../photos/...&width=1200`

## Photos
Business details requests the `photos` field from Google Place Details. Each returned photo resource name is passed to the server-side `/api/photo` route, which calls the Google Places Photo Media endpoint and streams the image to the gallery. No photo is stored in a database or bundled with the app.

## Vercel
Add `GOOGLE_MAPS_API_KEY` in Vercel Project Settings → Environment Variables, then redeploy.

## Phase 2 — AI Ask Your Town

Phase 2 adds natural-language intent extraction with Gemini and uses Google Places as the only business data source.

Flow:

```text
User request
  ↓
Gemini intent extraction
  ↓
Search query + filters
  ↓
Google Places Text Search
  ↓
Deterministic local matching
  ↓
Real Google business results + Google photos
```

### Additional environment variables

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
```

The Gemini key is server-side only. Do not use a `NEXT_PUBLIC_` prefix and do not commit `.env.local`.

### New endpoint

```http
POST /api/ai/search
Content-Type: application/json

{
  "message": "Find a birthday cake under ₹1,000 near me",
  "location": {
    "latitude": 14.75,
    "longitude": 78.55
  }
}
```

The response contains the parsed intent and real Google Places results. Budget and appointment availability are not claimed as verified because Google Places does not provide those facts for ordinary business discovery in this implementation.
