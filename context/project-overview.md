# Project Overview

## About the Project

**PGC Arena** is a full-stack, live-event quiz tournament application built specifically for college auditorium projector displays and live stage competitions. The application allows an administrator to manage a hierarchical question bank (Subjects > Chapters/Topics > MCQs), configure tournament match parameters, conduct matches in real time via a laptop connected to a 1080p/4K projector via HDMI, and review historical match results.

To guarantee zero latency and eliminate any risk of college Wi-Fi or auditorium network interruptions during live events, PGC Arena uses a **"Zero-Network Live Loop"** architecture. Once questions are fetched at match launch, the entire competition—including alternating turns, question reveals, option selections, score evaluations, multi-step undo history, and sudden-death tie-breakers—runs 100% offline in client browser memory (via Zustand). The database is queried once to initiate the match and written to once when the match concludes.

---

## The Problem It Solves

Hosting live academic quiz competitions traditionally involves chaotic whiteboard scorekeeping, manual question tracking, dispute-prone turn calculations, and awkward pauses while operators verify answers. Furthermore, standard web-based quiz tools that rely on continuous client-server network requests frequently freeze or lag under spotty campus Wi-Fi, ruining stage pacing.

PGC Arena solves this by:
1. Fully automating the alternating turn state machine without manual operator math.
2. Providing a projector-safe, high-candela broadcast interface visible clearly from 30+ feet.
3. Running the active match in an offline client loop (0ms latency, resilient to total network loss).
4. Enforcing an append-only database question ledger to prevent question repetition across contests.
5. Providing an instant, fail-safe "Undo" button to reverse accidental misclicks on stage without breaking turn order.

---

## Pages & Routes

```text
/                  → Auth page (Single Admin Login via Supabase Auth)
/dashboard         → Tournament overview, global statistics, and contest history ledger
/question-bank     → Three-pane UI for Subjects, Chapters/Topics, and MCQ management
/match-setup       → Match configuration console (Teams, Subjects, Questions count, Pool verification)
/live-match        → The projector-optimized live stage presentation arena (Full screen 16:9)
/settings          → Administrator account settings, security, and tournament defaults
```

---

## Navigation

Top navbar designed for dark obsidian theme with subtle glow and clear route indicators:

```text
PGC ARENA    Dashboard    Question Bank    New Match    Settings    [Logout]
```

- Full-width layout across all administrative pages.
- `/live-match` features a distraction-free, projector-optimized mode with full-screen focus, collapsible admin control drawer, and spectator safety margins.

---

## Core User Flows

### 1. Authentication
- Administrator logs in with master credentials via Supabase Auth.
- On login → redirects to `/dashboard`.
- Protected route middleware redirects unauthenticated users to `/`.

### 2. Question Bank Management
- Administrator navigates to `/question-bank`.
- **Three-Pane Hierarchy:**
  1. **Subjects Pane:** Add, rename, delete Subjects (e.g., Computer Science, Physics, Mathematics, General Knowledge).
  2. **Chapters / Topics Pane:** Add, edit, delete Chapters/Topics filtered by selected Subject.
  3. **MCQs Pane:** Filter questions by Subject & Chapter. Modal or drawer to create/edit MCQs:
     - Question Text
     - 4 Options (Option A, B, C, D)
     - Correct Option Index (0 to 3)
     - Real-time preview of how the question card will appear on the projector

### 3. Match Setup
- Administrator navigates to `/match-setup`.
- Inputs `Team A Name` (e.g., "Alpha Squad") and `Team B Name` (e.g., "Omega Minds").
- Selects one or multiple `Subjects` via multi-select selector.
- Sets `MCQs per Subject` (e.g., 5 questions per subject).
- Sets `Points per MCQ` (e.g., 10 points).
- Toggles `Include Used Questions` (Default: OFF. When OFF, questions recorded in `contest_questions` are excluded).
- UI calculates and displays a real-time count of eligible questions in the selected pool.
- Validates that sufficient questions exist (at least `MCQs per Subject * Number of Subjects` questions available).
- Clicks `Start Match`.

### 4. The Live Match (Zero-Network Live Loop)
- The app fetches the question pool from Supabase, applies client-side Fisher-Yates shuffle, initializes the Zustand tournament store, and navigates to `/live-match`.
- **Display Architecture:**
  - High-contrast 12-column stage layout: Team A pod (left), Central Arena (subject, round, turn indicator), Team B pod (right).
  - Optics: Optic white and bright slate text on obsidian canvas, Electric Violet for Team A, Bright Cyan for Team B, Ice Cyan for correct, Luminous Rose-Pink for misses.
