"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Photo = { name: string };
type Place = {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  reviewCount: number;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  type: string | null;
  location: { latitude: number; longitude: number } | null;
  photos: Photo[];
  openingHours?: { openNow?: boolean } | null;
  matchReasons?: string[];
};
type MenuItem = { name: string; price: string; category: string };
type MenuResult = {
  found: boolean;
  message: string;
  business?: { id: string; name: string; address: string; mapsUrl: string | null; rating: number | null; reviewCount: number };
  menus: { photoUrl: string; confidence: number; menuText: string; items: MenuItem[]; authorAttributions: any[] }[];
};

type Intent = {
  intent: string;
  category: string;
  businessName: string | null;
  locationQuery: string;
  budgetMax: number | null;
  currency: string;
  dateQuery: string | null;
  openNow: boolean;
  searchQuery: string;
  keywords: string[];
};

const suggestions = [
  "Find an AC technician near me",
  "Find a wedding photographer under ₹20,000",
  "Find a birthday cake under ₹1,000 near me",
  "Restaurants open now near me",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [menu, setMenu] = useState<MenuResult | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 6000 },
    );
  }, []);

  async function search(value = query) {
    const message = value.trim();
    if (!message) return;
    setQuery(message);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, location }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI search failed");
      setIntent(data.intent);
      setPlaces(data.places || []);
      setMenu(data.menu || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI search failed");
      setPlaces([]);
      setMenu(null);
      setIntent(null);
    } finally {
      setLoading(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    search();
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div><strong>TownConnect</strong><small>Ask your town anything</small></div>
        </div>
        <div className="town">📍 <span>Town XYZ</span></div>
        <nav>
          {["Dashboard", "Businesses", "Leads", "Map", "Ask the Town", "Town Intelligence", "MCP Tools"].map((x) => (
            <button key={x} className={x === "Ask the Town" ? "nav active" : "nav"}>{x}</button>
          ))}
        </nav>
        <div className="phase-card"><span>PHASE 2</span><strong>AI local discovery</strong><small>Gemini understands the request. Google Places supplies the businesses.</small></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><span className="eyebrow">TOWNCONNECT V2</span><h1>Ask your town anything.</h1><p>Describe what you need. AI understands it, then Google finds real local businesses.</p></div>
          <div className="status"><span className="dot"/> Google Places + Gemini</div>
        </header>

        <section className="hero-card">
          <span className="pill">✦ AI LOCAL SEARCH</span>
          <h2>Tell us what you need<br/>in your town.</h2>
          <p>No filters required. Tell TownConnect naturally — service, product, budget, date or availability.</p>
          <form onSubmit={submit} className="search-box">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Find a birthday cake under ₹1,000 near me" />
            <button disabled={loading}>{loading ? "Understanding…" : "Ask TownConnect"} →</button>
          </form>
          <div className="chips">{suggestions.map((s) => <button key={s} onClick={() => search(s)}>{s}</button>)}</div>
        </section>

        {intent && (
          <section className="intent-card">
            <div><span className="eyebrow">UNDERSTOOD</span><h2>Here's what TownConnect heard</h2></div>
            <div className="intent-grid">
              <div><small>Need</small><strong>{intent.category}</strong></div>
              <div><small>Location</small><strong>{intent.locationQuery}</strong></div>
              <div><small>Budget</small><strong>{intent.budgetMax ? `₹${intent.budgetMax.toLocaleString("en-IN")}` : "Not specified"}</strong></div>
              <div><small>Date</small><strong>{intent.dateQuery || "Not specified"}</strong></div>
            </div>
            {(intent.budgetMax !== null || intent.dateQuery) && <p className="notice">Budget and date are understood, but Google Places does not provide verified business pricing or appointment availability. We show that clearly rather than guessing.</p>}
          </section>
        )}

        {menu && intent?.intent === "find_menu" && (
          <section className="menu-result">
            <div className="section-head menu-head">
              <div><span className="eyebrow">MENU INTELLIGENCE</span><h2>{menu.business?.name || intent.businessName}</h2></div>
              {menu.found && <span className="menu-found">🍽 MENU FOUND</span>}
            </div>

            {!menu.found && (
              <div className="menu-not-found">
                <h3>Menu photo not found in Google Places</h3>
                <p>TownConnect checked the restaurant's available Google Places photos but couldn't identify a menu.</p>
                {menu.business?.mapsUrl && <a href={menu.business.mapsUrl} target="_blank" rel="noreferrer">View restaurant on Google Maps →</a>}
              </div>
            )}

            {menu.found && menu.menus.map((detectedMenu, index) => (
              <div className="menu-card" key={`${detectedMenu.photoUrl}-${index}`}>
                <div className="menu-image"><img src={detectedMenu.photoUrl} alt="Restaurant menu found in Google Places" /></div>
                <div className="menu-content">
                  <div className="menu-badge">MENU DETECTED</div>
                  <p className="menu-confidence">Visual confidence: {Math.round(detectedMenu.confidence * 100)}%</p>
                  {detectedMenu.items?.length > 0 ? (
                    <div className="menu-items">
                      {detectedMenu.items.map((item, itemIndex) => (
                        <div className="menu-item" key={`${item.name}-${itemIndex}`}>
                          <div><strong>{item.name}</strong>{item.category && <small>{item.category}</small>}</div>
                          {item.price && <strong>{item.price}</strong>}
                        </div>
                      ))}
                    </div>
                  ) : <pre className="menu-text">{detectedMenu.menuText}</pre>}
                  <p className="menu-disclaimer">Menu detected from a Google Places photo. Prices and availability may be outdated and are not independently verified by TownConnect.</p>
                  {detectedMenu.authorAttributions?.length > 0 && <p className="photo-attribution">Photo attribution: {detectedMenu.authorAttributions.map((a: any, i: number) => <span key={i}>{a.displayName || a.uri || "Google contributor"}{i < detectedMenu.authorAttributions.length - 1 ? ", " : ""}</span>)}</p>}
                  {menu.business?.mapsUrl && <a href={menu.business.mapsUrl} target="_blank" rel="noreferrer" className="menu-map-link">View restaurant on Google Maps →</a>}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="section-head"><div><span className="eyebrow">GOOGLE PLACES RESULTS</span><h2>{query ? `Results for “${query}”` : "Explore local businesses"}</h2></div><span className="count">{places.length ? `${places.length} businesses` : "AI ready"}</span></section>
        {error && <div className="error">⚠ {error}<small>Check GOOGLE_MAPS_API_KEY, GEMINI_API_KEY, Places API (New), Gemini API access and billing.</small></div>}
        {!loading && !error && !places.length && <div className="empty"><h3>Try asking naturally</h3><p>For example: “Find a wedding photographer under ₹20,000 near Proddatur.”</p></div>}

        <div className="grid">
          {places.map((p) => (
            <article className="card" key={p.id}>
              <div className="card-photo">{p.photos?.[0] ? <img src={`/api/photo?name=${encodeURIComponent(p.photos[0].name)}&width=800`} alt={`${p.name} Google photo`} /> : <div className="business-icon">⌂</div>}</div>
              <h3>{p.name}</h3>
              <p className="type">{pretty(p.type)} {p.openingHours?.openNow ? <span className="open">• Open now</span> : ""}</p>
              <p className="address">⌖ {p.address}</p>
              <div className="rating">★ <b>{p.rating ?? "—"}</b> <span>({p.reviewCount || 0} reviews)</span></div>
              {p.matchReasons?.length ? <div className="match-list">{p.matchReasons.map((r) => <span key={r}>✓ {r}</span>)}</div> : null}
              <div className="actions">{p.phone && <a href={`tel:${p.phone}`}>Call</a>}{p.mapsUrl && <a href={p.mapsUrl} target="_blank" rel="noreferrer">Directions</a>}<Link href={`/business/${encodeURIComponent(p.id)}`}>Details</Link></div>
            </article>
          ))}
        </div>
        {places.length > 0 && <div className="google-note">Business information and photos are provided by Google Places. Google attribution and Places terms apply.</div>}
      </section>
    </main>
  );
}

function pretty(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Local business";
}
