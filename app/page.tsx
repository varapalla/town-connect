"use client";

import { FormEvent, useEffect, useState } from "react";

type Place = {
  id: string; name: string; address: string; rating: number | null; reviewCount: number;
  phone: string | null; website: string | null; mapsUrl: string | null; type: string | null;
  location: { latitude: number; longitude: number } | null;
};

const suggestions = [
  "Find an AC technician near me",
  "Find a wedding photographer under ₹20,000",
  "Best bakery near me",
  "Find a plumber open now"
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [active, setActive] = useState("Ask the Town");

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setLocation(null),
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  async function search(value = query) {
    const q = value.trim();
    if (!q) return;
    setQuery(q); setLoading(true); setError(""); setPlaces([]);
    try {
      const params = new URLSearchParams({ q });
      if (location) { params.set("lat", String(location.lat)); params.set("lng", String(location.lng)); }
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setPlaces(data.places || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Search failed"); }
    finally { setLoading(false); }
  }

  function submit(e: FormEvent) { e.preventDefault(); search(); }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">T</span><div><strong>TownConnect</strong><small>Ask your town anything</small></div></div>
        <div className="town">📍 <span>Town XYZ</span><span className="chevron">⌄</span></div>
        <nav>
          {["Dashboard", "Businesses", "Leads", "Map", "Ask the Town", "Town Intelligence", "MCP Tools"].map(item => (
            <button key={item} className={active === item ? "nav active" : "nav"} onClick={() => setActive(item)}>{icon(item)}<span>{item}</span></button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className="nav">⚙️<span>Settings</span></button><div className="profile"><div className="avatar">VP</div><div><strong>Town Admin</strong><small>Administrator</small></div></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div><span className="eyebrow">TOWNCONNECT V1</span><h1>Ask your town anything.</h1><p>Discover real local businesses using Google Places.</p></div><div className="status"><span className="dot"/> Google Places connected</div></header>

        <section className="hero-card">
          <div className="hero-copy"><span className="pill">✦ AI LOCAL SEARCH</span><h2>What do you need<br/>in your town?</h2><p>Ask naturally. TownConnect turns your request into a local search.</p></div>
          <form onSubmit={submit} className="search-box"><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Find an AC technician near me"/><button disabled={loading}>{loading ? "Searching…" : "Ask TownConnect"} →</button></form>
          <div className="chips">{suggestions.map(s => <button key={s} onClick={() => search(s)}>{s}</button>)}</div>
        </section>

        <section className="section-head"><div><span className="eyebrow">LIVE RESULTS</span><h2>{query ? `Results for “${query}”` : "Explore local businesses"}</h2></div><span className="count">{places.length ? `${places.length} businesses` : "Google Places"}</span></section>

        {error && <div className="error">⚠ {error}<small>Check your Google API key, enabled APIs, billing, and API restrictions.</small></div>}
        {!loading && !error && places.length === 0 && <div className="empty"><div className="empty-icon">⌕</div><h3>Search your town</h3><p>Try a service, product, business category, or natural-language request.</p></div>}
        <div className="grid">{places.map(place => <PlaceCard key={place.id} place={place}/>)}</div>
        {places.length > 0 && <div className="google-note">Results provided by Google. <a href="https://www.google.com" target="_blank" rel="noreferrer">Google</a> attribution and Places terms apply.</div>}
      </section>
    </main>
  );
}

function PlaceCard({ place }: { place: Place }) {
  return <article className="card">
    <div className="card-top"><div className="business-icon">{categoryIcon(place.type)}</div><div className="verified">● Google</div></div>
    <h3>{place.name || "Unnamed business"}</h3><p className="type">{pretty(place.type)}</p><p className="address">⌖ {place.address || "Address unavailable"}</p>
    <div className="rating">★ <b>{place.rating ?? "—"}</b> <span>({place.reviewCount || 0} reviews)</span></div>
    <div className="actions">{place.phone && <a href={`tel:${place.phone}`}>Call</a>}{place.mapsUrl && <a href={place.mapsUrl} target="_blank" rel="noreferrer">Directions</a>}<a href={`/business/${encodeURIComponent(place.id)}`}>Details</a></div>
  </article>;
}

function icon(item: string) { const m: Record<string,string> = { Dashboard:"⌂", Businesses:"▦", Leads:"◈", Map:"⌖", "Ask the Town":"✦", "Town Intelligence":"◒", "MCP Tools":"⌘" }; return m[item] || "•"; }
function categoryIcon(type: string | null) { if (type?.includes("restaurant")) return "🍽"; if (type?.includes("bakery")) return "🥐"; if (type?.includes("doctor") || type?.includes("hospital")) return "✚"; if (type?.includes("electric")) return "⚡"; return "⌂"; }
function pretty(value: string | null) { return value ? value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()) : "Local business"; }
