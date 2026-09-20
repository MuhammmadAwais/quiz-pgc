# Architecture

## Stack

| Layer                          | Technology                | Purpose                                                 |
| ------------------------------ | ------------------------- | ------------------------------------------------------- |
| Framework                      | Next.js 16 (App Router)   | Full stack framework, Server Components & Actions       |
| Language                       | TypeScript (strict)       | End-to-end type safety                                  |
| UI Library                     | React 19                  | Modern React features & hooks                           |
| Styling                        | Tailwind CSS v4           | Utility styling via `@theme` tokens in `globals.css`   |
| Database & Auth                | Supabase (PostgreSQL)     | Auth, relational question bank, contest ledger          |
| Supabase MCP                   | Supabase MCP Toolset      | Real-time schema inspection, migration execution        |
| State Machine (Offline Engine) | Zustand                   | Zero-Network Live Loop tournament state & undo stack    |
| Icons                          | Lucide React              | High-candela dark mode console icons                    |
| Visual Effects                 | Canvas-Confetti           | Projector grand celebration particle fireworks          |

---

## Folder Structure

```text
/
├── AGENTS.md                              → Agent workflow rules & read strategy
├── DESIGN.md                              → Electric Obsidian Arena design system
├── context/                               → Project context files
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                         → Root layout with Inter & JetBrains Mono fonts
│   ├── globals.css                        → Tailwind v4 @theme token specifications
│   ├── page.tsx                           → Login page (Admin authentication)
│   ├── dashboard/
│   │   └── page.tsx                      → Tournament overview & match history
│   ├── question-bank/
│   │   └── page.tsx                      → 3-Pane Question Bank management
│   ├── match-setup/
│   │   └── page.tsx                      → Tournament round configuration console
│   ├── live-match/
│   │   └── page.tsx                      → Fullscreen 16:9 projector stage arena
│   └── settings/
│       └── page.tsx                      → Account settings & tournament defaults
├── components/
│   ├── layout/
│   │   └── Navbar.tsx                     → Obsidian glass top navbar
│   ├── ui/
│   │   ├── Button.tsx                     → Electric Violet, Cyan, & Console variants
│   │   ├── Card.tsx                       → Onyx & Carbon structural cards
│   │   ├── Badge.tsx                      → Telemetry & status chips (JetBrains Mono)
│   │   ├── Input.tsx                      → Obsidian recessed input wells
│   │   └── Modal.tsx                      → Telemetry dialog container
│   ├── question-bank/
│   │   ├── SubjectList.tsx               → Subject pane with count badges
│   │   ├── ChapterList.tsx               → Chapter pane filtered by subject
│   │   ├── QuestionList.tsx              → MCQ items with preview drawer
│   │   └── QuestionModal.tsx             → Add/Edit MCQ modal
│   ├── match-setup/
│   │   ├── SetupForm.tsx                 → Team names, subject selector, sliders
│   │   └── PoolValidator.tsx             → Live calculation of eligible questions
│   ├── live-match/
│   │   ├── StageHeader.tsx               → Subject banner, turn indicator, round clock
│   │   ├── TeamPodium.tsx                → Team A (Violet) & Team B (Cyan) score pods
│   │   ├── QuestionArena.tsx             → Question prompt & 4-option response grid
│   │   ├── OptionCard.tsx                → High-contrast interactive option card
│   │   ├── MysteryBoxGrid.tsx            → Sudden-death "Super Over" mystery boxes
│   │   ├── WinnerCelebration.tsx         → Grand victory podium with confetti VFX
│   │   └── StageControls.tsx             → Operator drawer with Undo & Exit triggers
│   └── dashboard/
│       ├── StatsOverview.tsx             → Total matches, questions, subjects counts
│       └── ContestHistoryTable.tsx       → Past match ledger with score breakdowns
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      → Browser Supabase client (@supabase/ssr)
│   │   ├── server.ts                      → Server Supabase client for Server Actions
│   │   └── middleware.ts                  → Auth session validator
│   ├── store/
│   │   └── tournament-store.ts            → Zustand Zero-Network Live Loop store & undo
│   ├── actions/
│   │   ├── subjects.ts                    → Server actions for subjects
│   │   ├── chapters.ts                    → Server actions for chapters
│   │   ├── questions.ts                   → Server actions for questions & pool queries
│   │   └── contests.ts                    → Server action for batch match commit
│   └── types/
│       └── tournament.ts                  → TypeScript interfaces & schemas
└── middleware.ts                          → Next.js route protection middleware
```

---

## The Zero-Network Live Loop Architecture

