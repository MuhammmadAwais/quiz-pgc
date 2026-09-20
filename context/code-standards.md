# Code Standards

Implementation rules and conventions for **PGC Arena**. The AI agent must follow these standards without exception to prevent technical debt and pattern drift.

---

## Engineering Mindset

- **Fast & Bulletproof**: We are in a rapid execution phase, but speed must not compromise stability. Live stage projector applications cannot afford runtime crashes in front of an auditorium audience.
- **Zero-Network Invariant**: The live gameplay loop on `/live-match` must run 100% offline in browser memory. Once match questions are loaded, a sudden loss of Wi-Fi or LAN connection must not interrupt or freeze the game.
- **Clean over Clever**: Write straightforward TypeScript, explicit React state machines, and descriptive functions. Avoid over-engineered abstractions.
- **Scope Discipline**: Only build what the current feature requires. Keep components isolated and focused.

---

## TypeScript Standards

- Strict mode enabled (`"strict": true` in `tsconfig.json`).
- Zero `any` policy: Always use strongly-typed models or TypeScript `unknown` narrowed with type guards.
- Explicit return types for Server Actions, database queries, and store mutation handlers.
- Interfaces for extensible component props; `type` for state shapes, union discriminators, and action payloads.

```typescript
// Good
export type TeamTurn = 'TEAM_A' | 'TEAM_B';

export interface OptionSelectionPayload {
  questionId: string;
  selectedOptionIndex: number;
}

export async function createSubject(name: string): Promise<{ success: boolean; error?: string }> {
  // ...
}
```

---

## Next.js 16 & React 19 Conventions

- **App Router Exclusively**: All routes live in `app/`.
- **Server Components by Default**: Pages (`/dashboard`, `/question-bank`, `/match-setup`, `/settings`) fetch initial data in Server Components and pass typed props to Client Components.
- **Client Components (`"use client"`)**:
  - Add `"use client"` only when components need React state (`useState`, `useReducer`), hooks, browser APIs, or Zustand store access.
  - `/live-match` is a pure Client Component tree powered by Zustand.
- **Server Actions**:
  - Defined in `lib/actions/` with `"use server"` directive at file top.
  - Handle all database mutations (Subjects, Chapters, Questions, Contest completion).
  - Always validate arguments and return structured `{ data, error }` objects.
- **No Inline Server Actions**: Never define inline `async function action()` inside Client Components.

---

## Zero-Network Live Loop Invariants

1. **Deterministic Local State**:
   - The tournament state machine lives in `lib/store/tournament-store.ts` via Zustand.
   - Revealing questions, recording answers, switching turns, and awarding scores must execute synchronously in client state.
   - Never dispatch `fetch()` or mutate Supabase while questions are active on stage.

2. **Full History Stack for Undo**:
   - Every state transition must push an immutable snapshot of `{ teamTurn, currentSubjectIndex, currentQuestionIndex, teamAScore, teamBScore, revealedQuestionIds }` onto `historyStack`.
   - The `undoLastAction` handler pops the latest snapshot and restores state cleanly.

3. **Single Batch Commit on Finish**:
   - Only when the match is explicitly completed (winner celebration screen) does the app dispatch a single Server Action `commitContestResult`:
     1. Inserts contest metadata into `contests`.
     2. Inserts question IDs revealed into `contest_questions`.

---

## Styling & Design System Rules

- Strictly follow `DESIGN.md` and `context/ui-tokens.md`.
- Never use raw hex values (`#8B5CF6`) or arbitrary utility colors (`bg-purple-600`, `text-green-400`).
- Use `@theme` tokens exclusively:
  - Surfaces: `bg-surface-obsidian`, `bg-surface-onyx`, `bg-surface-carbon`, `bg-surface-interactive`
  - Team A: `text-team-a-core`, `bg-team-a-core`, `border-team-a-bright`
  - Team B: `text-team-b-cyan`, `bg-team-b-cyan`, `border-team-b-ice`
  - Status: `text-state-success`, `text-state-warning-rose`
- Zero traditional traffic-light colors (No green, red, or yellow).
