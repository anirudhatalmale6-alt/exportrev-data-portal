/* ExportRev Data Portal — UI layer */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const money = (n, c) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: c || 'EUR', maximumFractionDigits: 0 }).format(n);
const money2 = (n, c) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: c || 'EUR' }).format(n);
const num = (n) => new Intl.NumberFormat('en-GB').format(n);
const esc = (s) => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const state = {
  view: 'dashboard',
  plan: ACCOUNT.plan,
  parts: { makeId: '', modelId: '', typeId: '', cat: '', brand: '', q: '', page: 1, per: 12 },
  tech: { typeId: 101, tab: 'service' },
  salv: { country: '', damage: '', make: '', runs: '', q: '', page: 1, per: 12 },
  api: { module: 'All' }
};

const planObj = () => PLANS.find(p => p.id === state.plan);
const can = (mod) => planObj().modules[mod];

/* call quota follows the selected plan; usage scales with it so the
   preview stays internally consistent when you switch tier */
const PLAN_LIMIT = { starter: 25000, pro: 250000, enterprise: null };
function quota() {
  const limit = PLAN_LIMIT[state.plan];
  if (limit === null) return { used: ACCOUNT.usage.used, limit: null, pct: null, scale: 1 };
  const used = Math.round(limit * 0.632);
  return { used, limit, pct: 63, scale: used / ACCOUNT.usage.used };
}

/* ================= JSON pretty printer ================= */
function jsonHtml(obj) {
  const j = JSON.stringify(obj, null, 2);
  return esc(j)
    .replace(/&quot;([^&]+)&quot;(\s*:)/g, '<span class="k-key">"$1"</span>$2')
    .replace(/:\s&quot;([^&]*)&quot;/g, ': <span class="k-str">"$1"</span>')
    .replace(/:\s(-?\d+\.?\d*)/g, ': <span class="k-num">$1</span>')
    .replace(/:\s(true|false|null)/g, ': <span class="k-bool">$1</span>');
}

/* ================= NAV ================= */
const NAV = [
  { grp: 'Overview', items: [
    { id: 'dashboard', ic: '▦', label: 'Dashboard' },
    { id: 'how', ic: '◎', label: 'How it works' }
  ]},
  { grp: 'Data modules', items: [
    { id: 'parts', ic: '⚙', label: 'Parts Catalogue', mod: 'parts' },
    { id: 'technical', ic: '◷', label: 'Technical Data', mod: 'technical' },
    { id: 'salvage', ic: '⚑', label: 'Damaged Vehicles', mod: 'salvage' }
  ]},
  { grp: 'Platform', items: [
    { id: 'api', ic: '{ }', label: 'API Reference' },
    { id: 'plans', ic: '◈', label: 'Plans & Billing' },
    { id: 'account', ic: '☰', label: 'Account & Keys' }
  ]}
];

function renderNav() {
  $('#nav').innerHTML = NAV.map(g => `
    <div class="navgrp">
      <h6>${g.grp}</h6>
      ${g.items.map(it => {
        const locked = it.mod && !can(it.mod);
        return `<div class="nav ${state.view === it.id ? 'on' : ''} ${locked ? 'locked' : ''}" data-view="${it.id}">
          <span class="ic">${it.ic}</span><span>${it.label}</span>
          ${locked ? '<span class="badge">🔒</span>' : ''}
        </div>`;
      }).join('')}
    </div>`).join('');
  $$('#nav .nav').forEach(n => n.onclick = () => go(n.dataset.view));

  const q = quota();
  $('#sidefoot').innerHTML = `
    <div class="pl">Current plan</div>
    <div class="pn">${planObj().name}</div>
    <div class="bar"><i style="width:${q.limit === null ? 26 : q.pct}%"></i></div>
    <small>${num(q.used)} ${q.limit === null ? 'calls · unlimited' : `/ ${num(q.limit)} calls · ${q.pct}%`}</small>`;
}

function go(v) { state.view = v; renderNav(); render(); window.scrollTo(0, 0); }

