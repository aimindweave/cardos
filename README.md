<p align="center">
  <img src="https://img.shields.io/badge/GTC_2026-Ready-76b900?style=for-the-badge&labelColor=0d1520" />
  <img src="https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000?style=for-the-badge&logo=vercel" />
</p>

<h1 align="center">
  CardOS
</h1>

<p align="center">
  <strong>AI-native digital business card for tech events</strong><br/>
  Create → Share → Exchange — in 60 seconds
</p>

<p align="center">
  <a href="https://cardos.ai">🌐 cardos.ai</a> · 
  <a href="https://cardos.ai/create">🚀 Create Your Card</a> · 
  <a href="https://cardos.ai/shaylasun">👤 Demo Card</a> · 
  <a href="https://cardos.ai/demo.html">📊 Product Demo</a>
</p>

---

## The Problem

At tech conferences like GTC, you meet 50+ people a day. Paper cards get lost. LinkedIn requests pile up. You forget who was who by the next morning — and miss out on real connections and BD opportunities.

## The Solution

**CardOS** is an interactive digital business card that shows *who you really are* — not just a name and title, but your companies, side projects, AI stack, and philosophy. Share via QR code, exchange contacts automatically, get notified instantly.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| **60s to create** | No signup, no download. Fill a form → publish → live. |
| **Two-way exchange** | They get your vCard (auto-opens iOS Contacts). You get their info + email notification. |
| **Show what you build** | Companies, projects, AI tools, philosophy — not just a name card. |
| **QR code sharing** | Generate a saveable QR card with your avatar. Scannable at any event. |
| **PIN-based editing** | 4-digit PIN to edit your card from any device. Zero friction. |
| **Email notifications** | Get notified via email the moment someone exchanges contact with you. |
| **Mobile-first** | Designed for hallway conversations. Works in any browser. |

---

## How It Works

```
1. Create your card     →  cardos.ai/create (60 seconds, no signup)
2. Get your QR code     →  Save to photos, show at events
3. Someone scans it     →  They see your full interactive card
4. They tap "Exchange"  →  They get your vCard, you get their info
5. You get notified     →  Email with their name, company, note
6. Follow up            →  Export all contacts as CSV
```

---

## Live Demo

🔗 **[cardos.ai/shaylasun](https://cardos.ai/shaylasun)** — Shayla Sun, CFO @ Clapper

What you'll see:
- Interactive card with social links, companies, projects
- AI Stack section (Claude, Cursor, v0, Midjourney...)
- "Exchange Contact" flow with vCard download
- GTC 2026 event badge
- Particle animation background

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | **Next.js 14** (App Router) | SSR for SEO + Open Graph previews |
| Styling | **Tailwind CSS** | Rapid development |
| Backend | **Supabase** | Auth + PostgreSQL + Row Level Security |
| Hosting | **Vercel** | Native Next.js integration, auto CI/CD |
| Domain | **cardos.ai** | Cloudflare DNS |
| QR Code | **qr.js** | Local SVG rendering, zero network dependency |
| vCard | **Server API** | `/api/vcard/{slug}` — iOS Safari compatible |
| Email | **Resend** | Exchange notifications from `noreply@cardos.ai` |

---

## Project Structure

```
cardos/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── create/page.tsx          # 6-step card creator
│   ├── edit/[slug]/page.tsx     # Edit card (PIN-protected)
│   ├── admin/page.tsx           # Admin dashboard
│   ├── s/[slug]/page.tsx        # Public card page (SSR)
│   └── api/
│       ├── exchange/route.ts    # POST: receive exchange + send email
│       ├── vcard/[slug]/route.ts # GET: generate .vcf file
│       ├── profile/[slug]/route.ts # PUT: update profile
│       └── verify-pin/[slug]/route.ts # POST: verify PIN
├── components/
│   ├── CardView.tsx             # Card UI (432 lines)
│   ├── Icons.tsx                # 21 platform icons
│   └── QRCode.tsx               # QR generator (qr.js + SVG)
├── lib/
│   ├── supabase-browser.ts      # Browser client
│   ├── supabase-server.ts       # Server client
│   ├── schema.sql               # Database schema
│   └── types.ts                 # TypeScript types
└── public/
    └── demo.html                # Interactive product demo (6 slides)
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/aimindweave/cardos.git
cd cardos

# Install
npm install

# Configure
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key

# Run
npm run dev
# → http://localhost:3000

# Deploy
npx vercel --prod
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `lib/schema.sql` in SQL Editor
3. Enable Email Auth
4. Copy Project URL + anon key to `.env.local`

---

## Clean URLs

CardOS uses Next.js rewrites for clean card URLs:

```
cardos.ai/shaylasun     →  renders /s/shaylasun (no /s/ prefix needed)
cardos.ai/s/shaylasun   →  still works (backward compatible)
cardos.ai/create        →  card creator
cardos.ai/edit/shaylasun →  edit with PIN
```

---

## Database Schema

Three tables with Row Level Security:

- **`profiles`** — Card data (name, title, links, companies, builds, AI stack, philosophy, event, PIN, edit_token)
- **`exchanges`** — Contact submissions from visitors (name, email, company, note)
- **`views`** — Anonymous view tracking

See [`lib/schema.sql`](lib/schema.sql) for full schema.

---

## Built for GTC 2026

CardOS was built in ~2 days specifically for NVIDIA GTC 2026. The viral loop is built-in:

1. You show your card at GTC → someone scans your QR
2. They exchange contact → they see "Create Your Card — Free"
3. They create their own card → show it to the next person
4. Repeat 🔄

Every exchange email also includes a "Create your own CardOS" CTA.

---

## Roadmap

- [ ] Auth flow (magic link / password)
- [ ] Dashboard for managing exchanges
- [ ] AI-powered follow-up email drafts
- [ ] Analytics (scan count, conversion rate, heatmap)
- [ ] Team edition (company-managed cards)
- [ ] NFC integration
- [ ] Custom themes

---

## License

MIT

---

<p align="center">
  <strong>Try it now → <a href="https://cardos.ai/create">cardos.ai/create</a></strong><br/>
  <sub>Built with ❤️ and way too much Claude</sub>
</p>
