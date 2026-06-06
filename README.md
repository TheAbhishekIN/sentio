# Sentio — Mental Wellness Tracker

Daily mood check-ins for Indian students preparing for competitive exams (JEE, NEET, CUET, CAT, GATE, UPSC, board exams).

## Stack

- **Next.js 14** (App Router) + Tailwind (Linear dark design system)
- **Supabase** — auth, Postgres, RLS
- **Google Gemini** — journal reflections & weekly insights
- **Cloudflare Pages** — deployment via `@cloudflare/next-on-pages`

## Setup

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local   # or use existing .env.local
npm run dev
```

### Fix auth email rate limits

Supabase free tier limits confirmation emails (~4/hour). To avoid signup/login issues:

1. **Recommended:** Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (Supabase Dashboard → Settings → API → `service_role`). Signup uses the admin API and **never sends confirmation emails**.
2. **Alternative:** Supabase Dashboard → **Authentication → Providers → Email** → turn off **Confirm email**.

Existing accounts stuck unconfirmed were auto-confirmed in the database.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional — required for account deletion |
| `GEMINI_API_KEY` | Google AI API key (`X-goog-api-key`) |
| `GEMINI_MODEL` | Gemini model (default `gemini-flash-latest`) |

## Features

| Screen | Route | Status |
|---|---|---|
| Login / Sign up | `/login` | ✅ |
| Onboarding (5 slides) | `/onboarding` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Daily check-in wizard | `/checkin` | ✅ |
| Journal list + entry | `/journal`, `/journal/[date]` | ✅ |
| Insights + burnout | `/insights` | ✅ |
| Coping toolkit (8 tools) | `/toolkit/[toolId]` | ✅ |
| Settings | `/settings` | ✅ |

## Deploy (Cloudflare Pages)

```bash
npm run pages:build
npm run pages:deploy
```

Set all env vars in the Cloudflare Pages dashboard (encrypt secrets).

## Database

Schema applied via Supabase migrations: `profiles`, `mood_checkins`, `wellness_insights`, `coping_sessions`, plus auto-profile trigger on signup.
