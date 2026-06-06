# Sentio — Mental Wellness Tracker

Daily mood check-ins for Indian students preparing for competitive exams (JEE, NEET, CUET, CAT, GATE, UPSC, board exams).

## Stack

- **Next.js 14** (App Router, Edge Runtime) + Tailwind (Linear dark design system)
- **Supabase** — auth, Postgres, RLS
- **Google Gemini** — journal reflections, weekly insights & chat
- **Cloudflare Pages** — deployment via `@cloudflare/next-on-pages`

## Local development

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional locally — instant signup without confirmation emails |
| `GEMINI_API_KEY` | Google AI API key |
| `GEMINI_MODEL` | Gemini model (default `gemini-flash-latest`) |

### Auth email rate limits

1. **Recommended:** Add `SUPABASE_SERVICE_ROLE_KEY` — signup skips confirmation emails.
2. **Alternative:** Supabase Dashboard → Authentication → Email → disable **Confirm email**.

## Cloudflare Pages deployment

All API routes use the **Edge Runtime** (required for Cloudflare Workers). Gemini calls use `fetch` only — no Node.js `fs` at runtime.

### Option A — CLI deploy

```bash
npm run pages:build
npm run pages:deploy
```

First time: `npx wrangler login` if not authenticated.

### Option B — Git-connected Pages project

In [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Connect to Git:

| Setting | Value |
|---|---|
| Build command | `npm run pages:build` |
| Build output directory | `.vercel/output/static` |
| Node.js version | `20` |

**Functions → Compatibility flags:** add `nodejs_compat` for Production and Preview.

**Environment variables** (Production + Preview):

| Variable | Encrypted? |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `GEMINI_API_KEY` | Yes |
| `GEMINI_MODEL` | No (`gemini-flash-latest`) |

Redeploy after adding secrets.

### Local Cloudflare preview

Test the production Workers bundle locally:

```bash
cp .dev.vars.example .dev.vars   # fill in secrets
npm run pages:preview
```

Uses `wrangler pages dev` with the built `.vercel/output/static` output.

## Features

| Screen | Route |
|---|---|
| Login / Sign up | `/login` |
| Onboarding | `/onboarding` |
| Dashboard | `/dashboard` |
| Daily check-in | `/checkin` |
| Journal | `/journal`, `/journal/[date]` |
| Insights + AI chat | `/insights`, `/insights/chat` |
| Coping toolkit | `/toolkit/[toolId]` |
| Settings | `/settings` |

## Database

Schema on Supabase: `profiles`, `mood_checkins`, `wellness_insights`, `coping_sessions`, plus auto-profile trigger on signup.
