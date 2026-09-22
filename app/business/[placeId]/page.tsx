"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Photo = { name: string; widthPx?: number; heightPx?: number };
type Place = { id:string; name:string; address:string; type:string|null; rating:number|null; reviewCount:number; phone:string|null; website:string|null; mapsUrl:string|null; openingHours?:{weekdayDescriptions?:string[]}|null; photos:Photo[] };

export default function BusinessPage({ params }: { params: Promise<{ placeId: string }> }) {
  const [place,setPlace]=useState<Place|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true); const [selected,setSelected]=useState<number|null>(null);
  useEffect(()=>{ params.then(({placeId})=>fetch(`/api/business/${encodeURIComponent(placeId)}`).then(async r=>{const d=await r.json(); if(!r.ok) throw new Error(d.error||"Unable to load business"); setPlace(d);}).catch(e=>setError(e.message)).finally(()=>setLoading(false))); },[params]);
  if(loading) return <main className="detail-shell"><Link href="/">← Back to search</Link><div className="detail-card"><div className="loading">Loading business and Google photos…</div></div></main>;
  if(error||!place) return <main className="detail-shell"><Link href="/">← Back to search</Link><div className="detail-card"><div className="error">{error||"Business not found"}</div></div></main>;
  const photos=place.photos||[];
  return <main className="detail-shell"><Link href="/" className="back">← Back to search</Link><section className="detail-card">
    <div className="detail-header"><div><span className="pill">GOOGLE PLACES</span><h1>{place.name}</h1><p className="type">{pretty(place.type)}</p><div className="rating">★ <b>{place.rating??"—"}</b> <span>({place.reviewCount||0} reviews)</span></div><p className="address">⌖ {place.address}</p><div className="actions">{place.phone&&<a href={`tel:${place.phone}`}>Call</a>}{place.mapsUrl&&<a href={place.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a>}{place.website&&<a href={place.website} target="_blank" rel="noreferrer">Website</a>}</div></div></div>
    <div className="gallery-section"><div className="section-head"><div><span className="eyebrow">GOOGLE PHOTOS</span><h2>{photos.length ? `${photos.length} photos from Google Places` : "No photos returned by Google Places"}</h2></div></div>{photos.length ? <div className="photo-grid">{photos.map((p,i)=><button className="photo" key={p.name} onClick={()=>setSelected(i)}><img src={`/api/photo?name=${encodeURIComponent(p.name)}&width=1200`} alt={`${place.name} photo ${i+1}`} /></button>)}</div> : <div className="empty photo-empty"><h3>No photos were returned</h3><p>The Place Details response did not include a photo reference for this listing.</p></div>}</div>
    <div className="hours"><h2>Opening hours</h2>{place.openingHours?.weekdayDescriptions?.map(x=><div key={x}>{x}</div>)}</div>
    <div className="google-note">Business information and photos are provided by Google Places. Google attribution and Places terms apply.</div>
  </section>{selected!==null&&photos[selected]&&<div className="lightbox" onClick={()=>setSelected(null)}><button className="close" onClick={()=>setSelected(null)}>×</button><img src={`/api/photo?name=${encodeURIComponent(photos[selected].name)}&width=1600`} alt={`${place.name} photo`} onClick={e=>e.stopPropagation()}/></div>}</main>;
}
function pretty(value:string|null){return value?value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()):"Local business"}
