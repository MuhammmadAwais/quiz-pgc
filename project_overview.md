# Project Overview

## About the Project

PGC Arena is a full-stack, live-event quiz tournament application built specifically for college projector displays. The application allows a single administrator to manage a hierarchical question bank (Subjects > Chapters > MCQs), configure match rules, and control a live competition from a laptop connected to a projector via HDMI. 

To guarantee zero latency and eliminate the risk of college Wi-Fi failures during a live event, PGC Arena uses a "Zero-Network Live Loop" architecture. The entire match—including alternating turns, scoring, undo history, and sudden-death tie-breakers—runs completely offline in local browser state (via Zustand/Redux). The database is only queried once to start the match and written to once when the match concludes.

---

## The Problem It Solves

Running live quiz competitions typically requires manual tracking of whose turn it is, calculating scores on whiteboards, and ensuring questions aren't repeated from previous rounds. Doing this under the pressure of a live audience often leads to human error, disputes, and awkward pauses. Furthermore, web-based quiz apps that require constant database pings for every button click are highly vulnerable to network lag, which ruins the real-time projector experience.

PGC Arena solves this by fully automating the turn-based state machine, instantly resolving scores, preventing question repetition via a historical database ledger, and decoupling the live match UI from the network to ensure a flawless, 0ms-latency presentation.

---

## Pages

```text
/                  → Auth page (Single Admin Login via Supabase Auth)
/dashboard         → Overview, stats (total matches, total questions), and tournament history
/question-bank     → Three-pane UI to manage Subjects, Chapters, and MCQs
/match-setup       → Configuration form to initiate a new tournament round
/live-match        → The projector-optimized live presentation UI (Full screen)
```

---

## Navigation

Top navbar. Clean, minimal, and optimized for dark mode. Three navigation items:

```text
Dashboard    Question Bank    New Match
```

Full-width layout on all pages. No sidebar.

---

## Core User Flow

### 1. Authentication
- Admin logs in with master credentials.
- On login → redirects to `/dashboard`.
- Unauthenticated users attempting to access any route redirect to `/`.

### 2. Question Bank Management
- Admin navigates to `/question-bank`.
- Admin can create/edit/delete `Subjects` (e.g., Computer Science, Physics).
- Admin can create/edit/delete `Chapters` under specific Subjects.
- Admin can add MCQs to a Chapter. Form requires: Question Text, Option A, Option B, Option C, Option D, and the Correct Option Index.

### 3. Match Setup
- Admin goes to `/match-setup`.
- Inputs `Team A Name` and `Team B Name` (temporary names for the current session).
- Selects one or multiple `Subjects` from a multi-select dropdown.
- Sets `MCQs per Subject` (e.g., 5 questions per subject).
- Sets `Points per MCQ` (e.g., 10 points).
- Toggles `Include Used Questions` (Default: OFF. If OFF, the system filters out any questions previously used in past contests).
- UI displays a real-time count of available questions based on the current filters.
- Clicks `Start Match`.

### 4. The Live Match (Zero-Network Loop)
- System fetches the required pool of valid questions, shuffles them locally, and transitions to `/live-match`.
- UI is highly visual, displaying the current Team's turn, Subject, and Scores at the top.
- **Turn Matrix:**
  - UI announces: "Team A's Turn - Subject: Physics".
  - Admin clicks "Reveal Question". The MCQ and 4 options appear.
  - Team A answers verbally. Admin clicks the option Team A selected.
  - **Scoring:** If correct, Team A score increases. If incorrect, Team A gets 0 points (no penalty, no point transfer to Team B).
  - UI automatically switches to: "Team B's Turn - Subject: Physics".
  - This ping-pong alternates until the `MCQs per Subject` limit is reached, then automatically moves to the next Subject.
- **Undo Feature:** An unobtrusive "Undo" button allows the Admin to pop the local state back exactly one step if they accidentally misclick an option on stage.

### 5. The Tie-Breaker ("Super Over")
- If all subjects are exhausted and the score is tied, the system enters the Tie-Breaker mode automatically.
- Projector displays a grid of "Random Mystery Boxes".
- Teams alternate picking a box (e.g., "Box 4").
- Clicking a box triggers a function that pulls one unused question from a *randomly selected* subject.
- Turn logic applies (correct = points, wrong = 0). This acts as sudden death.

