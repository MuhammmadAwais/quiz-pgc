# Library Docs

Project-specific integration patterns and guidelines for third-party libraries in **PGC Arena**.

---

## 1. Supabase (`@supabase/ssr` & `@supabase/supabase-js`)

Supabase provides authentication, the PostgreSQL database, and Row Level Security (RLS). We also have the **Supabase MCP Server** connected for real-time schema operations.

### Client vs Server Separation

1. **Browser Client (`lib/supabase/client.ts`)**:
   Used inside Client Components if client-side auth state listeners are needed:
   ```typescript
   import { createBrowserClient } from '@supabase/ssr';

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   }
   ```

2. **Server Client (`lib/supabase/server.ts`)**:
   Used in Server Components and Server Actions:
   ```typescript
   import { createServerClient } from '@supabase/ssr';
   import { cookies } from 'next/headers';

   export async function createClient() {
     const cookieStore = await cookies();
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               );
             } catch {
               // The `setAll` method was called from a Server Component.
               // This can be ignored if middleware is refreshing sessions.
             }
           },
         },
       }
     );
   }
   ```

3. **Supabase MCP Usage**:
   - Use `supabase.list_tables` to inspect tables.
   - Use `supabase.execute_sql` with `project_id: "srkeqfibxaalkruubwlq"` to create schemas, indexes, and test queries.

---

## 2. Zustand (State Machine & Offline Live Loop)

Zustand powers the **Zero-Network Live Loop** during live matches.

### Key Pattern: Snapshot Undo History
```typescript
import { create } from 'zustand';
import { TournamentState, TurnSnapshot } from '@/lib/types/tournament';

export const useTournamentStore = create<TournamentState>((set, get) => ({
  // ... state fields ...
  historyStack: [],

  revealQuestion: () => {
    const current = get();
    // Save snapshot before state change
    const snapshot: TurnSnapshot = {
      teamTurn: current.teamTurn,
      subjectIndex: current.currentSubjectIndex,
      questionIndexInSubject: current.currentQuestionIndex,
      teamAScore: current.teamAScore,
      teamBScore: current.teamBScore,
      isQuestionRevealed: current.isQuestionRevealed,
      selectedOptionIndex: current.selectedOptionIndex,
      isAnswerSubmitted: current.isAnswerSubmitted,
      isTieBreaker: current.isTieBreaker,
      revealedQuestionIds: [...current.revealedQuestionIds],
    };

    set({
      isQuestionRevealed: true,
      historyStack: [...current.historyStack, snapshot],
    });
  },

  undoLastAction: () => {
    const { historyStack } = get();
    if (historyStack.length === 0) return;

    const previousSnapshot = historyStack[historyStack.length - 1];
    set({
      teamTurn: previousSnapshot.teamTurn,
      currentSubjectIndex: previousSnapshot.subjectIndex,
      currentQuestionIndex: previousSnapshot.questionIndexInSubject,
      teamAScore: previousSnapshot.teamAScore,
      teamBScore: previousSnapshot.teamBScore,
      isQuestionRevealed: previousSnapshot.isQuestionRevealed,
      selectedOptionIndex: previousSnapshot.selectedOptionIndex,
      isAnswerSubmitted: previousSnapshot.isAnswerSubmitted,
      isTieBreaker: previousSnapshot.isTieBreaker,
      revealedQuestionIds: previousSnapshot.revealedQuestionIds,
      historyStack: historyStack.slice(0, -1),
    });
  },
}));
```

---

## 3. Tailwind CSS v4

- Token variables are configured in `app/globals.css` with `@theme`.
- Never use `@apply` or hardcoded styles for colors.
- Use Tailwind v4 opacity modifiers: `bg-state-success/15`, `border-white/10`.

---

## 4. Lucide React

Recommended icons for consistent visual hierarchy:
- `Trophy`: Tournament victor, match conclusion
- `Swords` or `Gamepad2`: Match start & live arena
- `BookOpen`: Question bank & subjects
- `Layers`: Chapters / topics
- `RotateCcw`: Undo button
- `Eye`: Reveal question trigger
- `CheckCircle2` / `XCircle`: Correct / miss indicators
- `Settings`: Account settings & config
- `LogOut`: Admin sign-out

---

## 5. Canvas-Confetti

Used exclusively upon winner declaration on `/live-match`:
```typescript
import confetti from 'canvas-confetti';

export function triggerWinnerCelebration() {
  const duration = 4 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#8B5CF6', '#06B6D4', '#22D3EE', '#FFFFFF'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#8B5CF6', '#06B6D4', '#22D3EE', '#FFFFFF'],
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };
  frame();
}
```
