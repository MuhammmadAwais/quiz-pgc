# UI Tokens — Dual-Theme Architecture

Design tokens for **PGC Arena** supporting a high-fidelity **Dual-Theme Mode** (Dark Mode: *Deep Slate & Petroleum Matrix* and Light Mode: *Indigo Periwinkle High-Contrast*). Configured with **Tailwind CSS v4** `@theme` tokens mapped to dynamic CSS variables in `app/globals.css`.

---

## Typography Standards

All UI elements uniformly use **Plus Jakarta Sans** with OpenType numerical figures enabled for zero-jitter telemetry and scoreboards:

- **Font Family:** `Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Numerical Telemetry:** OpenType `font-feature-settings: 'cv01' on, 'tnum' on;` for scoreboards, clocks, question counters, and timers.
- **Hierarchy:**
  - Display / Big Scores: `text-4xl` to `text-6xl`, font-extrabold (`700`/`800`)
  - Headings / Section titles: `text-lg` to `text-2xl`, font-bold (`600`/`700`)
  - Body copy & MCQ options: `text-sm` to `text-base`, font-normal / font-medium (`400`/`500`)
  - Telemetry chips & tags: `text-xs` / `text-[11px]`, font-mono / font-bold (`600`)

---

## Dual-Theme Color Palettes

### 1. Dark Mode: "Deep Slate & Petroleum Matrix" (`dark-theme-deisgn.md`)
Engineered for stage auditorium projectors and low-light venue environments. Replaces saturated neon glows with deep petroleum cyan accents, mineral sage borders, and soft charcoal-slate surfaces.

| Token Variable | Hex Value | Semantic Role |
|---|---|---|
| `--color-surface-obsidian` | `#0B141B` | Deep Slate venue stage canvas |
| `--color-surface-onyx` | `#141D23` | Structural bays & toolbar backdrops |
| `--color-surface-carbon` | `#182127` | Elevated question bay & card substrates |
| `--color-surface-interactive` | `#213038` | Hovered wells, chip substrates, active buttons |
| `--color-text-optic-white` | `#DAE4ED` | On-surface high-contrast text, question prompts, scores |
| `--color-text-bright-slate` | `#BAC8D3` | Option descriptions, card body text |
| `--color-text-high-contrast` | `#E1EBF5` | High-emphasis labels and display metrics |
| `--color-text-muted-slate` | `#748D92` | Mineral sage secondary labels and metadata |
| `--color-team-a-core` | `#8B5CF6` | Team A Electric Violet indicator & action |
| `--color-team-b-cyan` | `#124E66` | Petroleum Cyan primary brand accent & Team B |
| `--color-team-b-ice` | `#2E869B` | High-candela ice teal border and badge highlight |
| `--color-state-success` | `#1A6B72` | Deep Emerald Teal for correct answer validation |
| `--color-state-warning-rose`| `#7C3B3F` | Subdued Venetian Wine for errors and misses |
| `--color-border-subtle` | `#213038` | Subtle card dividers and module edges |
| `--color-border-medium` | `#354A54` | Defined perimeter borders |
| `--color-border-bright` | `#748D92` | High-emphasis mineral sage borders |

---

### 2. Light Mode: "Indigo Periwinkle High-Contrast" (`light-theme-design.md`)
Engineered for bright daylight admin office displays and well-lit staging setups. Clean, crisp white cards against a soft periwinkle mist canvas with deep royal indigo typography.

| Token Variable | Hex Value | Semantic Role |
|---|---|---|
| `--color-surface-obsidian` | `#EDE8F5` | Soft Periwinkle Mist page canvas |
| `--color-surface-onyx` | `#F1ECF9` | Structural toolbars and header strips |
| `--color-surface-carbon` | `#FFFFFF` | Crisp pure white cards and elevated dialogs |
| `--color-surface-interactive` | `#E4DEF2` | Interactive hover wells and input backdrops |
| `--color-text-optic-white` | `#1B254B` | Midnight Deep Indigo high-contrast text |
| `--color-text-bright-slate` | `#2D3A6B` | Option body copy and card descriptions |
| `--color-text-high-contrast` | `#0F172A` | Primary heading and score numerals |
| `--color-text-muted-slate` | `#6B7280` | Muted cool slate metadata and secondary labels |
| `--color-team-a-core` | `#6366F1` | Team A Indigo Violet indicator |
| `--color-team-b-cyan` | `#3D52A0` | Royal Indigo primary brand accent & Team B |
| `--color-team-b-ice` | `#7091E6` | Periwinkle secondary highlight and pill active states |
| `--color-state-success` | `#0E7490` | Ocean Cyan for verified correct answers |
| `--color-state-warning-rose`| `#BA1A1A` | Deep Crimson for errors and penalties |
| `--color-border-subtle` | `#C5D2E8` | Periwinkle Mist subtle card dividers |
| `--color-border-medium` | `#ADBBDA` | Defined slate borders |
| `--color-border-bright` | `#7091E6` | Active high-emphasis periwinkle borders |

---

## Anti-AI Slop Invariants

1. **Zero Raw Glowing Shadows:**
   - No `box-shadow: 0 0 36px rgba(...)` or neon halo effects.
   - All component elevations use crisp, tactile drop shadows (`shadow-sm`, `shadow-md`, `shadow-lg`) or subtle 1px border contrast.
2. **Zero Harsh 90% Black Drop Shadows:**
   - Dark mode cards float with mineral borders (`#213038` / `#354A54`) rather than muddy black halos.
   - Light mode cards use soft, diffuse shadows with periwinkle tint (`rgba(27, 37, 75, 0.06)`).
3. **Zero Unprofessional Gradients:**
   - Gradients are limited to smooth subtle telemetry shimmers (`.skeleton-shimmer`) that dynamically adjust between dark and light modes.
   - No multi-stop rainbow gradients or generic template badges.
4. **Zero Hardcoded Hex in Markup:**
   - All components use semantic Tailwind tokens (`bg-surface-obsidian`, `bg-surface-carbon`, `text-optic-white`, `border-border-subtle`, `border-border-medium`, `text-team-a-core`, `text-team-b-cyan`, etc.).
   - Switching between dark and light mode automatically re-skins 100% of UI elements with zero layout shift.