- **Turn Matrix:**
  - Board announces active turn: *"Team A's Turn — Subject: Physics"*.
  - Operator clicks "Reveal Question". Question prompt and 4 options appear with crisp animation.
  - Team A answers verbally on stage. Operator clicks the option Team A chose.
  - **Scoring & Resolution:**
    - Correct: Selected option pulses Ice Cyan (`#22D3EE`), score immediately increments, celebratory visual chime.
    - Miss: Option pulses Rose-Pink (`#E11D48`), correct answer is revealed, score receives 0 points (no negative marking).
  - State machine transitions to Team B's turn automatically.
  - Cycles back and forth until the subject's question quota is fulfilled, then advances to the next subject.
- **Fail-Safe Undo:**
  - An unobtrusive "Undo" button allows the operator to pop the local state back exactly one step if an option was clicked by mistake, restoring the exact previous turn, revealed state, and score.

### 5. Sudden-Death Tie-Breaker ("Super Over")
- If all configured questions have been played and scores are tied:
  - System initiates Tie-Breaker mode automatically.
  - Projector renders a dramatic grid of "Mystery Boxes".
  - Teams alternate selecting a mystery box.
  - Clicking an unrevealed box pulls an unused question from a random subject.
  - Sudden-death rules apply until the tie is broken.

### 6. Match Conclusion & Persistence
- When all rounds finish (or sudden-death resolves a winner):
  - Projector transitions to a Grand Winner Celebration screen with high-energy confetti VFX, winner podium, and final statistics.
  - **The Single Batch Commit:** In the background, the client executes a single batch mutation to Supabase:
    1. Records the contest into `contests` (`team_a_name`, `team_b_name`, `team_a_score`, `team_b_score`, `winner_name`, `status`).
    2. Inserts all question IDs revealed during the match into `contest_questions`.
  - Operator can return to `/dashboard` or launch a new match.

### 7. Account Settings
- Administrator navigates to `/settings`.
- Update admin credentials (email / password change via Supabase Auth).
- Configure tournament defaults (default points per question, default questions per subject).
- Data management (summary of total questions, subjects, contests, and export/reset utilities).

---

## Data Architecture

### Supabase Tables (PostgreSQL)

- **`subjects`**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `name` (text, not null)
  - `created_at` (timestamptz, default `now()`)

- **`chapters`**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `subject_id` (uuid, FK -> `subjects.id` ON DELETE CASCADE)
  - `name` (text, not null)
  - `created_at` (timestamptz, default `now()`)

- **`questions`**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `subject_id` (uuid, FK -> `subjects.id` ON DELETE CASCADE)
  - `chapter_id` (uuid, FK -> `chapters.id` ON DELETE CASCADE)
  - `text` (text, not null)
  - `options` (jsonb, array of 4 strings, not null)
  - `correct_index` (integer 0-3, not null)
  - `created_at` (timestamptz, default `now()`)

- **`contests`**:
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `team_a_name` (text, not null)
  - `team_b_name` (text, not null)
  - `team_a_score` (integer, not null, default 0)
  - `team_b_score` (integer, not null, default 0)
  - `winner_name` (text, nullable)
  - `status` (text, default `'completed'`)
  - `created_at` (timestamptz, default `now()`)

- **`contest_questions`** (Append-only historical ledger):
  - `id` (uuid, PK, default `gen_random_uuid()`)
  - `contest_id` (uuid, FK -> `contests.id` ON DELETE CASCADE)
  - `question_id` (uuid, FK -> `questions.id` ON DELETE CASCADE)
  - `created_at` (timestamptz, default `now()`)

---

## Features In Scope

- Single Admin authentication via Supabase Auth.
- Full CRUD for Subjects, Chapters/Topics, and Questions.
- Interactive question pool validator preventing invalid match starts.
- "Include Used Questions" exclusion ledger toggle.
- Client-side Fisher-Yates randomization.
- Zero-Network Live Loop with deterministic turn machine.
- Projector-first 16:9 UI with 30-foot stage readability.
- Instant 1-step undo capability.
- "Super Over" mystery box sudden-death tie-breaker.
- Confetti celebration and victory presentation.
- Single atomic batch-commit persistence to Supabase.
- Dashboard with past contest ledger and stats.
- Settings page for account preferences.

---

## Features Out of Scope

- Student self-registration or multi-tenant user accounts.
- WebSocket live spectator broadcast / mobile buzzers (single operator control model).
- Negative marking or question bounce to opposing team.
- Multimedia questions (audio, video) — text MCQs only for MVP.
