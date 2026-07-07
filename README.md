# DSA Tracker — Phase 1

Spaced repetition tracker for LeetCode practice. Paste a problem URL, it fetches title/difficulty/topics
from LeetCode automatically, logs the solve, and schedules revisions at +1, +7, and +14 days.

## Status

**Phase 1 (this drop): done, untested end-to-end.**
Schema, CRUD API routes, and a working dashboard (add question, see due revisions, mark them done
with a confidence rating). Written in an environment without internet access, so `npm install` and
`prisma migrate` have not actually been run yet — set aside 10-15 minutes to get it running and
work through anything that breaks.

Not built yet: calendar view, heatmap, topic coverage dashboard, Chrome extension (Phases 2-4).
Their pages exist as placeholders so the nav doesn't 404.

## Setup

1. **Get a free Postgres database.** [Neon](https://neon.tech) or [Supabase](https://supabase.com)
   both work, pick one, create a project, copy the connection string.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set your database URL:**
   ```bash
   cp .env.example .env
   # paste your connection string into .env
   ```

4. **Push the schema and generate the client:**
   ```bash
   npx prisma migrate dev --name init
   ```
   This creates the tables and runs `prisma generate` for you.

5. **Run it:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## How the revision scheduling works

When you paste a URL and hit "mark solved":
1. `lib/leetcode.ts` parses the slug out of the URL and queries LeetCode's public GraphQL
   endpoint for title, difficulty, and topic tags.
2. The `Question` is upserted (so re-solving something you've already logged doesn't duplicate it),
   and its topics are connected or created.
3. A `SolveLog` is created with `firstSolvedAt = now`.
4. Three `Revision` rows are created with due dates at +1, +7, +14 days — this is the whole
   scheduling engine, it's just date math at creation time, no cron job needed.

The dashboard's "due" section queries all `Revision` rows with no `completedAt` and a `dueDate`
that's today or earlier, across every question. Marking one done with a confidence rating (1-5)
sets `completedAt` and `confidence` — that confidence field is what would let you later evolve
this into an adaptive schedule instead of fixed +1/+7/+14 intervals.

## Things worth testing first

- **LeetCode GraphQL fetch**: this hits an unofficial, unauthenticated endpoint. It generally
  works but LeetCode could rate-limit or change its schema without notice. If `POST /api/questions`
  fails, check the error message first — it'll usually tell you if the slug parse or the fetch
  itself failed.
- **Upsert behavior**: re-pasting a URL you've already solved creates a *new* `SolveLog` (and new
  revisions) on the same `Question`, rather than erroring. That's intentional — it models
  resolving a problem from scratch — but worth confirming it's the behavior you actually want.

## Project structure

```
dsa-tracker/
├── app/
│   ├── api/
│   │   ├── questions/route.ts          # GET list, POST create (fetches LC metadata)
│   │   ├── questions/[id]/route.ts     # GET one (full history), DELETE
│   │   ├── revisions/[id]/route.ts     # PATCH mark revision done + confidence
│   │   └── leetcode-meta/route.ts      # preview metadata without saving
│   ├── calendar/page.tsx               # placeholder — Phase 2
│   ├── heatmap/page.tsx                # placeholder — Phase 2
│   ├── topics/page.tsx                 # placeholder — Phase 5
│   └── page.tsx                        # dashboard: add form, due revisions, question list
├── lib/
│   ├── prisma.ts                       # Prisma client singleton
│   ├── leetcode.ts                     # GraphQL metadata fetch
│   └── revisions.ts                    # revision schedule date math
└── prisma/schema.prisma
```

## Next up: Phase 2

Calendar and heatmap views — both are pure read/aggregate queries once you've got real data in
here, no new scheduling logic needed. Solve a handful of problems first so there's something to
visualize, then we'll build those two.

## Phase 3 

Addition of url search with ongoing problem status.
on typing url of a question it automatically verifies and shows up on the screen
