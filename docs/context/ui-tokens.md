# Loadout — Design System & UI Tokens

Reference doc for any agent (or person) building a new page or component for this product. Every future screen should be built from these tokens — don't introduce new colors, fonts, or radii ad hoc; extend this doc first if something genuinely doesn't fit.

---

## 1. Design Philosophy (read this before building anything)

The product is a gym tool, not a generic SaaS dashboard. Every visual choice should trace back to the gym itself — iron, rubber flooring, chalk, hazard-amber signage — not to default AI-generated patterns (cream + serif + terracotta, near-black + acid-green, rounded SaaS cards with soft grey shadows, ALL-CAPS eyebrow labels, arrows on buttons).

Working rules for any new page:
- **Dark by default.** The product is used in gyms under artificial light against dark flooring. Build dark-mode first; light mode is secondary.
- **Amber is spent, not sprinkled.** It marks the one important action or number per view (a CTA, a live timer, a load figure) — not decoration on every element. If more than ~2 things are amber on one screen, that's a signal something is miscategorized.
- **Hard materials, not soft ones.** Minimal border-radius. Square-ish surfaces (iron, steel). Radius only increases slightly on things a hand actually taps (buttons, inputs).
- **No decorative labels.** Don't add an eyebrow/meta line above a heading unless it conveys real information a user needs (e.g., a live status).
- **Numbers over adjectives.** This audience trusts data (reps, load, time, streaks) more than marketing language. Prefer a real number to a vague claim.
- **One motion moment per page**, not hover effects on every card. Motion should answer something the user did, or orchestrate a single load-in — not decorate idly.

---

## 2. Color Tokens

Source of truth is the HSL values (used directly as CSS custom properties). Hex values are given for quick reference in design tools.

### Dark theme (default)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `40 14% 7%` | `#14130F` | Page background |
| `--surface` (card) | `40 12% 10%` | `#1C1A15` | Cards, panels, nav |
| `--surface-2` | `40 10% 13%` | `#24211B` | Nested/elevated surfaces inside a card (e.g. a row inside a card) |
| `--foreground` | `40 22% 94%` | `#F1ECDD` | Primary text ("chalk") |
| `--muted-foreground` | `40 8% 62%` | `#A39D8E` | Secondary text, captions, timestamps |
| `--border` / `--input` | `40 8% 18%` | `#38352E` | Hairline borders, input outlines |
| `--primary` | `38 92% 50%` | `#F59E0B` | The one amber. CTAs, active states, key numbers, focus ring |
| `--primary-foreground` | `30 25% 8%` | `#1B140A` | Text/icons placed on top of amber |
| `--accent` (rust) | `14 55% 48%` | `#BE5737` | Secondary accent — PRs, streak flame, "new max" moments. Used more sparingly than amber |
| `--destructive` | `0 62% 48%` | `#C13A3A` | Errors, delete actions, failed set |
| `--ring` | `38 92% 50%` | `#F59E0B` | Keyboard focus outline (always visible, never suppressed) |

### Light theme (secondary — settings pages, marketing/print contexts)

| Token | HSL | Hex (approx) | Usage |
|---|---|---|---|
| `--background` | `40 20% 97%` | `#FAF7F0` | Page background |
| `--surface` (card) | `40 20% 99%` | `#FDFCFA` | Cards |
| `--foreground` | `30 10% 8%` | `#171310` | Primary text |
| `--muted-foreground` | `30 6% 40%` | `#66605A` | Secondary text |
| `--border` / `--input` | `30 8% 85%` | `#D9D4CB` | Hairlines |
| `--primary` | `38 92% 50%` | `#F59E0B` | Same amber, both themes |
| `--accent` | `14 55% 42%` | `#A84C31` | Slightly deepened for contrast on light bg |

### Color rules
- **Never introduce a second bright/saturated hue.** Amber is the only high-chroma color; rust/accent is muted, not a second bright color.
- Destructive red is only for irreversible or negative actions (delete plan, failed lift) — never used decoratively.
- Don't use pure black (`#000`) or pure white (`#FFF`) anywhere; always the warm off-black/off-white tokens above.

---

## 3. Typography

| Role | Font | Weight(s) | Notes |
|---|---|---|---|
| Display / headings | `Big Shoulders Display` | 600–800 | Condensed, industrial-signage feel. Headlines, section titles, big numbers (stats, load figures, timer). Never used for body copy. |
| Body / UI text | `Inter` | 400–700 | All paragraph text, labels, buttons, inputs, nav. |

```css
--font-display: 'Big Shoulders Display', sans-serif;
--font-sans: 'Inter', sans-serif;
```

### Type scale

| Token | Size | Line-height | Font | Use |
|---|---|---|---|---|
| `display-xl` | 64–72px | 0.95 | display | Landing hero only |
| `display-lg` | 40–48px | 1.0 | display | Page/section headings |
| `display-md` | 24–28px | 1.05 | display | Card titles, stat labels |
| `display-sm` | 18–20px | 1.1 | display | Small emphasized numbers (e.g. set count) |
| `body-lg` | 17–18px | 1.6 | sans | Lead paragraphs |
| `body` | 14–15px | 1.55 | sans | Default UI/body text |
| `body-sm` | 13px | 1.5 | sans | Captions, timestamps, helper text |
| `label` | 12–13px | 1.4 | sans, 500 weight | Form labels, table headers (sentence case, never tracked-out caps) |

