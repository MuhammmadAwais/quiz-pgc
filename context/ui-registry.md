# UI Registry

Living document for **PGC Arena**. Updated after every UI component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:
1. Check if a similar component already exists here.
2. If yes — match its exact classes and tokens.
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here.

After building any component — run `/imprint` to record the component name, file path, and exact classes used.

---

## Components

| Component | Path | Key Tokens & Classes | Purpose |
|---|---|---|---|
| `Navbar` | `components/layout/Navbar.tsx` | `bg-surface-obsidian/90 backdrop-blur-md border-b border-border-subtle px-6 py-3.5` | Top global navigation bar with integrated theme toggle |
| `ThemeToggle` | `components/theme/ThemeToggle.tsx` | `bg-surface-carbon border border-border-medium rounded-xl p-2 text-text-muted-slate hover:text-optic-white shadow-sm` | Dual-theme switcher with sun/moon icon transition |
| `Button` | `components/ui/Button.tsx` | `font-sans font-semibold rounded-md transition-all active:scale-[0.98]` | Reusable button (`team-a`, `team-b`, `console`, `danger`, `ghost`) |
| `Card` | `components/ui/Card.tsx` | `bg-surface-carbon border border-border-subtle shadow-sm rounded-lg p-6` | Standard structural container |
| `Badge` | `components/ui/Badge.tsx` | `label-caps px-2.5 py-0.5 rounded border border-border-subtle` | Plus Jakarta Sans telemetry & status chips |
| `Input` | `components/ui/Input.tsx` | `bg-surface-obsidian border border-border-medium text-optic-white rounded-md px-4 py-2.5 focus:border-team-a-core` | Form text fields |
| `Modal` | `components/ui/Modal.tsx` | `bg-surface-carbon border border-border-medium rounded-xl shadow-2xl p-6 animate-fade-in` | Telemetry dialog container |
| `TeamPodium` | `components/live-match/TeamPodium.tsx` | `score-display label-caps bg-surface-carbon border-2 border-team-a-core shadow-md rounded-xl p-6` | Stage score displays |
| `OptionCard` | `components/live-match/OptionCard.tsx` | `text-body-xl bg-surface-carbon border border-border-subtle hover:border-border-medium rounded-xl p-5 cursor-pointer` | Live MCQ option choice |
| `StageHeader` | `components/live-match/StageHeader.tsx` | `border-b border-border-subtle pb-6 px-10` | Active subject, round, and turn display |
| `MysteryBoxGrid` | `components/live-match/MysteryBoxGrid.tsx` | `border-2 bg-surface-carbon hover:border-border-bright rounded-xl h-36` | Sudden-death mystery boxes |
| `WinnerCelebration` | `components/live-match/WinnerCelebration.tsx` | `bg-surface-carbon border border-border-medium rounded-2xl shadow-2xl p-8 md:p-12` | Grand victory podium with confetti VFX |
| `BooksBankPage` | `app/books-bank/page.tsx` | `bg-surface-obsidian text-optic-white border-border-subtle rounded-2xl p-5 hover:border-team-b-cyan/50` | Digital textbook repository page |
| `AiStudioModal` | `components/studio/AiStudioModal.tsx` | `bg-surface-carbon border-border-medium rounded-2xl shadow-2xl max-w-5xl` | AI question generator studio modal |
| `RapidReviewDeck` | `components/studio/RapidReviewDeck.tsx` | `bg-surface-onyx border-border-subtle rounded-2xl p-4 gap-5` | High-speed plain-English question review surface |
| `ReviewCard` | `components/studio/ReviewCard.tsx` | `bg-surface-carbon border-border-medium rounded-2xl p-6 2x2 grid` | Single question inspection card with LaTeX math |
| `MetricCardSkeleton` | `components/ui/Skeleton.tsx` | `bg-surface-carbon border-border-subtle rounded-xl p-5 skeleton-shimmer` | Telemetry metric loader |
| `QuestionCardSkeleton` | `components/ui/Skeleton.tsx` | `bg-surface-carbon border-border-subtle rounded-xl p-4 skeleton-shimmer` | MCQ card placeholder with 2x2 option grid |
| `BookCardSkeleton` | `components/ui/Skeleton.tsx` | `bg-surface-carbon border-border-subtle rounded-2xl p-5 skeleton-shimmer` | Textbook shelf placeholder |
| `SubjectRowSkeleton` | `components/ui/Skeleton.tsx` | `bg-surface-onyx/60 border-border-subtle/50 rounded-xl p-3.5 skeleton-shimmer` | List/row item placeholder |
| `Skeleton` | `components/ui/Skeleton.tsx` | `bg-surface-interactive/60 rounded-md skeleton-shimmer relative overflow-hidden` | Atomic shimmer loader primitive |

