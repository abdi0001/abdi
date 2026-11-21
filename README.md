# AFAR SPORTS LIVE

Afar Regional Football League — real-time scores, standings, and news.

## Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **Deploy**: Vercel

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project credentials:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Get these from your [Supabase project settings](https://supabase.com/dashboard) → API.

> **Without env vars the app still runs**, showing demo data with a "Connect Supabase" banner.

### 3. Set up the database

In your Supabase project, open the SQL editor and run `supabase/schema.sql`. This creates all tables, the standings view, and RLS policies.

### 4. Bootstrap the admin user

Create a user in Supabase Auth (Dashboard → Authentication → Users), then run `supabase/admin-bootstrap.sql` in the SQL editor with that user's UUID to grant admin role.

### 5. Run the dev server

```bash
npm run dev
```

Open http://localhost:5173

## Production Deploy (Vercel)

1. Push to GitHub and connect the repo in Vercel.
2. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel project settings.
3. Vercel auto-deploys on push.

## Admin Panel

Open the **Admin Panel** button at the bottom-right of the app. Sign in with an admin-role Supabase account to manage matches and publish news articles.

## Project Structure

```
src/
  main.tsx                    # Main app — all UI
  style.css                   # Design (do not edit)
  lib/supabase.ts             # Supabase client + types
  hooks/
    useLiveMatches.ts         # Matches with realtime subscription
    useStandings.ts           # League standings
    useNews.ts                # News articles
    useCompetitions.ts        # Competitions list
    useTeams.ts               # Teams by competition
  components/
    AdminAuthGate.tsx         # Auth wrapper (admin role check)
    AdminMatchManager.tsx     # Match CRUD panel
    AdminNewsManager.tsx      # News publishing panel
supabase/
  schema.sql                  # Full DB schema + RLS
  admin-bootstrap.sql         # Grant admin role
```
