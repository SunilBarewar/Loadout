# AI Workout Planner — Generative UI Product Spec

## 1. Concept

An AI fitness coach used through natural-language chat ("plan me a 4-day push/pull/legs split", "I only have dumbbells and 30 minutes"). Instead of replying with plain text, it responds by **rendering interactive UI components** — workout cards, exercise carousels, progress charts, a rest-timer widget, a weekly calendar — chosen dynamically based on what the conversation needs.

The LLM doesn't generate raw HTML/JSX. It **selects and fills components from a predefined UI registry** using structured tool calls, and the frontend renders the matching component with the returned data.

---

## 2. Tech Stack (recommended)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | Server + client components, easy streaming UI |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, good-looking defaults |
| AI SDK | Vercel AI SDK (`ai` package) | Built-in support for tool calling → generative UI, streaming |
| LLM | Gemini Api | Generating AI response |
| State | Zustand or React Context | Track workout plan, active session, timers |
| DB (optional) | Supabase / SQLite (Prisma) | Persist plans, history, progress |
| Deployment | Vercel | Free, trivial for Next.js |

The system works fully with session-only state; persistence can be added later without changing the core architecture.

---

## 3. Core Architecture: The Generative UI Pattern

This is the heart of the project. The flow looks like:

```
User message
   ↓
LLM (with tool definitions describing each UI component)
   ↓
LLM decides: "this needs a WorkoutPlanCard + ExerciseCarousel"
   ↓
LLM emits structured tool calls with typed props (exercise list, sets/reps, etc.)
   ↓
Frontend Component Registry maps tool name → React component
   ↓
Props validated (zod) → Component rendered inline in chat
   ↓
User interacts with component (mark set complete, swap exercise)
   ↓
Interaction sent back to LLM as new context → conversation continues
```

**Key idea**: each UI component is exposed to the model as a "tool" with a strict schema (via `zod`). The model's job is only to decide *which* component fits and *what data* to put in it — never to generate raw HTML/JSX. This keeps output reliable and renderable.

---

## 4. Component Registry

Aim for **8–10 components** — enough to feel rich, not so many it becomes unmanageable.

| Component | Triggered when | Key props |
|---|---|---|
| `WorkoutPlanCard` | User asks for a full workout/routine | title, day split, exercise list, duration |
| `ExerciseCard` | Single exercise detail requested | name, muscle group, sets/reps, video/gif, form tips |
| `ExerciseCarousel` | Multiple exercise options to browse/swap | array of ExerciseCard data |
| `WeeklyScheduleGrid` | User asks for a weekly plan | 7-day grid with workout type per day |
| `RestTimer` | During a workout session | duration, auto-start, sound toggle |
| `SetTracker` | Logging sets/reps/weight live | exercise name, target sets, input fields |
| `ProgressChart` | User asks about progress/history | metric (weight/volume/streak), time series data |
| `EquipmentPicker` | Onboarding / "what do I have available" | interactive chip/checkbox selector |
| `NutritionTipCard` | Optional light nutrition guidance | macro tip, calorie estimate |
| `WorkoutSummaryCard` | End of session | duration, calories est., exercises completed |

Each has:
- A **zod schema** (single source of truth: validates LLM output + gives TS types for React props)
- A **tool description** the LLM sees (plain-English: when to use it)
- A **React component** in the registry

## 5. Core Features

- Chat interface with streaming responses
- Tool-calling wired to core components (PlanCard, ExerciseCard, Carousel, RestTimer, SetTracker, ScheduleGrid)
- Full workout plan generation from a text prompt (goal, days/week, equipment, experience level)
- Interactive rest timer + live set logging inside the chat (not just static cards)
- Swap-exercise flow: click "swap" on an ExerciseCard → LLM suggests alternatives → carousel appears
- Responsive, polished UI

## 6. Extended Features

- Persist plans + workout history (DB) → ProgressChart with real data
- Auth / multi-user support
- Voice input
- Export plan as PDF/calendar
- Adaptive plans (LLM adjusts next week's plan based on logged performance)
- Nutrition companion mode

---

## 7. Minimal Data Model (if persistence is added)

```
User          { id, name }
WorkoutPlan   { id, userId, title, createdAt, days: Day[] }
Day           { id, planId, dayOfWeek, exercises: Exercise[] }
Exercise      { id, dayId, name, muscleGroup, sets, reps, weightUnit }
SessionLog    { id, userId, exerciseId, date, setsCompleted, weightUsed[] }
```

---

## 8. Suggested Folder Structure

```
/app
  /api/chat/route.ts        ← handles LLM calls + tool definitions
/components
  /ui-registry
    WorkoutPlanCard.tsx
    ExerciseCard.tsx
    ExerciseCarousel.tsx
    RestTimer.tsx
    SetTracker.tsx
    WeeklyScheduleGrid.tsx
    ProgressChart.tsx
    registry.ts              ← maps tool name → component + schema
/lib
  schemas.ts                 ← zod schemas (shared: validation + types)
  tools.ts                   ← tool definitions passed to LLM
  system-prompt.ts
/store
  workout-store.ts           ← zustand store for active session state
```