**Rule**: don't use all-caps + letter-spacing for labels — this is a generic AI-page tell. Sentence case, muted color, and size do the job of a label without needing capitalization.

---

## 4. Spacing Scale

Use a consistent 4px base scale — don't invent one-off pixel values.

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |
| `space-20` | 80px |

Section vertical padding (marketing pages): 80–120px. Card internal padding: 20–24px. Form field vertical rhythm: 16px between fields.

---

## 5. Radius

| Token | Value | Use |
|---|---|---|
| `--radius` | `6px` (`0.375rem`) | Base — cards, panels, modals |
| `radius-sm` | `4px` | Nested/inner elements (rows inside a card) |
| `radius-full` | `9999px` | Pills, badges, avatar, toggle switches only |

Never use large radius (16px+) on cards or panels — that reads as a soft consumer app, not this product. Pills/badges are the one place fully-rounded is correct.

---

## 6. Elevation & Borders

This product uses **borders, not soft shadows**, to separate surfaces — consistent with the "hard materials" principle.

- Default surface separation: `1px solid hsl(var(--border))`.
- Reserve shadow for genuinely floating elements only (modals, dropdowns, the hero demo panel): `0 30px 60px -20px hsla(0,0%,0%,0.6)` — large, soft, low-opacity, never the generic tight `rgba(0,0,0,.1)` card shadow.
- Don't add a shadow to every card by default.

---

## 7. Motion

- Page load: **one** orchestrated reveal max (e.g. the hero demo card animating in), not staggered fade-ups on every section.
- Interactive feedback (button press, card expand, timer tick) is fine and expected — it's earned by a user action.
- Standard easing: `ease` or `cubic-bezier(0.4, 0, 0.2, 1)`, durations 150–300ms for UI feedback, 400–600ms for a hero reveal.
- Respect `prefers-reduced-motion`: disable non-essential animation when set.

---

## 8. Core Components

| Component | Notes |
|---|---|
| **Button — primary** | `background: primary`, `color: primary-foreground`, `radius: 6px`, `padding: 10-14px x 20-26px`, weight 600. Hover: darken amber ~5%. No arrow glyph appended to label text. |
| **Button — ghost** | Transparent bg, `1px solid border`, `color: foreground`. Hover: border lightens to `muted-foreground`. |
| **Card** | `background: surface`, `1px solid border`, `radius: 6px`, `padding: 20-24px`. Inner rows separated by `1px solid border` (top-only, no border on first row) rather than nested cards. |
| **Pill / badge** | `radius-full`, `12px` text, `border: 1px solid border`, `color: muted-foreground`. "Active" state: `background: primary`, `color: primary-foreground`, no border. |
| **Input** | `background: surface-2`, `1px solid input`, `radius: 4-6px`, `padding: 10-12px`. Focus: `ring` token as `2px` outline, border becomes `primary`. |
| **Timer / ring displays** | Use the amber-on-border ring pattern established on the landing page (`border` base, `primary` for progress arc). Numbers always in display font. |
| **Chart bars** | Default bars in `surface-2`; only the most recent/relevant bar(s) in `primary` to draw the eye — don't color every bar. |

---

## 9. Layout & Breakpoints

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column everywhere. Session/timer screens are mobile-first — this is the primary use case for that page. |
| Tablet | 640–900px | Sidebar (Planner page) collapses to a top bar or drawer. |
| Desktop | > 900px | Full layouts as specified in the pages doc (sidebar + thread, multi-column showcase grids, etc.) |

Content max-width: **1180px**, centered, `32px` horizontal padding on the wrapping container (matches the landing page `.wrap`).

---

## 10. Content & Voice

- Active voice, plain verbs: "Start session," not "Begin your workout journey."
- Name things the way a lifter would say them out loud: "sets," "load," "rest" — not "iterations," "intensity units."
- Buttons and the toast/confirmation that follows use the same verb: a button that says "Save plan" is followed by a message that says "Plan saved," not "Changes submitted."
- Empty states give a next action, not just an absence: "No plans yet — describe a goal to generate your first one," not "You have no plans."
- No filler adjectives ("amazing," "seamless," "powerful") — let the number or the interface demonstrate the value.

---

## 11. Checklist for Building a New Page

Before shipping a new page, confirm:

- [ ] Uses only tokens from this doc (no new hex values, fonts, or radii introduced)
- [ ] Dark theme is the default rendering
- [ ] Amber appears on at most 1–2 elements in the primary viewport
- [ ] Headings use the display font; body text never does
- [ ] No ALL-CAPS tracked-out labels
- [ ] Borders (not shadows) separate surfaces, except genuinely floating elements
- [ ] Radius is small/square throughout except pills and interactive controls
- [ ] Motion is a single orchestrated moment, not per-card hover/fade defaults
- [ ] Copy uses plain, active-voice, gym vocabulary
- [ ] Responsive down to mobile; keyboard focus visible (amber ring); reduced-motion respected