---

### Skeleton
File: `components/ui/Skeleton.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-white/5`, `bg-surface-interactive/60` (substrate) |
| Border | `border-white/5` (inner dividers), `border-border-subtle` (card boundaries) |
| Border radius | `rounded-md` (atomic blocks), `rounded-xl` (rows/cards), `rounded-2xl` (book cards), `rounded-full` (pills/badges) |
| Text — primary | None (geometric silhouette blocks) |
| Text — secondary | None |
| Spacing | Contextual; cards use `p-4` to `p-5`, inner options use `gap-2` to `gap-2.5` |
| Hover state | None (non-interactive loading state) |
| Shadow | `shadow-sm` |
| Shimmer effect | `skeleton-shimmer` (`@keyframes skeleton-shimmer` moving specular gradient `rgba(255,255,255,0.03)` to `0.08`) |

**Pattern notes:**
The universal loading primitive for PGC Arena. Never use spinners or plain colored text for data fetching or page routing. Every view that takes even 1 second to load uses these structured, high-candela geometric silhouettes to maintain layout geometry and eliminate Cumulative Layout Shift (CLS). Integrated at both the Next.js App Router boundary level (`loading.tsx`) and client component state level (`isLoading && !isLoaded`).

---

### BooksBankPage
File: `app/books-bank/page.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-obsidian` (page), `bg-surface-onyx` (top bar), `bg-surface-carbon` (cards) |
| Border | `border-border-subtle`, `border-white/10`, `border-team-b-cyan/50` (hover) |
| Border radius | `rounded-2xl` (book cards), `rounded-xl` (inputs/buttons), `rounded-full` (tag pills) |
| Text — primary | `text-optic-white` |
| Text — secondary | `text-text-muted-slate`, `text-text-bright-slate` |
| Spacing | `p-4 sm:p-6` (page), `p-5` (cards), `gap-5` (shelf grid) |
| Hover state | `hover:border-team-b-cyan/50 hover:scale-[1.02]` |
| Shadow | `shadow-lg`, `shadow-team-b-cyan/20` |
| Accent usage | `text-team-b-cyan`, `bg-team-b-cyan` |

**Pattern notes:**
Dedicated repository view for curriculum textbooks. Uses 3-column responsive grid with tag filter pills, file metadata badges, direct PDF proxy preview link, and an Edit Modal (`Edit2` button) allowing operators to update textbook title and add/remove subject tags with quick-add pills.

---

### RapidReviewDeck
File: `components/studio/RapidReviewDeck.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-onyx` (top banner & quick action controls) |
| Border | `border-white/10`, `border-state-warning-rose/30`, `border-state-success/40` |
| Border radius | `rounded-2xl` (banner & cards), `rounded-xl` (buttons) |
| Text — primary | `text-optic-white` |
| Text — secondary | `text-text-muted-slate`, `text-text-bright-slate` |
| Spacing | `p-4` (banner), `space-y-4` (vertical rhythm), `pb-24` (clearance for sticky footer) |
| Hover state | `hover:scale-[1.02]`, `hover:bg-state-success/90`, `hover:bg-state-warning-rose/25` |
| Accent usage | `bg-state-success/20` (Accept All), `bg-surface-interactive` (Reject All), `bg-team-b-cyan` |