```text
  [ Supabase Database ]
           │
           │ (1) Match Launch: Single query fetches eligible questions
           ▼
  [ /match-setup → /live-match ]
           │
           │ (2) Hydrate Zustand Tournament Store & Fisher-Yates Shuffle
           ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │              OFFLINE CLIENT GAMEPLAY LOOP (Zustand)             │
  │                                                                 │
  │   [Team A Turn] ──► [Reveal Question] ──► [Select Option]       │
  │         ▲                                         │             │
  │         │                                         ▼             │
  │   [Undo Stack Pop] ◄── [Operator Undo]    [Score Evaluated]     │
  │                                                   │             │
  │   [Tie Breaker: Super Over] ◄── [Score Tied]      ▼             │
  │   (Mystery Boxes Grid)                   [Team B Turn]          │
  │                                                                 │
  │   * 100% in-browser memory. 0ms latency. Zero network requests. │
  └─────────────────────────────────────────────────────────────────┘
           │
           │ (3) Match Complete: Winner Determined
           ▼
  [ Single Batch Commit ]
           │
           ├──► Inserts contest record into `contests`
           └──► Inserts all revealed question IDs into `contest_questions`
           │
           ▼
  [ Supabase Database ]
```

---

## Database Schema (PostgreSQL via Supabase)

### 1. `subjects`
```sql
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
```

### 2. `chapters`
```sql
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index idx_chapters_subject_id on public.chapters(subject_id);
```

### 3. `questions`
```sql
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  text text not null,
  options jsonb not null, -- Array of 4 strings: ["Option A", "Option B", "Option C", "Option D"]
  correct_index integer not null check (correct_index >= 0 and correct_index <= 3),
  created_at timestamptz not null default now()
);
create index idx_questions_subject_id on public.questions(subject_id);
create index idx_questions_chapter_id on public.questions(chapter_id);
```

### 4. `contests`
```sql
create table public.contests (
  id uuid primary key default gen_random_uuid(),
  team_a_name text not null,
  team_b_name text not null,
  team_a_score integer not null default 0,
  team_b_score integer not null default 0,
  winner_name text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
```

### 5. `contest_questions` (Usage Ledger)
```sql
create table public.contest_questions (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index idx_contest_questions_question_id on public.contest_questions(question_id);
create index idx_contest_questions_contest_id on public.contest_questions(contest_id);
```

---

## State Machine Schema (Zustand `TournamentStore`)

```typescript
export type TeamTurn = 'TEAM_A' | 'TEAM_B';

export interface QuestionItem {
  id: string;
  subject_id: string;
  subject_name: string;
  chapter_id: string;
  text: string;
  options: [string, string, string, string];
  correct_index: number;
}

export interface TournamentConfig {
  teamAName: string;
  teamBName: string;
  selectedSubjectIds: string[];
  mcqsPerSubject: number;
  pointsPerMcq: number;
  includeUsedQuestions: boolean;
}

export interface TurnSnapshot {
  teamTurn: TeamTurn;
  subjectIndex: number;
  questionIndexInSubject: number;
  teamAScore: number;
  teamBScore: number;
  isQuestionRevealed: boolean;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isTieBreaker: boolean;
  revealedQuestionIds: string[];
}

export interface TournamentState {
  config: TournamentConfig | null;
  questionPool: Record<string, QuestionItem[]>; // subject_id -> shuffled questions
  subjectOrder: { id: string; name: string }[];
  currentSubjectIndex: number;
  currentQuestionIndex: number;
  teamTurn: TeamTurn;
  teamAScore: number;
  teamBScore: number;
  isQuestionRevealed: boolean;
  selectedOptionIndex: number | null;
  isAnswerSubmitted: boolean;
  isTieBreaker: boolean;
  tieBreakerQuestions: QuestionItem[];
  revealedQuestionIds: string[];
  isMatchFinished: boolean;
  winnerName: string | null;
  historyStack: TurnSnapshot[];

  // Actions
  initializeMatch: (config: TournamentConfig, questionsBySubject: Record<string, QuestionItem[]>) => void;
  revealQuestion: () => void;
  selectOption: (index: number) => void;
  confirmAnswer: () => void;
  undoLastAction: () => void;
  selectMysteryBox: (boxIndex: number) => void;
  finishMatch: () => Promise<void>;
}
```

---

## Client vs Server Boundaries

1. **Server Components:**
   - `/dashboard`: Direct database read for contest stats and ledger.
   - `/question-bank`: Initial load of subjects, chapters, questions with full server-side caching.
   - `/match-setup`: Server-side initial data query of subjects and question counts.
   - `/settings`: Server-rendered security controls.

2. **Client Components:**
   - Interactive modals, filter bars, and dynamic selection chips in `/question-bank` and `/match-setup`.
   - `/live-match`: 100% Client Component engine. Driven purely by Zustand and React 19 hooks. Zero fetches during live interaction.

3. **Server Actions (`lib/actions/`):**
   - Mutation endpoints for CRUD operations (create subject, delete chapter, update question).
   - `fetchEligibleQuestions(config)`: Pre-match query.
   - `commitContestResult(payload)`: Post-match atomic batch mutation.
