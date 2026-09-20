# Build Plan

## Core Principle

Rapid execution without compromising architectural integrity. Every phase delivers a fully functional, visually striking, and testable slice of **PGC Arena**. The live stage projector experience is prioritized, strictly observing the **Zero-Network Live Loop** and **Electric Obsidian Arena** standards.

---

## Phase 1 — Foundation, Schema & Tokens

Set up the database, design system, and foundational clients.

### 01 Supabase Schema & MCP Migration
- Apply PostgreSQL schema via Supabase MCP tool:
  - `subjects`
  - `chapters`
  - `questions` (with `options` jsonb and `correct_index`)
  - `contests`
  - `contest_questions` (usage ledger)
- Apply indexes for performance.

### 02 Dependencies & Environment Setup
- Install:
  - `@supabase/ssr` & `@supabase/supabase-js`
  - `zustand`
  - `lucide-react`
  - `canvas-confetti` & `@types/canvas-confetti`
- Create `.env.local` with Supabase project URL and anon key.
- Create `lib/supabase/client.ts` and `lib/supabase/server.ts`.

### 03 Theme Tokens & Root Layout
- Configure Tailwind CSS v4 `@theme` in `app/globals.css` with Electric Obsidian Arena colors, surfaces, and glows.
- Configure `app/layout.tsx` with Google Fonts `Inter` and `JetBrains Mono`.
- Build shared `components/layout/Navbar.tsx`.

---

## Phase 2 — Authentication & Settings

### 04 Admin Authentication
- Login page at `/`.
- High-contrast obsidian login card with email & password fields.
- Quick demo login button for seamless testing.
- Session persistence and middleware redirecting unauthenticated users to `/`.

### 05 Settings Page
- Account settings page at `/settings`.
- Password change interface.
- Tournament default configurations (default points per question, default questions per subject).
- Database reset / seed button to load sample tournament questions.

---

## Phase 3 — Question Bank (Three-Pane Console)

Build the question management engine at `/question-bank`.

### 06 Three-Pane Hierarchy UI
- **Pane 1 (Subjects)**: Add, edit, and delete subjects with real-time question count badges.
- **Pane 2 (Chapters/Topics)**: Add, edit, and delete chapters filtered by selected subject.
- **Pane 3 (Questions)**: Filtered question list showing question text and correct answer pill.

### 07 MCQ Editor Modal
- Modal with:
  - Question text area
  - 4 Option inputs (A, B, C, D)
  - Radio selector for Correct Option Index (0–3)
  - Subject and Chapter assignment dropdowns
- Server Actions in `lib/actions/questions.ts` for create, update, delete.
- Quick seeder action to populate 20+ collegiate competition questions (Computer Science, Physics, Mathematics, General Knowledge).

---

## Phase 4 — Match Setup & Pool Validator

Tournament configuration console at `/match-setup`.

### 08 Match Setup Interface
- Team A and Team B name inputs (customizable per match).
- Multi-select subject picker.
- Sliders/Number inputs for:
  - MCQs per subject (default: 5)
  - Points per question (default: 10)
- "Include Used Questions" toggle (default: OFF).

### 09 Real-time Question Pool Validator
- Live counter querying eligible questions based on subject selection and used-question exclusion.
- Visual validation: Start button remains disabled if eligible questions are fewer than the required quota.
- Starts match by querying questions, shuffling with Fisher-Yates, initializing Zustand store, and redirecting to `/live-match`.

---

## Phase 5 — Live Match Projector Arena (Zero-Network Live Loop)

The centerpiece stage experience at `/live-match`.

### 10 Projector Stage Arena Layout
- 16:9 full-screen projector layout with 2.5rem margins (`p-10`).
- Left: Team A Score Podium (Electric Violet glow).
- Right: Team B Score Podium (Bright Cyan glow).
- Top: Stage Header displaying Active Subject, Question Counter, and Turn Banner.
- Center: Active Question Bay with optic white 28px typography.

### 11 Turn Matrix & Option Interaction
- "Reveal Question" trigger.
- 4 Option Cards in a 2×2 grid with `[A]`, `[B]`, `[C]`, `[D]` badges.
- Operator clicks team's verbal response:
  - Correct: Selected option pulses Ice Cyan (`#22D3EE`), score increments, visual chime.
  - Incorrect: Selected option pulses Rose-Pink (`#E11D48`), correct answer lights up, score receives 0 points.
- Automatic turn rotation between Team A and Team B.
- Automatic transition to next subject once quota is reached.

### 12 Fail-Safe Undo & Stage Controls
- Unobtrusive operator drawer with:
  - "Undo" button (reverts last click/score change from Zustand history stack).
  - "Exit Match" confirmation modal.

### 13 Sudden-Death Tie-Breaker ("Super Over")
- Triggered automatically if scores are tied after regular questions.
- Renders 3D Mystery Boxes grid.
- Teams alternate choosing a mystery box to pull sudden-death questions until tie is broken.

---

## Phase 6 — Victory Celebration, Persistence & Dashboard

### 14 Winner Celebration & Single Batch Commit
- Grand celebration screen with `canvas-confetti` fireworks.
- Winner podium showing final score, winning team name, and tournament stats.
- Background execution of atomic Server Action `commitContestResult`:
  - Inserts contest into `contests`.
  - Inserts all revealed question IDs into `contest_questions`.

### 15 Dashboard Overview & Contest History
- Dashboard at `/dashboard`:
  - Global metric cards: Total Contests, Questions in Bank, Subjects Active.
  - Contest History ledger table showing past matches, team scores, winners, and dates.
  - "Launch New Match" primary CTA.