**Pattern notes:**
Designed for non-technical users and teachers. All action buttons standardized to `h-9` height with clear, centered icons. Bulk actions grouped in an inline flex cluster (`Accept All`, `Reject All`) to eliminate awkward wrapping. Includes `pb-24` clearance to ensure card navigation controls are never obscured by the sticky footer.

---

### ReviewCard
File: `components/studio/ReviewCard.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-carbon` (card), `bg-surface-onyx` (options), `bg-state-success/15` (correct option) |
| Border | `border-border-medium` (card), `border-white/10` (option), `border-state-success/50 ring-1 ring-state-success/30` (correct option) |
| Border radius | `rounded-2xl` (card), `rounded-xl` (option tiles) |
| Text — primary | `text-optic-white` |
| Text — secondary | `text-text-muted-slate`, `text-text-bright-slate` |
| Spacing | `p-5 sm:p-6` (card padding), `gap-2.5` (2x2 landscape option grid) |
| Hover state | `hover:text-team-b-cyan` |
| Accent usage | `text-state-success` (correct check), `text-state-warning-rose` (quality notice alert) |

**Pattern notes:**
2x2 landscape option layout for maximum vertical density. Includes integrated KaTeX math rendering and automated quality check notice alert.

---

### StudioStickyFooter
File: `components/studio/StudioStickyFooter.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-onyx/95 backdrop-blur-xl` |
| Border | `border-t border-white/10` |
| Border radius | `rounded-xl` (all controls uniform) |
| Text — primary | `text-optic-white`, `text-state-success` (accepted count), `text-state-warning-rose` (rejected count) |
| Text — secondary | `text-text-muted-slate` |
| Spacing | `p-4 mt-6`, `gap-4` |
| Hover state | `hover:scale-[1.01]`, `hover:bg-team-b-cyan/90` |
| Shadow | `shadow-2xl`, `shadow-team-b-cyan/20` |
| Accent usage | `bg-team-b-cyan` (Save Accepted to Question Bank CTA) |

### InputWithToggle
File: `components/ui/Input.tsx`, `app/page.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-obsidian` (input field), `bg-surface-carbon` (card wrapper) |
| Border | `border-white/20`, `focus:border-team-a-core`, `focus:ring-1 focus:ring-team-a-core/40` |
| Border radius | `rounded-md` |
| Text | `text-optic-white`, placeholder `text-text-muted-slate`, font `font-mono text-xs` |
| Right element | `absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10 pr-11` (input padding) |
| Action toggle | `text-text-muted-slate hover:text-optic-white transition-colors p-1` (`Eye` / `EyeOff`) |

**Pattern notes:**
Standardizes inline action buttons inside text fields without layout disruption. Used for master password preview in the login console.

---

### PaginationBar
File: `app/question-bank/page.tsx`, `app/books-bank/page.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-onyx` (inactive pills), `bg-team-a-core` / `bg-team-b-cyan` (active pills) |
| Border | `pt-3 border-t border-white/10` (divider) |
| Border radius | `rounded text-xs` (Question Bank), `rounded-lg text-xs` (Books Bank) |
| Text | `font-mono text-xs text-text-muted-slate`, active `text-surface-obsidian font-bold` |
| Spacing | `flex items-center gap-1.5`, `h-7 px-2` / `h-8 px-2.5` (stepper buttons) |
| Hover state | `hover:text-optic-white hover:bg-surface-interactive` |

**Pattern notes:**
Deterministic client-side pagination that caps rendering to 10 MCQs or 6 textbooks per page. Prevents DOM bloat and eliminates KaTeX re-rendering slowdowns on low-end projector hardware.

---