/* ================= DASHBOARD ================= */
function vDashboard() {
  const q = quota();
  const mx = Math.max(...ACCOUNT.daily);
  return `
  <div class="phead">
    <div>
      <h1>Dashboard</h1>
      <p>${ACCOUNT.company} · ${planObj().name} plan · customer since ${ACCOUNT.since}</p>
    </div>
    <div class="right">
      <button class="btn gh" data-go="api">API reference</button>
      <button class="btn pri" data-go="plans">Upgrade plan</button>
    </div>
  </div>

  <div class="grid g4" style="margin-bottom:16px">
    <div class="stat"><div class="k">API calls · this period</div><div class="v">${num(q.used)}</div><div class="d">${q.limit === null ? 'unlimited plan · <b>fair-use policy</b>' : `of ${num(q.limit)} included · <b>${100 - q.pct}% left</b>`}</div></div>
    <div class="stat"><div class="k">Articles in catalogue</div><div class="v">${num(PARTS.length)}</div><div class="d">across ${CATEGORIES.length} categories · ${BRANDS.length} brands</div></div>
    <div class="stat"><div class="k">Vehicle types covered</div><div class="v">${num(vehTypeCount())}</div><div class="d">${VEHICLES.length} manufacturers · ${modelCount()} models</div></div>
    <div class="stat"><div class="k">Salvage lots live</div><div class="v">${num(SALVAGE.length)}</div><div class="d">${new Set(SALVAGE.map(s => s.country)).size} countries · updated hourly</div></div>
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <div class="hd"><h3>API calls — last 30 days</h3><span class="sub">${num(Math.round(ACCOUNT.daily.reduce((a, b) => a + b, 0) * q.scale))} total</span></div>
      <div class="bd">
        <div class="spark">${ACCOUNT.daily.map(d => `<i style="height:${Math.round(d / mx * 100)}%" title="${num(Math.round(d * q.scale))} calls"></i>`).join('')}</div>
        <div class="axis"><span>30 days ago</span><span>15 days</span><span>Today</span></div>
      </div>
    </div>
    <div class="card">
      <div class="hd"><h3>Usage by endpoint</h3><span class="sub">current period</span></div>
      <div class="bd">
        <div class="hbar">
          ${ACCOUNT.endpointBreakdown.map(e => `
            <div class="r">
              <div class="t"><span class="mono">${e.ep}</span><span>${num(Math.round(e.calls * q.scale))} · ${e.pct}%</span></div>
              <div class="b"><i style="width:${e.pct * 2.1}%"></i></div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <div class="grid g3">
    ${['parts', 'technical', 'salvage'].map(m => {
      const meta = { parts: ['⚙', 'Parts Catalogue', 'OE & aftermarket articles with full vehicle fitment, cross-references and criteria.', 'parts'],
                     technical: ['◷', 'Technical Data', 'Service schedules, labour times, torque specs, fluid capacities and bulb types.', 'technical'],
                     salvage: ['⚑', 'Damaged Vehicles', 'Salvage & accident vehicle inventory with condition, title status and live bids.', 'salvage'] }[m];
      const ok = can(m);
      return `<div class="card"><div class="bd">
        <div style="display:flex;align-items:center;gap:11px;margin-bottom:9px">
          <div class="thumb" style="width:36px;height:36px;font-size:17px">${meta[0]}</div>
          <div><div style="font-weight:650;font-size:14.5px">${meta[1]}</div>
          <div style="font-size:11px" class="${ok ? 'dim' : ''}">${ok ? '<span class="tag ok">INCLUDED</span>' : '<span class="tag warn">NOT IN PLAN</span>'}</div></div>
        </div>
        <p class="muted" style="font-size:12.8px;min-height:52px">${meta[2]}</p>
        <button class="btn ${ok ? '' : 'gh'} sm" data-go="${ok ? m : 'plans'}">${ok ? 'Open module' : 'See plans'}</button>
      </div></div>`;
    }).join('')}
  </div>`;
}
const vehTypeCount = () => VEHICLES.reduce((a, m) => a + m.models.reduce((b, d) => b + d.types.length, 0), 0);
const modelCount = () => VEHICLES.reduce((a, m) => a + m.models.length, 0);

/* ================= HOW IT WORKS ================= */
function vHow() {
  return `
  <div class="phead">
    <div>
      <h1>How it works</h1>
      <p>From provider feed to billed API call — the four layers behind the portal.</p>
    </div>
    <div class="right">
      <button class="btn gh" data-go="api">API reference</button>
      <button class="btn pri" data-go="plans">Plans &amp; pricing</button>
    </div>
  </div>

  <div class="flow" style="margin-bottom:18px">
    <div class="fnode">
      <div class="step">Layer 1</div>
      <h4>Provider feeds</h4>
      <p>Licensed automotive data sources, synchronised on their own schedule.</p>
      <ul>
        <li>Parts &amp; fitment catalogue</li>
        <li>Technical / workshop data</li>
        <li>Salvage &amp; auction inventory</li>
      </ul>
    </div>
    <div class="fnode hl">
      <div class="step">Layer 2</div>
      <h4>ExportRev middleware</h4>
      <p>Holds the provider credentials. Customers never see them and never hold them.</p>
      <ul>
        <li>Normalises all feeds to one schema</li>
        <li>Caches hot responses</li>
        <li>Nightly &amp; on-demand sync jobs</li>
      </ul>
    </div>
    <div class="fnode hl">
      <div class="step">Layer 3</div>
      <h4>Plan gating &amp; metering</h4>
      <p>Every request is authenticated to a subscription before it is served.</p>
      <ul>
        <li>Module access per tier</li>
        <li>Rate limit 5 / 25 / 100 req/s</li>
        <li>One usage record per call → billing</li>
      </ul>
    </div>
    <div class="fnode">
      <div class="step">Layer 4</div>
      <h4>Customer</h4>
      <p>Web portal for the buyer's team, REST API for their systems.</p>
      <ul>
        <li>Search, filter, drill down</li>
        <li>CSV export of any result set</li>
        <li>Direct API with their own key</li>
      </ul>
    </div>
  </div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card">
      <div class="hd"><h3>Why the middleware layer matters</h3><span class="sub">commercial</span></div>
      <div class="bd">
        <div class="why">
          <div class="w"><span>🔐</span><div><b>Credentials stay with us</b><p>The subscriber authenticates against ExportRev, never against the upstream provider.</p></div></div>
          <div class="w"><span>◷</span><div><b>Every call is attributable</b><p>Each request is tied to a subscription, so usage can be reported, capped and billed.</p></div></div>
          <div class="w"><span>◈</span><div><b>Tiering is enforced server-side</b><p>Module access comes from the plan record, not the client — upgrades take effect instantly.</p></div></div>
          <div class="w"><span>⚡</span><div><b>Caching cuts upstream cost</b><p>Repeated lookups are served from cache, so subscriber growth does not scale provider calls 1:1.</p></div></div>
          <div class="w"><span>▦</span><div><b>One schema for every feed</b><p>Parts, technical and salvage data come back in the same response shape — the customer integrates once.</p></div></div>
          <div class="w"><span>◎</span><div><b>Providers can be swapped</b><p>The schema belongs to ExportRev, so adding or changing an upstream source does not break a single customer integration.</p></div></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="hd"><h3>Example request</h3><span class="sub">the whole flow in one call</span></div>
      <div class="bd">
        <pre class="code">GET /v1/parts?typeId=201&amp;category=brake
Authorization: Bearer exr_live_••••••••••••</pre>
        <div class="hbar" style="margin-top:14px">
          ${[['Authenticate key → subscription', 3],
             ['Check module in plan', 5],
             ['Check rate limit &amp; quota', 4],
             ['Serve from cache or provider', 78],
             ['Write usage record', 10]].map(([t, p]) => `
            <div class="r">
              <div class="t"><span>${t}</span><span>${p}%</span></div>
              <div class="b"><i style="width:${p}%"></i></div>
            </div>`).join('')}
        </div>
        <p class="muted" style="font-size:12.2px;margin-top:12px">
          Relative share of the request path. The provider round-trip is the only expensive
          step, which is why it is the one that gets cached.
        </p>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="hd"><h3>What is real in this preview</h3><span class="sub">read before demoing</span></div>
    <div class="bd">
      <p class="muted" style="font-size:13.2px;max-width:860px">
        The portal, the plan gating, the metering, the filtering and the API surface are all real
        and working. The data behind them is <b>synthetic sample data generated locally</b> — it is
        shaped like a real automotive feed so that connecting a licensed provider is a data-source
        change, not a rebuild. No provider data is included, reproduced or implied.
      </p>
    </div>
  </div>`;
}

/* ================= PARTS ================= */
function filteredParts() {
  const f = state.parts;
  const q = f.q.trim().toLowerCase();
  return PARTS.filter(p =>
    (!f.makeId || p.makeId === f.makeId) &&
    (!f.typeId || p.typeId === +f.typeId) &&
    (!f.modelId || modelOfType(p.typeId) === f.modelId) &&
    (!f.cat || p.categoryId === f.cat) &&
    (!f.brand || p.brand === f.brand) &&
    (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) ||
      p.articleNo.toLowerCase().includes(q) || p.oe.join(' ').toLowerCase().includes(q))
  );
}
function modelOfType(typeId) {
  for (const mk of VEHICLES) for (const md of mk.models) if (md.types.some(t => t.id === typeId)) return md.id;
  return '';
}
function typeById(id) {
  for (const mk of VEHICLES) for (const md of mk.models) { const t = md.types.find(t => t.id === +id); if (t) return { mk, md, t }; }
  return null;
}

function vParts() {
  const f = state.parts;
  const models = f.makeId ? (VEHICLES.find(v => v.id === f.makeId)?.models || []) : [];
  const types = f.modelId ? (models.find(m => m.id === f.modelId)?.types || []) : [];
  const res = filteredParts();
  const pages = Math.max(1, Math.ceil(res.length / f.per));
  if (f.page > pages) f.page = pages;
  const slice = res.slice((f.page - 1) * f.per, f.page * f.per);
  const brands = [...new Set(res.map(p => p.brand))].sort();

  return `
  <div class="phead">
    <div><h1>Parts Catalogue</h1><p>Vehicle-linked article search — OE numbers, cross-references and technical criteria</p></div>
    <div class="right">
      <button class="btn gh sm" id="csv">↓ Export CSV</button>
      <button class="btn gh sm" data-go="api">API for this view</button>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px"><div class="bd">
    <div style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--txt-3);margin-bottom:10px;font-weight:600">Vehicle selector</div>
    <div class="filters" style="margin-bottom:0">
      <select class="sel" id="f-make"><option value="">All manufacturers</option>
        ${VEHICLES.map(v => `<option value="${v.id}" ${f.makeId === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
      <select class="sel" id="f-model" ${!f.makeId ? 'disabled' : ''} style="min-width:230px"><option value="">All models</option>
        ${models.map(m => `<option value="${m.id}" ${f.modelId === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}</select>
      <select class="sel" id="f-type" ${!f.modelId ? 'disabled' : ''} style="min-width:210px"><option value="">All engines / types</option>
        ${types.map(t => `<option value="${t.id}" ${+f.typeId === t.id ? 'selected' : ''}>${t.name} · ${t.hp} hp · ${t.from}→${t.to}</option>`).join('')}</select>
      <select class="sel" id="f-brand"><option value="">All brands</option>
        ${brands.map(b => `<option value="${b}" ${f.brand === b ? 'selected' : ''}>${b}</option>`).join('')}</select>
      <input class="sel" id="f-q" style="min-width:210px" placeholder="Article no., OE, keyword…" value="${esc(f.q)}">
      <button class="btn sm gh" id="f-reset">Reset</button>
    </div>
    ${f.typeId ? typeBanner(f.typeId) : ''}
  </div></div>

  <div class="filters">
    <span class="chip ${!f.cat ? 'on' : ''}" data-cat="">All categories</span>
    ${CATEGORIES.map(c => `<span class="chip ${f.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</span>`).join('')}
  </div>

  <div class="card">
    <div class="hd"><h3>${num(res.length)} articles</h3><span class="sub">page ${f.page} of ${pages}</span></div>
    ${slice.length ? `<div class="tbl-wrap"><table>
      <thead><tr><th></th><th>Article</th><th>Vehicle fitment</th><th>OE numbers</th><th>Availability</th><th class="right-t">Price</th></tr></thead>
      <tbody>${slice.map(p => `
        <tr class="part-row" data-part="${p.id}" style="cursor:pointer">
          <td><div class="thumb">${CATEGORIES.find(c => c.id === p.categoryId).icon}</div></td>
          <td>
            <div style="font-weight:600">${p.name}</div>
            <div style="font-size:11.5px;margin-top:2px"><span class="tag ${p.tier === 'OE' ? 'oe' : 'am'}">${p.brand}</span>
              <span class="mono dim" style="margin-left:6px">${p.articleNo}</span></div>
            <div class="crit">${Object.entries(p.criteria).slice(0, 3).map(([k, v]) => `<span>${k}: ${v}</span>`).join('')}</div>
          </td>
          <td class="muted" style="font-size:12.3px">${p.make} ${p.model.split(' (')[0]}<br><span class="dim">${p.typeName}</span></td>
          <td class="oe-list">${p.oe.join('<br>')}</td>
          <td><span class="tag ${p.stock === 'In stock' ? 'ok' : p.stock === 'Low stock' ? 'warn' : 'blue'}">${p.stock}</span>
            <div class="dim" style="font-size:11px;margin-top:3px">${p.qtyAvailable} pcs · ${p.leadTime}</div></td>
          <td class="right-t"><div class="price">${money2(p.price, p.currency)}</div><div class="dim" style="font-size:10.5px">excl. VAT</div></td>
        </tr>`).join('')}</tbody></table></div>
      ${pager(f.page, pages)}` : `<div class="empty"><div class="big">⌕</div>No articles match these filters.<br><span style="font-size:12.5px">Try clearing the engine type or category.</span></div>`}
  </div>`;
}

function typeBanner(typeId) {
  const r = typeById(typeId); if (!r) return '';
  const t = r.t;
  return `<div style="margin-top:13px;padding:12px 14px;border:1px solid rgba(47,212,168,.25);background:rgba(47,212,168,.05);border-radius:10px;display:flex;gap:22px;flex-wrap:wrap;font-size:12.5px">
    <div><span class="dim">Selected</span><br><b>${r.mk.name} ${r.md.name.split(' (')[0]} ${t.name}</b></div>
    <div><span class="dim">Output</span><br>${t.kw} kW / ${t.hp} hp</div>
    <div><span class="dim">Capacity</span><br>${num(t.cc)} cc · ${t.fuel}</div>
    <div><span class="dim">Engine codes</span><br><span class="mono">${t.engine}</span></div>
    <div><span class="dim">Build period</span><br>${t.from} → ${t.to}</div>
    <div><span class="dim">Body</span><br>${t.body}</div>
  </div>`;
}

function pager(page, pages) {
  const btns = [];
  const from = Math.max(1, page - 2), to = Math.min(pages, from + 4);
  for (let i = from; i <= to; i++) btns.push(`<span class="pg ${i === page ? 'on' : ''}" data-pg="${i}">${i}</span>`);
  return `<div class="pager">
    <button class="pg" data-pg="${page - 1}" ${page === 1 ? 'disabled' : ''}>‹ Prev</button>
    ${btns.join('')}
    <button class="pg" data-pg="${page + 1}" ${page === pages ? 'disabled' : ''}>Next ›</button>
  </div>`;
}

/* part drawer */
function openPart(id) {
  const p = PARTS.find(x => x.id === +id); if (!p) return;
  $('#drawer').innerHTML = `
    <div class="dh" style="display:flex;align-items:flex-start;gap:12px">
      <div class="thumb" style="width:44px;height:44px;font-size:20px">${CATEGORIES.find(c => c.id === p.categoryId).icon}</div>
      <div><div style="font-size:16.5px;font-weight:700;letter-spacing:-.3px">${p.name}</div>
        <div style="margin-top:4px"><span class="tag ${p.tier === 'OE' ? 'oe' : 'am'}">${p.brand}</span>
        <span class="mono dim" style="margin-left:7px">${p.articleNo}</span></div></div>
      <button class="close" id="dclose">×</button>
    </div>
    <div class="db">
      <div style="display:flex;align-items:flex-end;gap:14px;margin-bottom:6px">
        <div><div class="dim" style="font-size:10.5px;letter-spacing:1px;text-transform:uppercase">Trade price</div>
          <div style="font-size:27px;font-weight:750;letter-spacing:-1px">${money2(p.price, p.currency)}</div></div>
        <div style="margin-left:auto;text-align:right">
          <span class="tag ${p.stock === 'In stock' ? 'ok' : p.stock === 'Low stock' ? 'warn' : 'blue'}">${p.stock}</span>
          <div class="dim" style="font-size:11.5px;margin-top:4px">${p.qtyAvailable} pcs · dispatch ${p.leadTime}</div>
        </div>
      </div>

      <div class="sec-t">Vehicle fitment</div>
      <dl class="kv">
        <dt>Manufacturer</dt><dd>${p.make}</dd>
        <dt>Model</dt><dd>${p.model}</dd>
        <dt>Type / engine</dt><dd>${p.typeName}</dd>
        <dt>Type ID</dt><dd class="mono">${p.typeId}</dd>
      </dl>

      <div class="sec-t">Technical criteria</div>
      <dl class="kv">${Object.entries(p.criteria).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>

      <div class="sec-t">OE reference numbers</div>
      <div class="oe-list">${p.oe.map(o => `${o}`).join('<br>')}</div>

      <div class="sec-t">Cross-references (${p.crossRef.length})</div>
      <div class="oe-list">${p.crossRef.join('<br>')}</div>

      <div class="sec-t">Identification</div>
      <dl class="kv">
        <dt>EAN</dt><dd class="mono">${p.ean}</dd>
        <dt>Category</dt><dd>${p.category}</dd>
        <dt>Quality tier</dt><dd>${p.tier === 'OE' ? 'OE / OEM supplier' : 'Aftermarket'}</dd>
        <dt>Record updated</dt><dd>${p.updated}</dd>
      </dl>

      <div class="sec-t">API response for this article</div>
      <pre>${jsonHtml({
        id: p.id, articleNo: p.articleNo, brand: p.brand, name: p.name,
        vehicle: { typeId: p.typeId, make: p.make, model: p.model, type: p.typeName },
        criteria: p.criteria, oe: p.oe, crossRef: p.crossRef.slice(0, 3),
        ean: p.ean, price: p.price, currency: p.currency, stock: p.stock, qtyAvailable: p.qtyAvailable
      })}</pre>
    </div>`;
  showDrawer();
}
function showDrawer() {
  $('#drawer').classList.add('on'); $('#scrim').classList.add('on');
  $('#dclose').onclick = hideDrawer;
}
function hideDrawer() { $('#drawer').classList.remove('on'); $('#scrim').classList.remove('on'); }

/* ================= TECHNICAL ================= */
function vTechnical() {
  if (!can('technical')) return lockView('Technical Data', 'Service schedules, standard repair times, torque specifications, fluid capacities and bulb types for every vehicle type in the catalogue.', 'Professional');
  const t = state.tech;
  const r = typeById(t.typeId);
  const d = TECH[t.typeId];
  const tabs = [['service', 'Service schedule'], ['repair', 'Repair times'], ['torque', 'Torque specs'], ['fluids', 'Fluids & capacities'], ['bulbs', 'Bulbs']];

  let body = '';
  if (t.tab === 'service') body = tbl(['Item', 'Interval', 'Specification', 'Quantity'], d.service.map(x => [x.item, x.interval, x.spec, x.qty]));
  if (t.tab === 'repair') body = tbl(['Code', 'Operation', 'Labour time'], d.repairTimes.map(x => [`<span class="mono">${x.code}</span>`, x.job, `<b>${x.hours} h</b>`]));
  if (t.tab === 'torque') body = tbl(['Fastener', 'Torque', 'Note'], d.torque.map(x => [x.item, `<b>${x.nm}${/Nm|°/.test(x.nm) ? '' : ' Nm'}</b>`, `<span class="muted">${x.note}</span>`]));
  if (t.tab === 'fluids') body = tbl(['System', 'Capacity', 'Specification'], d.fluids.map(x => [x.item, `<b>${x.qty}</b>`, x.spec]));
  if (t.tab === 'bulbs') body = tbl(['Position', 'Bulb type'], d.bulbs.map(x => [x.pos, `<span class="mono">${x.type}</span>`]));

  return `
  <div class="phead">
    <div><h1>Technical Data</h1><p>Workshop reference — schedules, labour times, torque values and capacities</p></div>
    <div class="right"><button class="btn gh sm" data-go="api">API for this view</button></div>
  </div>

  <div class="card" style="margin-bottom:16px"><div class="bd">
    <div class="filters" style="margin-bottom:0">
      <select class="sel" id="t-type" style="min-width:420px">
        ${VEHICLES.map(mk => `<optgroup label="${mk.name}">${mk.models.map(md => md.types.map(ty =>
          `<option value="${ty.id}" ${+t.typeId === ty.id ? 'selected' : ''}>${mk.name} ${md.name.split(' (')[0]} ${ty.name} · ${ty.hp} hp (${ty.from}→${ty.to})</option>`).join('')).join('')}</optgroup>`).join('')}
      </select>
    </div>
    ${typeBanner(t.typeId)}
  </div></div>

  <div class="tabs">${tabs.map(([k, l]) => `<div class="tab ${t.tab === k ? 'on' : ''}" data-tab="${k}">${l}</div>`).join('')}</div>
  <div class="card"><div class="hd"><h3>${tabs.find(x => x[0] === t.tab)[1]}</h3>
    <span class="sub">${r.mk.name} ${r.md.name.split(' (')[0]} ${r.t.name}</span></div>
    <div class="tbl-wrap">${body}</div></div>`;
}
function tbl(head, rows) {
  return `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

/* ================= SALVAGE ================= */
function filteredSalvage() {
  const f = state.salv, q = f.q.trim().toLowerCase();
  return SALVAGE.filter(s =>
    (!f.country || s.country === f.country) &&
    (!f.damage || s.damagePrimary === f.damage) &&
    (!f.make || s.makeId === f.make) &&
    (f.runs === '' || String(s.runsAndDrives) === f.runs) &&
    (!q || `${s.make} ${s.model} ${s.lot} ${s.vin}`.toLowerCase().includes(q))
  );
}
function vSalvage() {
  if (!can('salvage')) return lockView('Damaged / Accident Vehicles', 'Live salvage inventory: primary and secondary damage, severity, title status, runs-and-drives flag, current bid, buy-now price and sale date — filterable by country, damage type and manufacturer.', 'Enterprise');
  const f = state.salv, res = filteredSalvage();
  const pages = Math.max(1, Math.ceil(res.length / f.per));
  if (f.page > pages) f.page = pages;
  const slice = res.slice((f.page - 1) * f.per, f.page * f.per);
  const countries = [...new Set(SALVAGE.map(s => s.country))].sort();

  return `
  <div class="phead">
    <div><h1>Damaged Vehicles</h1><p>Salvage & accident inventory with condition, title status and live bid data</p></div>
    <div class="right"><button class="btn gh sm" id="csv">↓ Export CSV</button><button class="btn gh sm" data-go="api">API for this view</button></div>
  </div>

  <div class="grid g4" style="margin-bottom:16px">
    <div class="stat"><div class="k">Lots available</div><div class="v">${num(res.length)}</div><div class="d">of ${SALVAGE.length} total in feed</div></div>
    <div class="stat"><div class="k">Runs & drives</div><div class="v">${res.filter(s => s.runsAndDrives).length}</div><div class="d">${res.length ? Math.round(res.filter(s => s.runsAndDrives).length / res.length * 100) : 0}% of filtered lots</div></div>
    <div class="stat"><div class="k">Avg. current bid</div><div class="v">${res.length ? money(Math.round(res.reduce((a, s) => a + s.currentBid, 0) / res.length)) : '—'}</div><div class="d">across all currencies (EUR eq.)</div></div>
    <div class="stat"><div class="k">Buy-now available</div><div class="v">${res.filter(s => s.buyNow).length}</div><div class="d">instant purchase, no auction</div></div>
  </div>

  <div class="filters">
    <select class="sel" id="s-country"><option value="">All countries</option>${countries.map(c => `<option ${f.country === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <select class="sel" id="s-damage" style="min-width:170px"><option value="">All damage types</option>${DAMAGE_TYPES.map(d => `<option ${f.damage === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
    <select class="sel" id="s-make"><option value="">All makes</option>${VEHICLES.map(v => `<option value="${v.id}" ${f.make === v.id ? 'selected' : ''}>${v.name}</option>`).join('')}</select>
    <select class="sel" id="s-runs"><option value="">Runs — any</option><option value="true" ${f.runs === 'true' ? 'selected' : ''}>Runs & drives</option><option value="false" ${f.runs === 'false' ? 'selected' : ''}>Non-runner</option></select>
    <input class="sel" id="s-q" style="min-width:200px" placeholder="Lot, VIN, model…" value="${esc(f.q)}">
    <button class="btn sm gh" id="s-reset">Reset</button>
  </div>

  ${slice.length ? `<div class="sv-grid">${slice.map(s => `
    <div class="sv" data-lot="${s.lot}">
      <div class="ph">
        <div class="car">${s.body === 'Van' ? '🚐' : s.body === 'Pickup' ? '🛻' : s.body === 'SUV' ? '🚙' : '🚗'}</div>
        <span class="sev"><span class="tag ${s.severity === 'Heavy' ? 'dmg' : s.severity === 'Moderate' ? 'warn' : 'blue'}">${s.severity}</span></span>
        <span class="cnt">▣ ${s.photos} photos</span>
      </div>
      <div class="in">
        <h4>${s.year} ${s.make} ${s.model}</h4>
        <div class="sm">${s.typeName} · ${s.fuel} · ${num(s.odometer)} km</div>
        <div class="meta">
          <span class="tag dmg">${s.damagePrimary}</span>
          ${s.runsAndDrives ? '<span class="tag ok">Runs &amp; drives</span>' : '<span class="tag am">Non-runner</span>'}
          ${s.keys ? '<span class="tag am">Keys</span>' : ''}
        </div>
        <div class="dim" style="font-size:11.5px">⚑ ${s.location} · sale ${s.saleDate}</div>
        <div class="bid">
          <div><div class="lab">Current bid</div><div class="amt">${money(s.currentBid, s.currency)}</div></div>
          <div style="text-align:right"><div class="lab">${s.buyNow ? 'Buy now' : 'Est. retail'}</div>
            <div style="font-size:13px;font-weight:600">${money(s.buyNow || s.estRetail, s.currency)}</div></div>
        </div>
      </div>
    </div>`).join('')}</div>${pager(f.page, pages)}`
    : `<div class="card"><div class="empty"><div class="big">⚑</div>No lots match these filters.</div></div>`}`;
}

function openLot(lot) {
  const s = SALVAGE.find(x => x.lot === lot); if (!s) return;
  $('#drawer').innerHTML = `
    <div class="dh" style="display:flex;align-items:flex-start;gap:12px">
      <div><div style="font-size:16.5px;font-weight:700;letter-spacing:-.3px">${s.year} ${s.make} ${s.model}</div>
        <div class="mono dim" style="font-size:12px;margin-top:4px">${s.lot} · VIN ${s.vin}</div></div>
      <button class="close" id="dclose">×</button>
    </div>
    <div class="db">
      <div style="height:170px;border-radius:11px;background:linear-gradient(135deg,#1A2942,#111C30);display:grid;place-items:center;border:1px solid var(--line);margin-bottom:16px;position:relative">
        <div style="font-size:56px;opacity:.3">${s.body === 'Van' ? '🚐' : s.body === 'Pickup' ? '🛻' : s.body === 'SUV' ? '🚙' : '🚗'}</div>
        <span style="position:absolute;left:11px;bottom:11px;font-size:11px;background:rgba(6,11,20,.8);padding:4px 9px;border-radius:20px;color:var(--txt-2)">▣ ${s.photos} photos in feed</span>
      </div>

      <div style="display:flex;gap:14px;align-items:flex-end;margin-bottom:4px">
        <div><div class="dim" style="font-size:10.5px;letter-spacing:1px;text-transform:uppercase">Current bid</div>
          <div style="font-size:27px;font-weight:750;letter-spacing:-1px;color:var(--acc)">${money(s.currentBid, s.currency)}</div></div>
        ${s.buyNow ? `<div style="margin-left:auto;text-align:right"><div class="dim" style="font-size:10.5px;letter-spacing:1px;text-transform:uppercase">Buy now</div>
          <div style="font-size:19px;font-weight:700">${money(s.buyNow, s.currency)}</div></div>` : ''}
      </div>

      <div class="sec-t">Damage & condition</div>
      <dl class="kv">
        <dt>Primary damage</dt><dd><span class="tag dmg">${s.damagePrimary}</span></dd>
        <dt>Secondary damage</dt><dd>${s.damageSecondary}</dd>
        <dt>Severity</dt><dd>${s.severity}</dd>
        <dt>Runs & drives</dt><dd>${s.runsAndDrives ? '<span class="tag ok">Yes</span>' : '<span class="tag am">No</span>'}</dd>
        <dt>Keys present</dt><dd>${s.keys ? 'Yes' : 'No'}</dd>
        <dt>Airbags deployed</dt><dd>${s.airbagsDeployed ? 'Yes' : 'No'}</dd>
        <dt>Title / document</dt><dd>${s.title}</dd>
      </dl>

      <div class="sec-t">Vehicle</div>
      <dl class="kv">
        <dt>Year</dt><dd>${s.year}</dd>
        <dt>Body</dt><dd>${s.body}</dd>
        <dt>Engine</dt><dd>${s.engine} · ${s.fuel}</dd>
        <dt>Odometer</dt><dd>${num(s.odometer)} km</dd>
        <dt>Type ID (catalogue)</dt><dd class="mono">${s.typeId} — parts available</dd>
      </dl>

      <div class="sec-t">Sale</div>
      <dl class="kv">
        <dt>Location</dt><dd>${s.location}</dd>
        <dt>Sale date</dt><dd>${s.saleDate}</dd>
        <dt>Est. retail value</dt><dd>${money(s.estRetail, s.currency)}</dd>
        <dt>Currency</dt><dd>${s.currency}</dd>
      </dl>

      <div class="sec-t">API response for this lot</div>
      <pre>${jsonHtml({
        lot: s.lot, vin: s.vin, make: s.make, model: s.model, year: s.year, typeId: s.typeId,
        odometer: s.odometer, damagePrimary: s.damagePrimary, damageSecondary: s.damageSecondary,
        severity: s.severity, runsAndDrives: s.runsAndDrives, airbagsDeployed: s.airbagsDeployed,
        title: s.title, location: s.location, currentBid: s.currentBid, buyNow: s.buyNow,
        currency: s.currency, saleDate: s.saleDate, photos: s.photos
      })}</pre>
    </div>`;
  showDrawer();
}

/* ================= LOCKED ================= */
function lockView(title, desc, needed) {
  return `<div class="phead"><div><h1>${title}</h1><p>Module not included in your current plan</p></div></div>
  <div class="lock">
    <div class="ic">🔒</div>
    <h3>${title} is a ${needed} module</h3>
    <p>${desc}</p>
    <button class="btn pri" data-go="plans">View plans</button>
    <div style="margin-top:20px;font-size:12.3px" class="dim">Your current plan: <b style="color:var(--txt)">${planObj().name}</b> · switch plan on the Plans page to preview this module.</div>
  </div>`;
}

/* ================= PLANS ================= */
function vPlans() {
  return `
  <div class="phead">
    <div><h1>Plans & Billing</h1><p>Module access, call quotas and rate limits per subscription tier</p></div>
  </div>

  <div class="note" style="margin-bottom:18px">
    <span>ⓘ</span><div><b>Preview mode.</b> Switching plan here changes what the portal unlocks so you can see each tier from the customer's side. No payment is taken.</div>
  </div>

  <div class="plans">${PLANS.map(p => `
    <div class="plan ${p.id === state.plan ? 'cur' : ''}">
      ${p.popular ? '<span class="rib">Most popular</span>' : ''}
      <h3>${p.name}</h3>
      <div class="tl">${p.tagline}</div>
      <div class="pr"><b>€${p.price}</b><span>/ ${p.period}</span></div>
      <div class="dim" style="font-size:11.5px">billed monthly · annual −15%</div>
      <div class="quota">
        <div><div class="q">${p.calls}</div><div class="l">API calls</div></div>
        <div><div class="q">${p.seats}</div><div class="l">Seats</div></div>
        <div><div class="q">${p.rate}</div><div class="l">Rate limit</div></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:15px">
        ${Object.entries(p.modules).map(([k, v]) => `<span class="tag ${v ? 'oe' : 'am'}">${v ? '✓' : '·'} ${{ parts: 'Parts', technical: 'Technical', salvage: 'Salvage' }[k]}</span>`).join('')}
      </div>
      <ul>${p.features.map(f => `<li>${f}</li>`).join('')}</ul>
      <button class="btn ${p.id === state.plan ? '' : 'pri'}" data-plan="${p.id}" ${p.id === state.plan ? 'disabled style="opacity:.6;cursor:default"' : ''}>
        ${p.id === state.plan ? 'Current plan' : 'Switch to ' + p.name}</button>
    </div>`).join('')}
  </div>

  <div class="grid g2" style="margin-top:18px">
    <div class="card"><div class="hd"><h3>Invoices</h3></div>
      <div class="tbl-wrap">${tbl(['Invoice', 'Date', 'Amount', 'Status'], ACCOUNT.invoices.map(i =>
        [`<span class="mono">${i.no}</span>`, i.date, `€${i.amount}.00`, `<span class="tag ok">${i.status}</span>`]))}</div>
    </div>
    <div class="card"><div class="hd"><h3>What each module contains</h3></div><div class="bd">
      <dl class="kv" style="grid-template-columns:120px 1fr;gap:14px">
        <dt>Parts</dt><dd class="muted">Article master data, vehicle-to-part fitment, OE numbers, cross-references, criteria, EAN, stock and pricing.</dd>
        <dt>Technical</dt><dd class="muted">Service schedules, standard labour times, torque specifications with angle stages, fluid capacities, bulb types.</dd>
        <dt>Salvage</dt><dd class="muted">Damaged / accident vehicle lots: damage type &amp; severity, title status, runs-and-drives, current bid, buy-now, sale date and location.</dd>
      </dl>
      <div class="note" style="margin-top:16px"><span>ⓘ</span><div>Metering, rate limiting and module gating are enforced at the middleware layer — customers never hold upstream provider credentials.</div></div>
    </div></div>
  </div>`;
}

/* ================= API ================= */
function vApi() {
  const mods = ['All', 'Parts', 'Technical', 'Salvage', 'Platform'];
  const list = ENDPOINTS.filter(e => state.api.module === 'All' || e.module === state.api.module);
  return `
  <div class="phead">
    <div><h1>API Reference</h1><p>REST · JSON · Bearer authentication · base URL <span class="mono">https://api.exportrev.com</span></p></div>
  </div>

  <div class="grid g3" style="margin-bottom:18px">
    <div class="card"><div class="bd"><div class="k dim" style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase">Authentication</div>
      <pre style="margin-top:9px">curl https://api.exportrev.com/v1/parts/search?typeId=101 \\
  -H "Authorization: Bearer exr_live_…"</pre></div></div>
    <div class="card"><div class="bd"><div class="k dim" style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase">Your rate limit</div>
      <div style="font-size:26px;font-weight:750;letter-spacing:-.9px;margin:7px 0 3px">${planObj().rate}</div>
      <div class="muted" style="font-size:12.5px">429 returned with <span class="mono">Retry-After</span> header on breach</div></div></div>
    <div class="card"><div class="bd"><div class="k dim" style="font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase">Response format</div>
      <div style="font-size:26px;font-weight:750;letter-spacing:-.9px;margin:7px 0 3px">JSON</div>
      <div class="muted" style="font-size:12.5px">Cursor pagination · ISO-8601 dates · ISO-4217 currencies</div></div></div>
  </div>

  <div class="filters">${mods.map(m => `<span class="chip ${state.api.module === m ? 'on' : ''}" data-mod="${m}">${m}</span>`).join('')}</div>

  ${list.map((e, i) => `
    <div class="ep" data-ep="${i}">
      <div class="eh"><span class="verb ${e.method}">${e.method}</span><span class="pt">${esc(e.path)}</span>
        <span class="tag ${e.module === 'Salvage' ? 'dmg' : e.module === 'Technical' ? 'blue' : e.module === 'Parts' ? 'oe' : 'am'}" style="margin-left:8px">${e.module}</span>
        <span class="ed">${e.desc}</span></div>
      <div class="body">
        <div class="sec-t" style="margin-top:0">Example response</div>
        <pre>${jsonHtml(e.sample)}</pre>
      </div>
    </div>`).join('')}

  <div class="note" style="margin-top:18px"><span>ⓘ</span><div>
    <b>Architecture note.</b> Client applications call ExportRev only. The middleware holds the upstream provider credentials, applies the caller's plan limits, caches hot responses and writes a usage record per request — which is what makes per-tier billing and resale possible.
  </div></div>`;
}

/* ================= ACCOUNT ================= */
function vAccount() {
  const q = quota();
  return `
  <div class="phead"><div><h1>Account & API Keys</h1><p>${ACCOUNT.company} · ${planObj().name} plan</p></div>
    <div class="right"><button class="btn pri sm" id="newkey">+ Create API key</button></div></div>

  <div class="grid g2" style="margin-bottom:16px">
    <div class="card"><div class="hd"><h3>API keys</h3><span class="sub">${ACCOUNT.apiKeys.length} of ${planObj().id === 'starter' ? 1 : planObj().id === 'pro' ? 5 : '∞'} used</span></div>
      <div class="bd">
        ${ACCOUNT.apiKeys.map(k => `
          <div class="keyrow">
            <div style="min-width:0;flex:1">
              <div style="font-size:12.5px;font-weight:600;margin-bottom:3px">${k.label}
                <span class="tag ${k.label === 'Production' ? 'ok' : 'am'}" style="margin-left:6px">${k.label === 'Production' ? 'LIVE' : 'TEST'}</span></div>
              <div class="kk dim">${k.key}</div>
            </div>
            <div style="text-align:right;font-size:11.5px" class="dim">${num(k.calls30d)} calls / 30d<br>last used ${k.lastUsed}</div>
            <button class="btn sm gh">Rotate</button>
          </div>`).join('')}
        <div class="note" style="margin-top:12px"><span>ⓘ</span><div>Keys are shown once at creation. Rotating a key keeps the old one valid for 24 h so integrations can migrate without downtime.</div></div>
      </div>
    </div>

    <div class="card"><div class="hd"><h3>Usage this period</h3><span class="sub">resets 1 Sep 2026</span></div><div class="bd">
      <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:11px">
        <div style="font-size:31px;font-weight:750;letter-spacing:-1.2px">${num(q.used)}</div>
        <div class="dim" style="padding-bottom:7px">${q.limit === null ? 'calls · unlimited' : `/ ${num(q.limit)} calls`}</div>
        <div style="margin-left:auto"><span class="tag ok">${q.limit === null ? 'Fair use' : q.pct + '% used'}</span></div>
      </div>
      <div class="bar" style="height:8px"><i style="width:${q.limit === null ? 26 : q.pct}%"></i></div>
      <div class="sec-t">Breakdown</div>
      <div class="hbar">${ACCOUNT.endpointBreakdown.map(e => `
        <div class="r"><div class="t"><span class="mono">${e.ep}</span><span>${num(Math.round(e.calls * q.scale))}</span></div>
        <div class="b"><i style="width:${e.pct * 2.1}%"></i></div></div>`).join('')}</div>
    </div></div>
  </div>

  <div class="card"><div class="hd"><h3>Organisation</h3></div><div class="bd">
    <dl class="kv" style="grid-template-columns:180px 1fr">
      <dt>Company</dt><dd>${ACCOUNT.company}</dd>
      <dt>Plan</dt><dd>${planObj().name} — €${planObj().price}/month</dd>
      <dt>Seats</dt><dd>${planObj().seats} included</dd>
      <dt>Rate limit</dt><dd>${planObj().rate}</dd>
      <dt>Modules</dt><dd>${Object.entries(planObj().modules).filter(([, v]) => v).map(([k]) => ({ parts: 'Parts', technical: 'Technical', salvage: 'Salvage' }[k])).join(' · ')}</dd>
      <dt>Customer since</dt><dd>${ACCOUNT.since}</dd>
      <dt>Data delivery</dt><dd>REST API${planObj().id === 'enterprise' ? ' · bulk feed (S3 / SFTP) · webhooks' : planObj().id === 'pro' ? ' · webhooks · CSV / XLSX export' : ' · CSV export'}</dd>
    </dl>
  </div></div>`;
}

/* ================= CSV EXPORT ================= */
function exportCsv() {
  let rows, name;
  if (state.view === 'parts') {
    const d = filteredParts();
    rows = [['article_no', 'brand', 'part_name', 'category', 'make', 'model', 'type', 'oe_numbers', 'price', 'currency', 'stock', 'qty', 'ean']];
    d.forEach(p => rows.push([p.articleNo, p.brand, p.name, p.category, p.make, p.model, p.typeName, p.oe.join(' | '), p.price, p.currency, p.stock, p.qtyAvailable, p.ean]));
    name = 'exportrev_parts.csv';
  } else {
    const d = filteredSalvage();
    rows = [['lot', 'vin', 'year', 'make', 'model', 'type', 'odometer_km', 'damage_primary', 'damage_secondary', 'severity', 'runs_and_drives', 'title', 'location', 'current_bid', 'buy_now', 'currency', 'sale_date']];
    d.forEach(s => rows.push([s.lot, s.vin, s.year, s.make, s.model, s.typeName, s.odometer, s.damagePrimary, s.damageSecondary, s.severity, s.runsAndDrives, s.title, s.location, s.currentBid, s.buyNow || '', s.currency, s.saleDate]));
    name = 'exportrev_salvage.csv';
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = name; a.click();
}

/* ================= RENDER + EVENTS ================= */
function render() {
  const v = { dashboard: vDashboard, how: vHow, parts: vParts, technical: vTechnical, salvage: vSalvage, plans: vPlans, api: vApi, account: vAccount }[state.view];
  $('#page').innerHTML = v();
  bind();
}

function bind() {
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));

  /* parts */
  const f = state.parts;
  if ($('#f-make')) $('#f-make').onchange = e => { f.makeId = e.target.value; f.modelId = ''; f.typeId = ''; f.page = 1; render(); };
  if ($('#f-model')) $('#f-model').onchange = e => { f.modelId = e.target.value; f.typeId = ''; f.page = 1; render(); };
  if ($('#f-type')) $('#f-type').onchange = e => { f.typeId = e.target.value; f.page = 1; render(); };
  if ($('#f-brand')) $('#f-brand').onchange = e => { f.brand = e.target.value; f.page = 1; render(); };
  if ($('#f-q')) $('#f-q').oninput = debounce(e => { f.q = e.target.value; f.page = 1; render(); const i = $('#f-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260);
  if ($('#f-reset')) $('#f-reset').onclick = () => { state.parts = { makeId: '', modelId: '', typeId: '', cat: '', brand: '', q: '', page: 1, per: 12 }; render(); };
  $$('[data-cat]').forEach(c => c.onclick = () => { f.cat = c.dataset.cat; f.page = 1; render(); });
  $$('[data-part]').forEach(r => r.onclick = () => openPart(r.dataset.part));

  /* technical */
  if ($('#t-type')) $('#t-type').onchange = e => { state.tech.typeId = +e.target.value; render(); };
  $$('[data-tab]').forEach(t => t.onclick = () => { state.tech.tab = t.dataset.tab; render(); });

  /* salvage */
  const s = state.salv;
  if ($('#s-country')) $('#s-country').onchange = e => { s.country = e.target.value; s.page = 1; render(); };
  if ($('#s-damage')) $('#s-damage').onchange = e => { s.damage = e.target.value; s.page = 1; render(); };
  if ($('#s-make')) $('#s-make').onchange = e => { s.make = e.target.value; s.page = 1; render(); };
  if ($('#s-runs')) $('#s-runs').onchange = e => { s.runs = e.target.value; s.page = 1; render(); };
  if ($('#s-q')) $('#s-q').oninput = debounce(e => { s.q = e.target.value; s.page = 1; render(); const i = $('#s-q'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 260);
  if ($('#s-reset')) $('#s-reset').onclick = () => { state.salv = { country: '', damage: '', make: '', runs: '', q: '', page: 1, per: 12 }; render(); };
  $$('[data-lot]').forEach(c => c.onclick = () => openLot(c.dataset.lot));

  /* pagers */
  $$('[data-pg]').forEach(b => b.onclick = () => {
    const p = +b.dataset.pg; if (p < 1) return;
    if (state.view === 'parts') state.parts.page = p; else state.salv.page = p;
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* plans */
  $$('[data-plan]').forEach(b => b.onclick = () => { state.plan = b.dataset.plan; renderNav(); render(); });

  /* api */
  $$('[data-mod]').forEach(m => m.onclick = () => { state.api.module = m.dataset.mod; render(); });
  $$('.ep .eh').forEach(h => h.onclick = () => h.parentElement.classList.toggle('open'));

  /* misc */
  if ($('#csv')) $('#csv').onclick = exportCsv;
  if ($('#newkey')) $('#newkey').onclick = () => alert('Key creation is disabled in the preview build.');
}

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* global search in top bar → parts */
$('#gsearch').oninput = debounce(e => {
  const q = e.target.value;
  if (!q) return;
  state.parts.q = q; state.parts.page = 1;
  if (state.view !== 'parts') go('parts'); else render();
}, 320);

$('#scrim').onclick = hideDrawer;
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideDrawer(); });

/* ================= LOGIN ================= */
function signIn() {
  const lg = $('#login');
  lg.classList.add('out');
  $('#shell').hidden = false;
  setTimeout(() => { lg.style.display = 'none'; }, 340);
}
function signOut() {
  const lg = $('#login');
  hideDrawer();
  lg.style.display = '';
  /* let display take effect before removing the fade-out class */
  requestAnimationFrame(() => lg.classList.remove('out'));
  $('#shell').hidden = true;
  state.view = 'dashboard';
  renderNav(); render();
}
$('#loginForm').onsubmit = e => { e.preventDefault(); signIn(); };
$('#lg-plans').onclick = e => { e.preventDefault(); state.view = 'plans'; renderNav(); render(); signIn(); };
$('#avatar').onclick = signOut;

renderNav();
render();
