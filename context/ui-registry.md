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
| `Navbar` | `components/layout/Navbar.tsx` | `bg-surface-obsidian/90 backdrop-blur-md border-b border-border-subtle px-6 py-3.5` | Top global navigation bar |
| `Button` | `components/ui/Button.tsx` | `font-sans font-semibold rounded-md transition-all active:scale-[0.98]` | Reusable button (`team-a`, `team-b`, `console`, `danger`, `ghost`) |
| `Card` | `components/ui/Card.tsx` | `bg-surface-carbon border border-border-subtle shadow-obsidian-card rounded-lg p-6` | Standard structural container |
| `Badge` | `components/ui/Badge.tsx` | `label-caps px-2.5 py-0.5 rounded border` | JetBrains Mono telemetry & status chips |
| `Input` | `components/ui/Input.tsx` | `bg-surface-obsidian border border-white/20 text-optic-white rounded-md px-4 py-2.5 focus:border-team-a-core` | Form text fields |
| `Modal` | `components/ui/Modal.tsx` | `bg-surface-carbon border border-border-medium rounded-xl shadow-modal-dialog p-6 animate-fade-in` | Telemetry dialog container |
| `TeamPodium` | `components/live-match/TeamPodium.tsx` | `score-display label-caps bg-surface-carbon border-2 border-team-a-core glow-team-a rounded-xl p-6` | Stage score displays |
| `OptionCard` | `components/live-match/OptionCard.tsx` | `text-body-xl bg-surface-carbon border border-white/10 glow-success glow-miss rounded-xl p-5 cursor-pointer` | Live MCQ option choice |
| `StageHeader` | `components/live-match/StageHeader.tsx` | `border-b border-white/10 pb-6 px-10` | Active subject, round, and turn display |
| `MysteryBoxGrid` | `components/live-match/MysteryBoxGrid.tsx` | `border-2 bg-surface-carbon hover:border-white/40 rounded-xl h-36` | Sudden-death mystery boxes |
| `WinnerCelebration` | `components/live-match/WinnerCelebration.tsx` | `bg-surface-carbon border border-white/20 rounded-2xl shadow-modal-dialog p-8 md:p-12` | Grand victory podium with confetti VFX |
| `BooksBankPage` | `app/books-bank/page.tsx` | `bg-surface-obsidian text-optic-white border-border-subtle rounded-2xl p-5 hover:border-team-b-cyan/50` | Digital textbook repository page |
| `AiStudioModal` | `components/studio/AiStudioModal.tsx` | `bg-surface-carbon border-border-medium rounded-2xl shadow-2xl max-w-5xl` | AI question generator studio modal |
| `RapidReviewDeck` | `components/studio/RapidReviewDeck.tsx` | `bg-surface-onyx border-white/10 rounded-2xl p-4 gap-5` | High-speed plain-English question review surface |
| `ReviewCard` | `components/studio/ReviewCard.tsx` | `bg-surface-carbon border-border-medium rounded-2xl p-6 2x2 grid` | Single question inspection card with LaTeX math |
| `StudioStickyFooter` | `components/studio/StudioStickyFooter.tsx` | `bg-surface-onyx/95 border-t border-white/10 backdrop-blur-xl p-4 shadow-2xl` | Bottom sticky action bar with plain-English save |

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

**Pattern notes:**
Sticky footer pinned to the bottom of the review modal. All controls standardized to `h-10` with matching `rounded-xl` borders: Subject/Topic dropdowns, `Clear All`, and primary Save CTA. Submits directly to `/api/ai/save` REST endpoint.


