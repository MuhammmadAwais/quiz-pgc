<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PGC Arena Read Strategy (Token-Efficient & Domain-Specific)

Do not read all context files on every task. Read strictly what your current task touches:

1. **Always Check First:**
   - `context/progress-tracker.md` — Current milestone, active feature, completed items.
   - `context/architecture.md` — Next.js 16 App Router boundaries, Zero-Network Live Loop, Zustand store, Supabase schema & server actions.

2. **When Building or Styling UI:**
   - `DESIGN.md` & `context/ui-tokens.md` — Exact Tailwind v4 `@theme` tokens (Obsidian `#0A0A0F`, Onyx `#12111A`, Carbon `#1B1A26`, Interactive `#262436`, Team A Violet `#8B5CF6`, Team B Cyan `#06B6D4`, Success Ice `#22D3EE`, Rose Warning `#E11D48`).
   - `context/ui-rules.md` — Projector-first 12-column grid (1920x1080 / 4K), 2.5rem margins, Inter + JetBrains Mono pairing, 0 green/red/yellow, 30-foot stage readability.
   - `context/ui-registry.md` — Baseline and existing component patterns to match before creating new ones.

3. **When Writing Logic, State Machine, or DB Operations:**
   - `context/library-docs.md` — Next.js 16, React 19, Supabase SSR (`@supabase/ssr`), Zustand offline store + undo history, Lucide icons, Tailwind v4 patterns.
   - `context/code-standards.md` — TypeScript strictness, component isolation, offline gameplay guarantees, zero hardcoded content.

4. **When Starting a New Feature or Verifying Scope:**
   - `context/build-plan.md` — The phased, rapid roadmap for PGC Arena.
   - `context/project-overview.md` — Tournament rules, question bank hierarchy, single admin workflow, success criteria.

---

## Rules That Never Change

- **Zero Hardcoded Hex / Raw Colors:** Never use raw hex values (`#8B5CF6`) or arbitrary utility colors (`bg-purple-600`, `bg-blue-500`, `bg-red-500`) in markup. Use `@theme` tokens exclusively (`bg-surface-obsidian`, `bg-surface-carbon`, `text-optic-white`, `border-outline`, `bg-team-a-core`, `bg-team-b-cyan`, `text-state-success`, `text-state-warning-rose`).
- **Electric Obsidian Arena Aesthetic (No Green, Red, or Yellow):** Strictly follow `DESIGN.md` — avoid traditional traffic-light colors. Use high-candela photonic hues against deep obsidian surfaces. Team A is Electric Violet (`#8B5CF6`), Team B is Bright Cyan (`#06B6D4`), correct answers/scores use Electric Ice Cyan (`#22D3EE`), incorrect/misses use Luminous Rose-Pink (`#E11D48`).
- **Strict Typographic Roles:** `Inter` is reserved for navigation, question prompts, option cards, dialogs, and admin forms. `JetBrains Mono` is strictly for numerical telemetry, score boards (`tnum`), round clocks, question indices, and status chips.
- **The Zero-Network Live Loop Invariant:** During `/live-match`, the entire gameplay loop (questions, options, alternating turns, score accumulation, undo stack, mystery box selection) runs 100% offline in client memory via Zustand. No per-click database queries or network requests occur during live questions. A live projector match must never freeze, pause, or fail if venue Wi-Fi drops. Database is queried once at match setup, and committed once at match conclusion.
- **Deterministic Turn & Undo Machine:** The alternating turn matrix (Team A -> Reveal -> Answer -> Score -> Team B) and subject transitions must run autonomously without manual admin recalculations. An unobtrusive `Undo` button must revert the last turn and score change 100% reliably.
- **Turnkey Personalization & Schema Invariant:** Never hardcode subjects, chapters, questions, or match configurations into components. Always consume from Supabase or the active tournament state store.
- **Living Registry & Imprint:** Run `/imprint` or update `context/ui-registry.md` after completing any UI component to ensure spacing, borders, and radiuses never drift.
- **Break Doom-Loops:** If the same issue persists after one corrective prompt — stop immediately and run `/recover`.

---

## Available Skills

- `/architect` — before any complex feature or section. Think like a senior engineer before writing code.
- `/imprint` — after any new UI component. Capture visual patterns into `ui-registry.md`.
- `/review` — before demoing or when an implementation needs architectural verification.
- `/recover` — when code breaks after one failed correction. Diagnose failure mode fast.
- `/remember save` — when a session ends to compress memory for next time.
- `/remember restore` — when starting a new session to pick up right where you left off.