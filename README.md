# TownConnect — Google Places V1

A Vercel-ready Next.js application for the first TownConnect launch.

**Data source:** Google Places API (New) only  
**Database:** None  
**Framework:** Next.js 15.5.24  
**Deployment:** Vercel

## Features

- TownConnect dashboard UI
- Natural-language "Ask your town" search
- Google Places Text Search
- Google Places Nearby Search
- Google Places Autocomplete
- Google Place Details
- Google Place Photos proxy
- Browser location bias when the user grants permission
- Real business cards
- Business details page
- Call / Website / Google Maps actions
- Responsive UI
- No hard-coded API key

## Project structure

```text
townconnect-google/
├── app/
│   ├── api/
│   │   ├── search/route.ts
│   │   ├── nearby/route.ts
│   │   ├── autocomplete/route.ts
│   │   ├── photo/route.ts
│   │   └── business/[placeId]/route.ts
│   ├── business/[placeId]/page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── lib/google.ts
├── public/
├── package.json
├── next.config.ts
├── tsconfig.json
├── .env.example
└── .gitignore
```

## 1. Google Cloud setup

Use your existing Google Cloud project if you already have one.

1. Enable **Places API (New)**.
2. Configure Google Maps Platform billing.
3. Create an API key.
4. Restrict the key to **Places API (New)**.
5. For this server-side Next.js implementation, keep the key out of source control.

Do not send or commit your real API key to GitHub.

## 2. Local development

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_MAPS_API_KEY=YOUR_REAL_GOOGLE_API_KEY
```

Then:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 3. Test the APIs

Search:

```text
http://localhost:3000/api/search?q=restaurants
```

Search with location:

```text
http://localhost:3000/api/search?q=AC%20repair&lat=16.50&lng=80.64
```

Nearby:

```text
http://localhost:3000/api/nearby?lat=16.50&lng=80.64&type=restaurant
```

Autocomplete:

```text
http://localhost:3000/api/autocomplete?input=ac%20repair
```

Place details:

```text
http://localhost:3000/api/business/PLACE_ID
```

## 4. Deploy to GitHub + Vercel

### GitHub

Do NOT commit `.env.local`.

```bash
git init
git add .
git commit -m "feat: add Google Places V1"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### Vercel

Import the GitHub repository into Vercel.

Then go to:

```text
Vercel
→ Project
→ Settings
→ Environment Variables
```

Add:

```text
Name:  GOOGLE_MAPS_API_KEY
Value: YOUR_REAL_GOOGLE_API_KEY
```

Enable it for:

- Production
- Preview
- Development

Then redeploy.

The API key remains server-side because the application reads:

```typescript
process.env.GOOGLE_MAPS_API_KEY
```

and does not expose it as a `NEXT_PUBLIC_` variable.

## 5. API architecture

```text
Browser
   │
   ▼
TownConnect Next.js UI
   │
   ▼
Next.js API Routes
   │
   ├── /api/search
   ├── /api/nearby
   ├── /api/autocomplete
   ├── /api/business/[placeId]
   └── /api/photo
   │
   ▼
Google Places API (New)
```

## 6. Security

Never put this in GitHub:

```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

Keep only this in `.env.example`:

```env
GOOGLE_MAPS_API_KEY=
```

If a key is ever accidentally committed, rotate/delete it in Google Cloud immediately and create a replacement.

## 7. Google Places usage

This project uses Google Places as the V1 discovery source. It does not create a local database or bulk-copy Google business data.

Keep Google-required attribution and comply with the current Google Maps Platform terms and pricing for the fields and APIs you use.

## 8. Next phase

After the Google-only V1 is working:

```text
V1
Google Places
   ↓
Real local search

V2
Google Places
   +
TownConnect claimed businesses

V3
AI intent extraction
   ↓
MCP
   ↓
Google Places
   ↓
AI matching

V4
Leads
WhatsApp
Bookings
Payments
```