### SubjectPoolTelemetry
File: `app/match-setup/page.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Unselected state | Completely hides bank count (zero text clutter) |
| Sufficient state | `text-[11px] font-mono text-team-b-ice flex items-center gap-1` (`CheckCircle2`) |
| Shortage state | `text-[11px] font-mono text-state-warning-rose flex items-center gap-1` (`AlertCircle`) |

**Pattern notes:**
Removes confusing "0 in bank" telemetry for unselected cards. Pre-validates all subjects from the repository store to provide immediate, precise pool requirement status upon selection.

---

### ThemeToggle
File: `components/theme/ThemeToggle.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-carbon` (card), `bg-surface-interactive` (hover) |
| Border | `border border-border-medium`, `hover:border-team-b-ice/40` |
| Border radius | `rounded-xl` |
| Text / Icon | `text-text-muted-slate hover:text-optic-white` |
| Spacing | `p-2` (compact icon button), `px-3 py-1.5` (extended with text) |
| Hover state | `hover:bg-surface-interactive hover:text-optic-white transition-all` |
| Shadow | `shadow-sm` |
| Icons | `Sun` (shows when in dark mode to switch to light) / `Moon` (shows when in light mode to switch to dark) with subtle rotation animation |

**Pattern notes:**
Provides seamless client-side theme switching between Dark Mode (*Deep Slate & Petroleum Matrix*) and Light Mode (*Indigo Periwinkle High-Contrast*). Synchronizes instantly with `localStorage` (`pgc-arena-theme`) and updates the `.dark` / `.light` class on the `<html>` root element. Supported by an inline `<head>` script in `app/layout.tsx` to eliminate any Flash of Unstyled Content (FOUC). Present in the global Navbar, Login screen, and Live Match stage controls.

---

### Navbar (Responsive)
File: `components/layout/Navbar.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Background | `bg-surface-obsidian/90 backdrop-blur-md` |
| Border | `border-b border-border-subtle` |
| Padding | `px-4 sm:px-6 py-3.5` |
| Desktop nav items | `hidden lg:flex items-center gap-1` — full horizontal list ≥1024px |
| Mobile hamburger | `lg:hidden` button with `Menu`/`X` icon toggle |
| Mobile drawer | `fixed top-[57px] left-0 right-0 z-30 bg-surface-obsidian/97` slide-down panel |
| Active item | `bg-surface-carbon text-team-a-bright border border-border-medium shadow-sm` |
| Inactive item | `text-text-bright-slate hover:text-optic-white hover:bg-surface-onyx` |
| Hover state | `hover:bg-surface-onyx transition-all` |
| Shadow | None (blur handled by backdrop) |

**Pattern notes:**
Hamburger menu replaces full nav at `<lg` breakpoints. Mobile drawer items are `rounded-xl px-4 py-3` (larger touch targets). Closes automatically on navigation. Admin badge hidden on mobile; Logout text hidden below `sm`.

---

### ContestLedger (Responsive)
File: `components/dashboard/ContestLedger.tsx`
Last updated: 2026-09-21

| Property | Class |
|---|---|
| Desktop table | `hidden md:block overflow-x-auto` — only shown ≥768px |
| Mobile cards | `md:hidden space-y-3` — stacked cards on small screens |
| Mobile card container | `p-4 rounded-xl bg-surface-onyx border border-border-subtle space-y-3` |
| Score display | `text-2xl font-bold font-mono text-optic-white tabular-nums` |
| Team A name | `text-xs font-bold text-team-a-bright truncate` |
| Team B name | `text-xs font-bold text-team-b-cyan truncate` |
| Meta row | `text-[11px] font-mono text-text-muted-slate` with `Clock` icon |
| Status | `text-state-success font-bold text-[10px] uppercase font-mono` |

**Pattern notes:**
Two rendering modes based on breakpoint. Below `md`, each contest renders as a score card with team names, scores, winner badge, and question count. Above `md`, the full table with 5 columns is shown. Pagination controls are the same across both views.