### 6. Match Conclusion & Persistence
- Once a winner is mathematically determined (or sudden death concludes), the system shows a large Celebration/Winner screen.
- **The Batch Commit:** In the background, the app fires a single API payload to Supabase:
  1. Inserts the match record (Teams, Scores, Winner) into `Contests`.
  2. Inserts all question IDs revealed during the match into `Contest_Questions`.

---

## Data Architecture

### Core Tables (Supabase PostgreSQL)

**`subjects`**
- `id` (uuid, PK)
- `name` (text)
- `created_at` (timestamp)

**`chapters`**
- `id` (uuid, PK)
- `subject_id` (uuid, FK)
- `name` (text)
- `created_at` (timestamp)

**`questions`**
- `id` (uuid, PK)
- `chapter_id` (uuid, FK)
- `subject_id` (uuid, FK)
- `text` (text)
- `options` (jsonb - array of 4 strings)
- `correct_index` (integer 0-3)
- `created_at` (timestamp)

**`contests`**
- `id` (uuid, PK)
- `team_a_name` (text)
- `team_b_name` (text)
- `team_a_score` (integer)
- `team_b_score` (integer)
- `winner_name` (text, nullable)
- `status` (text - 'completed')
- `created_at` (timestamp)

**`contest_questions`** (The append-only usage ledger)
- `id` (uuid, PK)
- `contest_id` (uuid, FK)
- `question_id` (uuid, FK)
- `created_at` (timestamp)

### State Management (Client-Side)
- **Store:** Zustand or Redux Toolkit.
- **State Object:** Tracks `currentTeamTurn`, `currentSubjectIndex`, `questionsAskedThisRound`, `teamAScore`, `teamBScore`, `actionHistory` (for Undo), and the `shuffledQuestionPool` array.

---

## Features In Scope

- Single Admin Authentication via Supabase.
- Full CRUD interfaces for Subjects, Chapters, and Questions.
- Form validation for match setup (preventing start if insufficient questions exist).
- "Include Used Questions" database filter toggle.
- Client-side Fisher-Yates array shuffling for question randomization.
- Local state machine handling alternating turns between Team A and Team B.
- Zero-point fallback for incorrect answers (no negative marking).
- "Undo" functionality to reverse the most recent click/score allocation.
- "Super Over" random box grid for sudden-death tie-breakers.
- High-visibility projector UI (large fonts, high contrast, GSAP/Framer Motion animations for reveals and winner screen).
- Single batch-commit database mutation at the end of the match.
- Dashboard displaying a data table of past match histories.

---

## Features Out of Scope

- Student registration, profiles, or public-facing views.
- Real-time WebSockets, database subscriptions, or multi-device syncing during the match.
- Physical buzzer hardware integration.
- Image, video, or audio support for questions (text only).
- Negative marking or transferring missed questions to the opposing team.
- Exporting/Importing questions via CSV or Excel (manual entry only for MVP).
- Concurrent matches (system assumes only one match runs at a time).

---

## Key App Events (Tracking/Logging)

```typescript
match_configured; // { subjects, mcqCount, useUsedQuestions }
match_started; // { teamA, teamB, totalQuestionsLoaded }
tie_breaker_initiated; // { currentScore }
match_completed; // { winner, teamAScore, teamBScore, questionsUsedCount }
```

---

## Target User

A college event manager, professor, or student society admin who needs a fail-safe, visually impressive tool to project and control a live quiz competition on stage.

---

## Success Criteria

- App goes from zero to deployable on Vercel/Supabase within a 24-hour development window.
- The `live-match` view can suffer a complete internet disconnection mid-game without crashing, interrupting the match, or losing the current score.
- The state machine flawlessly forces Team A and Team B to alternate turns and subject changes without admin intervention.
- The `Undo` button accurately reverts the score and current turn state 100% of the time.
- Used questions are permanently excluded from future matches (unless explicitly overridden in setup).