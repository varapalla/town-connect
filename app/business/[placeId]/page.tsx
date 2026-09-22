"use client";
import { useEffect, useState } from "react";

type Place = any;
export default function BusinessPage({ params }: { params: Promise<{ placeId: string }> }) {
  const [place, setPlace] = useState<Place>(null); const [error, setError] = useState("");
  useEffect(() => { params.then(({ placeId }) => fetch(`/api/business/${encodeURIComponent(placeId)}`).then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error||"Failed"); setPlace(d); }).catch(e=>setError(e.message))); }, [params]);
  if (error) return <main className="detail-page"><a href="/">← Back</a><div className="error">{error}</div></main>;
  if (!place) return <main className="detail-page"><a href="/">← Back</a><div className="empty"><h3>Loading business…</h3></div></main>;
  return <main className="detail-page"><a href="/">← Back to search</a><div className="detail-card"><div className="detail-icon">⌂</div><span className="pill">GOOGLE PLACES</span><h1>{place.name}</h1><p className="type">{place.type?.replaceAll("_"," ") || "Local business"}</p><div className="rating large">★ <b>{place.rating ?? "—"}</b> <span>({place.reviewCount || 0} reviews)</span></div><p>⌖ {place.address}</p><div className="actions big">{place.phone && <a href={`tel:${place.phone}`}>Call</a>}{place.website && <a href={place.website} target="_blank" rel="noreferrer">Website</a>}{place.mapsUrl && <a href={place.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a>}</div><div className="hours"><h3>Opening hours</h3>{place.regularOpeningHours?.weekdayDescriptions?.map((x:string)=><div key={x}>{x}</div>) || <span>Hours not available</span>}</div></div><p className="google-note">Business information is provided by Google Places. Google attribution and Places terms apply.</p></main>;
}
