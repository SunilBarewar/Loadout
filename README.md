# Loadout

An AI gym coach that builds workout programs from natural language, then lets you run those programs on the gym floor.

Tell it something like "plan me a 4-day push/pull/legs split with dumbbells and 45 minutes" and it replies with interactive plan cards — not a wall of markdown. Save a plan, activate it, and Today + live sessions take over from there.

## What it is

Loadout is a full-stack fitness app: an AI planner, a persisted program library, and a session logger. It is built for people who already lift and want a program that matches their gear, schedule, and constraints.

It is not a generic chatbot with workout tips. The model never emits HTML or JSX. It selects tools with typed schemas, the server writes real database rows, and the chat UI renders matching React components from a registry.

## How it works

```
You describe a goal, schedule, or constraint
        ↓
The coach gathers missing facts (goal, days, equipment, time, injuries)
        ↓
It calls a tool with a complete weekly program
        ↓
The server compiles that program into Postgres (plan → version → days → exercises)
        ↓
The chat attaches typed UI parts (plan card, weekly grid, update card)
        ↓
You save the draft, activate it, and start today's session
        ↓
You log sets, skip or swap exercises, pause, and finish
        ↓
History and the Today page read the same stored data
```

### Generative UI

Each chat message is stored as an array of **parts**. A part is a small envelope: `id`, `type`, `schemaVersion`, and validated `data`.

| Part type | What you see |
|---|---|
| `text` | Streaming markdown from the coach |
| `equipment_picker` | Interactive gear selector when equipment is unknown |
| `workout_plan` | Plan summary with save / activate actions |
| `weekly_schedule` | Day-by-day grid of the proposed week |
| `plan_update` | Compact "this revision is live" card after a change |

The model only decides *which* tool to call and *what data* to send. Zod schemas validate the payload. The UI registry maps `type` → React component.

### Planning context

Before a plan can be proposed, the coach fills a small set of slots:

- Training goal (hypertrophy, strength, fat loss, endurance, general fitness)
- Experience level
- Days per week
- Session length
- Available equipment
- Limitations / injuries

Facts come from your profile, the current chat thread, and what you just said. The coach asks at most one focused question cluster per turn. If you say "just pick" or "surprise me", it uses safe defaults instead of interviewing you.

### Coach tools

| Tool | When it runs |
|---|---|
| `save_planning_facts` | You mention a goal, schedule, gear, or limitation |
| `show_equipment_picker` | Equipment is still missing |
| `propose_workout_plan` | Context is complete and no plan is linked yet |
| `revise_workout_plan` | A plan is already linked and you want changes |

Propose and revise persist a full domain program (title, days, exercises, sets, reps, rest). The server assigns IDs. The model is not allowed to invent them.

Draft plans stay drafts until you tap **Save**. Saved and active plans apply revisions immediately and create a new plan version.

### From chat to gym floor

1. **Planner** creates a draft and shows the cards inline.
2. **Save / Activate** promotes that draft. Only one plan can be active.
3. **Today** resolves which plan day is scheduled (or marks a rest day) and shows weekly adherence and volume.
4. **Session** snapshots the day's exercises so later plan edits do not rewrite history mid-workout.
5. **History** lists completed sessions with the sets you actually logged.

## Features

### AI planner

- Streaming chat with persisted threads
- Prompt suggestions (PPL split, hotel circuit, shoulder-safe upper, deload, and similar)
- Equipment picker rendered in chat when gear is unknown
- Full weekly program generation from a sentence
- In-thread revisions ("make it 3 days", "swap bench for dumbbell press")
- Plan cards and weekly grids attached to the reply, not dumped as JSON

### Plans

- Draft → saved → active → archived lifecycle
- Versioned programs with a change summary on each revision
- Days with focus, estimated minutes, weekday assignment, and ordered exercises
- Exercises store muscle group, equipment slug, sets, rep range, rest, optional load and RPE, plus form notes
- Equipment-aware compilation: proposed movements are checked against your catalog

### Today

- Resolves today's session from the active plan and weekday schedule
- Rest-day state when nothing is scheduled
- Start, resume, or jump back into a live session
- Weekly adherence (completed vs planned sessions)
- Weekly volume vs the previous week

### Live sessions

- One-tap set logging (reps, load, notes)
- Mark a set completed, failed, or skipped
- Skip, replace, finish early, or reorder exercises
- Pause, resume, complete, or abandon the workout
- Session-level notes on finish
- Rest intervals stored per exercise; a rest end time is set after a logged set
- Snapshotted exercise data so the log stays accurate after later plan edits

### History and settings

- Paginated workout history with links back into each session
- Preferences: goal, experience, days per week, session length, limitations
- Equipment catalog and weight unit (kg / lb)
- Clerk sign-in and sign-up; app routes require auth

## Tech stack

| Layer | Choice |
|---|---|
| App | Next.js (App Router), React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, dark-first gym tokens |
| AI | Vercel AI SDK, Gemini by default (`gemini-3.5-flash`), optional OpenAI |
| Auth | Clerk |
| Database | Neon Postgres via Drizzle ORM |

The product name in the UI is **LOADOUT.AI**. Design tokens live in `docs/context/ui-tokens.md` — dark surfaces, amber for the one important action, display type for numbers and headings.

## Project layout

```
app/
  (app)/                 Authenticated screens: today, planner, plans, session, history, settings
  (auth)/                Clerk sign-in / sign-up
  api/chat/              Streaming coach endpoint
  api/plans/             Save and activate plan routes
  page.tsx               Public landing page
features/
  ai/                    Coach instructions, planning context, tools
  planner/               Chat threads, prompt UI, history list
  plans/                 Program compile, versioning, scheduling
  sessions/              Live workout mutations and history
  today/                 Home-screen data for the active plan
  settings/              Preferences and equipment
  ui-registry/           Zod schemas + React components for chat parts
db/                      Drizzle schema and client
```

## Getting started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database
- A [Clerk](https://clerk.com) application
- A [Google AI](https://aistudio.google.com/) API key (Gemini). OpenAI is optional.

### Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_URL` | App origin, e.g. `http://localhost:3000` |
| `DATABASE_URL` | Neon connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini key |

To use OpenAI instead of Gemini, set `MODEL_PROVIDER=openai` and provide the matching OpenAI key.

Then migrate, seed the equipment catalog, and start the app:

```bash
npm run db:migrate
npm run db:seed:equipment
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, open **Planner**, and describe a routine.

### Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema without a migration |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed:equipment` | Seed the equipment catalog |
| `npm run db:reset` | Drop/reset, migrate, and reseed (destructive) |

## Typical loop

1. Sign up and set equipment + units (or let the coach ask in chat).
2. In Planner: "4-day hypertrophy split, home gym, 45 minutes, bad left shoulder."
3. Review the plan card and weekly grid. Save, then activate.
4. Open Today and start the session.
5. Log sets as you train. Swap an exercise if a machine is taken.
6. Finish the workout. Check History later, or ask the coach to revise next week's plan.
