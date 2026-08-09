# ExportRev — Automotive Data Portal (preview build)

A working front-end preview of the ExportRev subscription portal: three automotive
data modules behind a plan-gated, metered API layer.

**Live preview:** https://anirudhatalmale6-alt.github.io/exportrev-data-portal/

> All data in this build is **synthetic sample data** generated locally. It is
> structured to mirror the shape of real automotive data feeds so that connecting
> a live provider is a data-source change, not a rebuild. No provider data is
> included, reproduced or implied.

---

## What the preview shows

| Module | Contents |
| --- | --- |
| **Parts Catalogue** | Manufacturer → model → engine/type selector, articles with brand, article number, OE references, cross-references, technical criteria, EAN, stock, lead time and trade price |
| **Technical Data** | Service schedules, standard repair (labour) times, torque specifications with angle stages, fluid capacities, bulb types |
| **Damaged Vehicles** | Salvage/accident lots: primary & secondary damage, severity, title status, runs-and-drives, keys, airbags, location, current bid, buy-now, sale date |

Plus:

* **Sign-in screen** — product-style login with the value proposition on the left.
  Any credentials sign you in (preview build); the avatar top-right signs out again,
  so the demo can be restarted cleanly in front of an audience.
* **How it works** — a one-page explanation of the four layers (provider feeds →
  middleware → plan gating & metering → customer) with the request path broken
  down. Safe to leave on screen while you talk.

And the commercial layer:

* **Plans & Billing** — three tiers (Starter / Professional / Enterprise) with
  per-tier module access, call quota, seat count and rate limit. Switching plan in
  the preview locks and unlocks modules live, so you can see the portal from each
  customer's side.
* **API Reference** — endpoint list per module with example JSON responses.
* **Account & Keys** — API keys (live/test), usage against quota, per-endpoint
  breakdown, invoices.

## Architecture this preview is built against

```
   Customer app / browser
            │  Bearer exr_live_…
            ▼
   ┌─────────────────────────┐
   │  ExportRev middleware   │   ← holds the upstream provider credentials
   │  • auth + plan gating   │   ← enforces module access per subscription
   │  • rate limit / quota   │   ← 5 / 25 / 100 req/s by tier
   │  • usage metering       │   ← one record per request → billing
   │  • response cache       │
   └───────────┬─────────────┘
               │
     ┌─────────┴──────────┬──────────────────┐
     ▼                    ▼                  ▼
  Parts data          Technical data     Salvage feed
  provider            provider           provider(s)
```

The middleware is the important piece commercially: customers never hold upstream
credentials, every request is attributable to a subscription, and usage can be
metered and billed per tier. That is what makes the data resellable as a
subscription product rather than a flat pass-through.

## Stack

Static build — no dependencies, no build step.

```
index.html
css/style.css
js/data.js    ← sample dataset + generators
js/app.js     ← views, filtering, drawers, CSV export
```

Run locally:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Next phase (production build)

1. Replace `js/data.js` with live calls to the middleware.
2. Middleware: Node/Fastify or Laravel, Postgres for accounts/usage, Redis cache.
3. Stripe (or Paddle) subscriptions → plan record drives module gating.
4. Nightly/near-real-time sync jobs per provider feed.
5. HubSpot sync so reps see what a lead searched for.
