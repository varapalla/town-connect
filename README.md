# TownConnect Menu AI

Vercel-ready proof of concept: Google Places photos are inspected with Gemini Vision to find menu images, then menu items and visible prices are extracted.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `GOOGLE_MAPS_API_KEY` and `GEMINI_API_KEY` in `.env.local`.

Open http://localhost:3000 and enter a Google Place ID.

## APIs
- POST `/api/menu/detect` — finds menu photos among current Google Places photos.
- POST `/api/menu/extract` — extracts visible menu information from a selected photo.
- GET `/api/photo?name=...` — proxies a current Google Place Photo resource.

Google photo resources are fetched on demand and are not persisted by this project. Required Google photo attribution should be shown where applicable.
