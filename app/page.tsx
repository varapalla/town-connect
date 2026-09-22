 "use client";

import { useState } from "react";

const businesses = [
  { name: "Sri Lakshmi Electricals", category: "AC & Appliance Repair", rating: "4.7", distance: "2.1 km", status: "Available today", price: "₹499+", icon: "🔧" },
  { name: "Kumar Bakery", category: "Bakery & Cakes", rating: "4.8", distance: "1.4 km", status: "Open now", price: "₹350+", icon: "🍰" },
  { name: "Ravi Digital Studio", category: "Wedding Photography", rating: "4.6", distance: "3.4 km", status: "Available Sunday", price: "₹12K+", icon: "📸" },
  { name: "Cool Care Services", category: "AC Repair", rating: "4.5", distance: "4.2 km", status: "Available today", price: "₹399+", icon: "❄️" },
];

const leads = [
  ["Rahul", "AC Repair", "Sri Lakshmi Electricals", "New", "₹499"],
  ["Priya", "Birthday Cake", "Kumar Bakery", "Quoted", "₹850"],
  ["Suresh", "Wedding Photography", "Ravi Digital Studio", "Won", "₹18,000"],
  ["Anita", "Home Cleaning", "CleanPro", "Contacted", "₹1,200"],
];

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState(false);

  const nav = [
    ["Dashboard", "⌂"],
    ["Businesses", "🏪"],
    ["Leads", "🎯"],
    ["Map", "📍"],
    ["Ask the Town", "✦"],
    ["Town Intelligence", "◈"],
    ["MCP Tools", "⌘"],
  ];

  function askTown() {
    if (query.trim()) setAsked(true);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">T</div>
          <div>
            <div className="brand-name">TownConnect</div>
            <div className="brand-sub">Local commerce AI</div>
          </div>
        </div>

        <div className="town-switcher">
          <span className="town-dot" />
          <div>
            <div className="town-label">Your town</div>
            <strong>Town XYZ</strong>
          </div>
          <span className="chev">⌄</span>
        </div>

        <nav>
          <div className="nav-section">OVERVIEW</div>
          {nav.map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => setActive(label)}
            >
              <span>{icon}</span>{label}
              {label === "Leads" && <b className="badge">42</b>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="nav-section">SETTINGS</div>
          <button className="nav-item"><span>⚙</span>Settings</button>
          <div className="profile">
            <div className="avatar">VP</div>
            <div><strong>Varaprasad</strong><small>Admin</small></div>
            <span>•••</span>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="mobile-brand">TOWNCONNECT</div>
          <div className="crumb">Town XYZ <span>/</span> {active}</div>
          <div className="top-actions">
            <button className="icon-btn">⌕</button>
            <button className="icon-btn">🔔<i /></button>
            <button className="avatar small">VP</button>
          </div>
        </header>

        <div className="page">
          {active === "Dashboard" && (
            <>
              <div className="hero-row">
                <div>
                  <p className="eyebrow">TOWN OVERVIEW</p>
                  <h1>Good evening 👋</h1>
                  <p className="muted">Here&apos;s what&apos;s happening across Town XYZ today.</p>
                </div>
                <button className="primary" onClick={() => setActive("Ask the Town")}>✦ Ask the Town</button>
              </div>

              <div className="stats">
                <Stat label="Businesses" value="2,843" change="+12.4%" />
                <Stat label="Active Leads" value="1,284" change="+18.2%" />
                <Stat label="Customer Searches" value="12,482" change="+24.8%" />
                <Stat label="Bookings" value="642" change="+14.1%" />
              </div>

              <div className="grid-2">
                <Card title="Local search activity" action="Last 30 days">
                  <div className="chart">
                    <div className="chart-bars">
                      {[42,55,49,66,61,72,68,82,74,91,84,96,88,100].map((h,i)=>
                        <div key={i} className="bar-wrap"><div className="bar" style={{height:`${h}%`}} /></div>
                      )}
                    </div>
                    <div className="chart-labels"><span>Aug 24</span><span>Sep 7</span><span>Sep 21</span></div>
                  </div>
                </Card>

                <Card title="Lead pipeline" action="View all">
                  <div className="pipeline">
                    <Pipeline label="New" value="42" pct={78} />
                    <Pipeline label="Contacted" value="31" pct={58} />
                    <Pipeline label="Quoted" value="18" pct={39} />
                    <Pipeline label="Won" value="14" pct={29} />
                  </div>
                </Card>
              </div>

              <div className="grid-2">
                <Card title="🔥 Most requested services" action="View analytics">
                  {[
                    ["AC Repair", "1,284", 92],
                    ["Home Cleaning", "982", 73],
                    ["Wedding Photography", "741", 61],
                    ["Plumber", "623", 52],
                  ].map(([name, val, pct]) => (
                    <div className="demand-row" key={String(name)}>
                      <div><strong>{name}</strong><span>{val} searches</span></div>
                      <div className="mini-track"><div style={{width:`${pct}%`}} /></div>
                    </div>
                  ))}
                </Card>

                <Card title="Latest leads" action="View all">
                  {leads.slice(0,4).map((l,i)=>(
                    <div className="lead-row" key={i}>
                      <div className="avatar">{String(l[0]).slice(0,1)}</div>
                      <div className="lead-main"><strong>{l[0]}</strong><span>{l[1]}</span></div>
                      <span className={`status ${String(l[3]).toLowerCase()}`}>{l[3]}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </>
          )}

          {active === "Businesses" && <Businesses />}
          {active === "Leads" && <Leads />}
          {active === "Map" && <MapView />}
          {active === "Ask the Town" && (
            <AskTown query={query} setQuery={setQuery} asked={asked} askTown={askTown} />
          )}
          {active === "Town Intelligence" && <Intelligence />}
          {active === "MCP Tools" && <MCP />}
        </div>
      </section>
    </main>
  );
}

function Stat({label,value,change}:{label:string,value:string,change:string}) {
  return <div className="stat"><div className="stat-top"><span>{label}</span><span className="trend">{change}</span></div><strong>{value}</strong><div className="spark">↗</div></div>
}

function Card({title,action,children}:{title:string,action?:string,children:React.ReactNode}) {
  return <section className="card"><div className="card-head"><h2>{title}</h2>{action && <button>{action} →</button>}</div>{children}</section>
}

function Pipeline({label,value,pct}:{label:string,value:string,pct:number}) {
  return <div className="pipe"><div><span>{label}</span><strong>{value}</strong></div><div className="track"><i style={{width:`${pct}%`}} /></div></div>
}

function Businesses() {
  return <><div className="hero-row"><div><p className="eyebrow">DIRECTORY</p><h1>Businesses</h1><p className="muted">2,843 local businesses across Town XYZ.</p></div><button className="primary">＋ Add Business</button></div>
    <div className="toolbar"><input placeholder="Search businesses, services..." /><button>Category⌄</button><button>Verification⌄</button><button>Export</button></div>
    <div className="card table-card"><table><thead><tr><th>Business</th><th>Category</th><th>Rating</th><th>Status</th><th>Leads</th><th></th></tr></thead><tbody>
      {businesses.map((b,i)=><tr key={i}><td><div className="biz"><span className="biz-icon">{b.icon}</span><div><strong>{b.name}</strong><small>{b.distance} • Town XYZ</small></div></div></td><td>{b.category}</td><td>⭐ {b.rating}</td><td><span className="verified">✓ Verified</span></td><td>{[84,71,63,58][i]}</td><td>•••</td></tr>)}
    </tbody></table></div>
  </>;
}

function Leads() {
  return <><div className="hero-row"><div><p className="eyebrow">OPERATIONS</p><h1>Lead pipeline</h1><p className="muted">Track customer requests from discovery to completion.</p></div><button className="primary">＋ Create Lead</button></div>
    <div className="lead-stats"><Stat label="New" value="42" change="+8" /><Stat label="Contacted" value="31" change="+5" /><Stat label="Quoted" value="18" change="+3" /><Stat label="Won" value="14" change="+4" /></div>
    <div className="card table-card"><table><thead><tr><th>Customer</th><th>Service</th><th>Business</th><th>Status</th><th>Value</th></tr></thead><tbody>
      {leads.map((l,i)=><tr key={i}><td><strong>{l[0]}</strong></td><td>{l[1]}</td><td>{l[2]}</td><td><span className={`status ${String(l[3]).toLowerCase()}`}>{l[3]}</span></td><td>{l[4]}</td></tr>)}
    </tbody></table></div>
  </>;
}

function MapView() {
  return <><div className="hero-row"><div><p className="eyebrow">DISCOVERY</p><h1>Town map</h1><p className="muted">Explore businesses and services around Town XYZ.</p></div></div>
    <div className="map-layout"><div className="map"><div className="map-grid" />
      {[[25,28],[45,52],[68,32],[73,67],[34,72],[56,22],[83,47],[18,55]].map((p,i)=><div key={i} className="pin" style={{left:`${p[0]}%`,top:`${p[1]}%`}}>📍</div>)}
      <div className="map-search">⌕ Search this area...</div>
      <div className="map-filter"><span>All</span><span>🍴 Food</span><span>🔧 Services</span><span>🛍 Shopping</span></div>
    </div><div className="map-side"><h3>Nearby</h3>{businesses.map(b=><div className="nearby" key={b.name}><span>{b.icon}</span><div><strong>{b.name}</strong><small>⭐ {b.rating} • {b.distance}</small></div></div>)}</div></div>
  </>;
}

function AskTown({query,setQuery,asked,askTown}:{query:string,setQuery:(s:string)=>void,asked:boolean,askTown:()=>void}) {
  return <><div className="ai-page"><div className="ai-glow" /><p className="eyebrow">TOWNCONNECT AI</p><h1>Ask your town anything.</h1><p className="muted">Describe what you need. We&apos;ll find relevant local businesses, services and offers.</p>
    <div className="ask-box"><textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Find an AC technician who can come today under ₹1,000..." /><div className="ask-bottom"><span>⌘ AI + MCP search</span><button className="primary" onClick={askTown}>Ask →</button></div></div>
    <div className="suggestions"><button onClick={()=>setQuery("Find a birthday cake under ₹1,000")}>🎂 Birthday cake under ₹1,000</button><button onClick={()=>setQuery("Find a wedding photographer under ₹20,000")}>📸 Wedding photographer under ₹20K</button><button onClick={()=>setQuery("Who repairs washing machines?")}>🔧 Washing machine repair</button></div>
    {asked && <div className="results"><div className="result-head"><div><strong>Found 4 businesses</strong><span>Based on your request • Town XYZ</span></div><span className="ai-pill">✦ AI matched</span></div>{businesses.map(b=><div className="result-card" key={b.name}><span className="biz-icon">{b.icon}</span><div className="result-main"><h3>{b.name}</h3><span>{b.category} • {b.distance} • ⭐ {b.rating}</span><p>✓ {b.status} &nbsp; • &nbsp; Starting {b.price}</p></div><div><button className="secondary">WhatsApp</button><button className="primary">Request</button></div></div>)}</div>}
    </div></>;
}

function Intelligence() {
  return <><div className="hero-row"><div><p className="eyebrow">AI BUSINESS INTELLIGENCE</p><h1>Town Intelligence</h1><p className="muted">See what customers are looking for — and where supply is missing.</p></div><button className="secondary">Export report</button></div>
    <div className="grid-2"><Card title="🔥 Demand hotspots"><div className="heat"><div className="heat-cell high">AC Repair<br/><b>1,284</b></div><div className="heat-cell high">Home Cleaning<br/><b>982</b></div><div className="heat-cell med">Photography<br/><b>741</b></div><div className="heat-cell med">Plumber<br/><b>623</b></div><div className="heat-cell low">Car Detailing<br/><b>384</b></div><div className="heat-cell low">RO Repair<br/><b>521</b></div></div></Card>
      <Card title="⚠️ Supply gaps"><div className="gap"><strong>Home Cleaning</strong><span>689 searches • 9 providers</span><b>High opportunity</b></div><div className="gap"><strong>RO Repair</strong><span>521 searches • 6 providers</span><b>High opportunity</b></div><div className="gap"><strong>Car Detailing</strong><span>384 searches • 4 providers</span><b>Medium opportunity</b></div></Card></div>
    <Card title="Search-to-supply overview"><div className="overview-bars">{["AC Repair","Home Cleaning","Photography","Plumber","RO Repair"].map((x,i)=><div key={x}><span>{x}</span><div><i style={{width:`${[92,78,65,55,47][i]}%`}} /></div><em>{[43,9,62,18,6][i]} providers</em></div>)}</div></Card></>;
}

function MCP() {
  const tools = ["search_businesses","search_services","find_nearby_businesses","get_business_details","get_business_reviews","compare_businesses","find_available_providers","create_lead","create_booking","request_quote"];
  return <><div className="hero-row"><div><p className="eyebrow">DEVELOPER PLATFORM</p><h1>TownConnect MCP</h1><p className="muted">AI tools exposed to agents for local-business discovery and transactions.</p></div><span className="live"><i /> Connected</span></div>
    <div className="mcp-stats"><Stat label="Tool calls today" value="18,421" change="+32%" /><Stat label="This month" value="481K" change="+21%" /><Stat label="Businesses indexed" value="2,843" change="+12%" /></div>
    <div className="card"><div className="card-head"><h2>Available tools</h2><span className="code-pill">townconnect-mcp</span></div>{tools.map(t=><div className="tool" key={t}><span className="tool-dot">✓</span><code>{t}()</code><button>Test →</button></div>)}</div></>;
}