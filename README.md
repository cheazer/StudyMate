# StudyMate — hackathon scaffold

AI study companion for the GDG "Build with Gemma" hackathon. Next.js 16
(App Router) + TypeScript + Tailwind, Supabase for auth/DB/storage, Gemma 4
for roadmap/notes/flashcard/MCQ generation.

Verified with `npm install && npm run build && npm run lint` on Next 16.2 /
React 19.2 — if you're starting from a different base, these are the
versions that are known to work together as of this scaffold.

## What's here

```
app/
  page.tsx                redirects to /onboarding for now
  onboarding/page.tsx      5-question onboarding flow -> POST /api/profile
  dashboard/page.tsx       home screen: streak, week hours, nudge, topics
  api/profile/route.ts     saves onboarding answers
  api/roadmap/route.ts     calls Gemma -> structured roadmap JSON
  api/study-pack/route.ts  calls Gemma -> notes + flashcards + MCQs
components/                StreakStrip, WeekHoursChart, NudgeBanner, TopicCard, BottomNav
lib/
  types.ts                the shared data contract — read this first
  gemma.ts                Gemma API wrapper (structured JSON output)
  supabase.ts             browser + server Supabase clients
supabase/schema.sql        the 6 core tables, run this in the Supabase SQL editor
```

Dashboard and onboarding currently run on mock data / stub inserts — the
shapes match `lib/types.ts` so wiring in real data shouldn't require touching
the components.

## Local setup

1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in its SQL editor
3. Get a Gemma API key from Google AI Studio
4. `cp .env.local.example .env.local` and fill in the four values
5. `npm run dev` — app runs at http://localhost:3000

## Pushing this to your own GitHub repo

This folder is already a git repo with an initial commit. Create an empty
repo on GitHub (don't initialize it with a README), then:

```
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

## Task split

**You (Gemma / data layer)**
- `lib/gemma.ts` — prompts + structured output for roadmap and study pack
- `app/api/*` — wiring Gemma output into Supabase
- `supabase/schema.sql` — keep in sync with `lib/types.ts`
- Difficulty-adjustment logic (attempts -> next roadmap pacing)

**Teammate (UI)**
- `app/dashboard/page.tsx`, `app/onboarding/page.tsx`, `components/*`
- Replace the `MOCK` object in the dashboard with a real fetch once your API
  routes return data in the same shape
- Roadmap chat UI, study pack tabs (notes/flashcards/quiz) — not yet
  scaffolded, follow the same pattern as `app/dashboard`

**Together**
- Lock any changes to `lib/types.ts` before either of you build against it
- Integration pass once both sides are working against real data
