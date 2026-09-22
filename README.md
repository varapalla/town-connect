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
