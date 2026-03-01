# CardOS — AI-native digital business card

## Quick Setup (15 minutes)

### 1. Install Node.js
- Go to https://nodejs.org
- Download **LTS** version, install
- Verify: `node -v` and `npm -v` should show version numbers

### 2. Install dependencies
```bash
cd cardos
npm install
```

### 3. Set up Supabase
1. Go to https://supabase.com → Sign up with GitHub
2. Click "New Project" → Name: `cardos`, Region: `West US`
3. Wait 2 min for project to be ready
4. Go to **SQL Editor** → paste contents of `lib/schema.sql` → Run
5. Go to **Authentication → Settings → Email** → make sure "Enable Email Signup" is ON
6. Go to **Settings → API** → copy:
   - `Project URL` 
   - `anon` `public` key

### 4. Configure environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and paste your Supabase URL and anon key.

### 5. Run locally
```bash
npm run dev
```
Open http://localhost:3000

### 6. Deploy to Vercel
```bash
npx vercel
```
When prompted:
- Link to existing project? **No** → create new
- Project name: `cardos`
- Build settings: accept defaults
- Environment variables: add the same two from `.env.local`

Your site will be live at `cardos.vercel.app`!

## Pages

| URL | What it does |
|-----|-------------|
| `/` | Landing page |
| `/create` | Card creator (multi-step form) |
| `/s/shayla` | Public card page (SSR) |
| `/dashboard` | View your contacts |

## Tech Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (Auth + PostgreSQL + RLS)
- **Vercel** (deployment)
