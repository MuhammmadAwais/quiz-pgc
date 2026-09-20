import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TournamentState,
  TournamentConfig,
  Question,
  Subject,
  TurnSnapshot,
} from '@/lib/types/tournament';

// Fisher-Yates array shuffle
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
  config: null,
  questionPool: {},
  teamAQuestionPool: {},
  teamBQuestionPool: {},
  subjects: [],
  currentSubjectIndex: 0,
  currentQuestionIndex: 0,
  teamTurn: 'TEAM_A',
  teamAScore: 0,
  teamBScore: 0,
  isQuestionRevealed: false,
  selectedOptionIndex: null,
  isAnswerSubmitted: false,
  isTieBreaker: false,
  tieBreakerQuestions: [],
  tieBreakerQuestionIndex: 0,
  selectedMysteryBox: null,
  revealedQuestionIds: [],
  isMatchFinished: false,
  winnerName: null,
  historyStack: [],

  initializeMatch: (
    config: TournamentConfig,
    questionsBySubject: Record<string, Question[]>,
    subjects: Subject[]
  ) => {
    const teamAPool: Record<string, Question[]> = {};
    const teamBPool: Record<string, Question[]> = {};
    const fullPool: Record<string, Question[]> = {};
    const tieBreakerReserve: Question[] = [];

    // Slice non-overlapping questions for Team A and Team B based on per-subject counts
    subjects.forEach((sub) => {
      const qs = questionsBySubject[sub.id] || [];
      const shuffled = shuffleArray(qs);
      fullPool[sub.id] = shuffled;

      const quota = config.subjectQuestionCounts?.[sub.id] || config.mcqsPerSubject || 2;
      teamAPool[sub.id] = shuffled.slice(0, quota);
      teamBPool[sub.id] = shuffled.slice(quota, quota * 2);

      // Remaining unused questions are reserved for tie-breakers
      const remaining = shuffled.slice(quota * 2);
      tieBreakerReserve.push(...remaining);
    });

    // Fallback: If no extra questions for reserve, pool unused questions across subjects
    if (tieBreakerReserve.length === 0) {
      const usedIds = new Set<string>();
      Object.values(teamAPool).forEach((list) => list.forEach((q) => usedIds.add(q.id)));
      Object.values(teamBPool).forEach((list) => list.forEach((q) => usedIds.add(q.id)));

      Object.values(questionsBySubject).forEach((list) => {
        list.forEach((q) => {
          if (!usedIds.has(q.id)) {
            tieBreakerReserve.push(q);
          }
        });
      });

      // Extreme fallback: if database has zero extra questions
      if (tieBreakerReserve.length === 0) {
        Object.values(fullPool).forEach((list) => tieBreakerReserve.push(...list));
      }
    }

    set({
      config,
      questionPool: fullPool,
      teamAQuestionPool: teamAPool,
      teamBQuestionPool: teamBPool,
      subjects,
      currentSubjectIndex: 0,
      currentQuestionIndex: 0,
      teamTurn: 'TEAM_A',
      teamAScore: 0,
      teamBScore: 0,
      isQuestionRevealed: false,
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isTieBreaker: false,
      tieBreakerQuestions: shuffleArray(tieBreakerReserve),
      tieBreakerQuestionIndex: 0,
      selectedMysteryBox: null,
      revealedQuestionIds: [],
      isMatchFinished: false,
      winnerName: null,
      historyStack: [],
    });
  },

  revealQuestion: () => {
    const state = get();
    if (state.isQuestionRevealed || state.isMatchFinished) return;

    // Determine current active question from the active team's non-overlapping pool
    let currentQ: Question | undefined;
    if (state.isTieBreaker) {
      if (state.tieBreakerQuestions.length > 0) {
        currentQ = state.tieBreakerQuestions[state.tieBreakerQuestionIndex % state.tieBreakerQuestions.length];
      }
    } else {
      const activeSub = state.subjects[state.currentSubjectIndex];
      const pool = state.teamTurn === 'TEAM_A' ? state.teamAQuestionPool : state.teamBQuestionPool;
      currentQ = pool[activeSub?.id]?.[state.currentQuestionIndex];
    }

    // Capture snapshot for Undo
    const snapshot: TurnSnapshot = {
      teamTurn: state.teamTurn,
      subjectIndex: state.currentSubjectIndex,
      questionIndexInSubject: state.currentQuestionIndex,
      teamAScore: state.teamAScore,
      teamBScore: state.teamBScore,
      isQuestionRevealed: state.isQuestionRevealed,
      selectedOptionIndex: state.selectedOptionIndex,
      isAnswerSubmitted: state.isAnswerSubmitted,
      isTieBreaker: state.isTieBreaker,
      tieBreakerQuestionIndex: state.tieBreakerQuestionIndex,
      selectedMysteryBox: state.selectedMysteryBox,
      revealedQuestionIds: [...state.revealedQuestionIds],
    };

    const newRevealedIds = currentQ?.id
      ? Array.from(new Set([...state.revealedQuestionIds, currentQ.id]))
      : state.revealedQuestionIds;

    set({
      isQuestionRevealed: true,
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      revealedQuestionIds: newRevealedIds,
      historyStack: [...state.historyStack, snapshot],
    });
  },

  selectOption: (index: number) => {
    const state = get();
    if (!state.isQuestionRevealed || state.isAnswerSubmitted) return;
    set({ selectedOptionIndex: index });
  },

  confirmAnswer: () => {
    const state = get();
    if (
      !state.isQuestionRevealed ||
      state.isAnswerSubmitted ||
      state.selectedOptionIndex === null ||
      !state.config
    ) {
      return;
    }

    // Determine current question to check correctness
    let currentQ: Question | undefined;
    if (state.isTieBreaker) {
      if (state.tieBreakerQuestions.length > 0) {
        currentQ = state.tieBreakerQuestions[state.tieBreakerQuestionIndex % state.tieBreakerQuestions.length];
      }
    } else {
      const activeSub = state.subjects[state.currentSubjectIndex];
      const pool = state.teamTurn === 'TEAM_A' ? state.teamAQuestionPool : state.teamBQuestionPool;
      currentQ = pool[activeSub?.id]?.[state.currentQuestionIndex];
    }

    if (!currentQ) return;

    // Capture snapshot before score & turn mutation for Undo
    const snapshot: TurnSnapshot = {
      teamTurn: state.teamTurn,
      subjectIndex: state.currentSubjectIndex,
      questionIndexInSubject: state.currentQuestionIndex,
      teamAScore: state.teamAScore,
      teamBScore: state.teamBScore,
      isQuestionRevealed: state.isQuestionRevealed,
      selectedOptionIndex: state.selectedOptionIndex,
      isAnswerSubmitted: state.isAnswerSubmitted,
      isTieBreaker: state.isTieBreaker,
      tieBreakerQuestionIndex: state.tieBreakerQuestionIndex,
      selectedMysteryBox: state.selectedMysteryBox,
      revealedQuestionIds: [...state.revealedQuestionIds],
    };

    const isCorrect = state.selectedOptionIndex === currentQ.correct_index;
    const pointsAwarded = isCorrect ? state.config.pointsPerMcq : 0;

    const newTeamAScore =
      state.teamTurn === 'TEAM_A' ? state.teamAScore + pointsAwarded : state.teamAScore;
    const newTeamBScore =
      state.teamTurn === 'TEAM_B' ? state.teamBScore + pointsAwarded : state.teamBScore;

    // Mark answer as submitted and update score
    set({
      teamAScore: newTeamAScore,
      teamBScore: newTeamBScore,
      isAnswerSubmitted: true,
      historyStack: [...state.historyStack, snapshot],
    });

    // Automatically advance after a brief visual reveal on stage (1600ms)
    setTimeout(() => {
      const current = get();
      if (current.isAnswerSubmitted && !current.isMatchFinished) {
        get().nextTurn();
      }
    }, 1600);
  },

  nextTurn: () => {
    const state = get();
    if (!state.config) return;

    // ----------------------------------------------------
    // CASE 1: TIE-BREAKER (SUPER OVER SUDDEN DEATH)
    // ----------------------------------------------------
    if (state.isTieBreaker) {
      if (state.teamTurn === 'TEAM_A') {
        // Team A just finished. Switch to Team B for their sudden-death question
        set({
          teamTurn: 'TEAM_B',
          isQuestionRevealed: false,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
          selectedMysteryBox: null,
          tieBreakerQuestionIndex: state.tieBreakerQuestionIndex + 1,
        });
      } else {
        // Team B just finished. Both teams had their chance this sudden-death over.
        if (state.teamAScore !== state.teamBScore) {
          // Tie broken!
          const winner = state.teamAScore > state.teamBScore ? state.config.teamAName : state.config.teamBName;
          set({
            isMatchFinished: true,
            winnerName: winner,
          });
        } else {
          // Still tied! Advance to another sudden death round
          set({
            teamTurn: 'TEAM_A',
            isQuestionRevealed: false,
            selectedOptionIndex: null,
            isAnswerSubmitted: false,
            selectedMysteryBox: null,
            tieBreakerQuestionIndex: state.tieBreakerQuestionIndex + 1,
          });
        }
      }
      return;
    }

    // ----------------------------------------------------
    // CASE 2: REGULAR TOURNAMENT ROUND (Sequential Team Block)
    // Team A completes all questions for Subject 1, then Team B completes all questions for Subject 1, etc.
    // ----------------------------------------------------
    const activeSub = state.subjects[state.currentSubjectIndex];
    const subjectQuota = state.config.subjectQuestionCounts?.[activeSub?.id] || state.config.mcqsPerSubject || 2;

    if (state.teamTurn === 'TEAM_A') {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < subjectQuota) {
        // Team A still has questions remaining in this subject
        set({
          currentQuestionIndex: nextIndex,
          isQuestionRevealed: false,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
        });
      } else {
        // Team A finished all questions in this subject! Hand off to Team B!
        set({
          teamTurn: 'TEAM_B',
          currentQuestionIndex: 0,
          isQuestionRevealed: false,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
        });
      }
    } else {
      // Team B is currently answering
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < subjectQuota) {
        // Team B still has questions remaining in this subject
        set({
          currentQuestionIndex: nextIndex,
          isQuestionRevealed: false,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
        });
      } else {
        // Team B finished all questions in this subject! Subject round is complete!
        const nextSubjectIndex = state.currentSubjectIndex + 1;

        if (nextSubjectIndex < state.subjects.length) {
          // Advance to next subject, starting with Team A
          set({
            currentSubjectIndex: nextSubjectIndex,
            currentQuestionIndex: 0,
            teamTurn: 'TEAM_A',
            isQuestionRevealed: false,
            selectedOptionIndex: null,
            isAnswerSubmitted: false,
          });
        } else {
          // All subjects exhausted! Check if score is tied
          if (state.teamAScore === state.teamBScore) {
            // Trigger Sudden Death Tie-Breaker
            set({
              isTieBreaker: true,
              teamTurn: 'TEAM_A',
              currentQuestionIndex: 0,
              isQuestionRevealed: false,
              selectedOptionIndex: null,
              isAnswerSubmitted: false,
              selectedMysteryBox: null,
              tieBreakerQuestionIndex: 0,
            });
          } else {
            // Match Won
            const winner = state.teamAScore > state.teamBScore ? state.config.teamAName : state.config.teamBName;
            set({
              isMatchFinished: true,
              winnerName: winner,
            });
          }
        }
      }
    }
  },

  selectMysteryBox: (boxIndex: number) => {
    const state = get();
    if (!state.isTieBreaker || state.selectedMysteryBox !== null) return;
    set({ selectedMysteryBox: boxIndex });
  },

  undoLastAction: () => {
    const state = get();
    if (state.historyStack.length === 0) return;

    const previousSnapshot = state.historyStack[state.historyStack.length - 1];

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
      tieBreakerQuestionIndex: previousSnapshot.tieBreakerQuestionIndex,
      selectedMysteryBox: previousSnapshot.selectedMysteryBox ?? null,
      revealedQuestionIds: previousSnapshot.revealedQuestionIds,
      isMatchFinished: false,
      winnerName: null,
      historyStack: state.historyStack.slice(0, -1),
    });
  },

  finishMatch: () => {
    const state = get();
    if (state.isMatchFinished) return;

    let winner: string | null = null;
    if (state.teamAScore > state.teamBScore) {
      winner = state.config?.teamAName || 'Team A';
    } else if (state.teamBScore > state.teamAScore) {
      winner = state.config?.teamBName || 'Team B';
    } else {
      winner = 'Tie';
    }

    set({
      isMatchFinished: true,
      winnerName: winner,
    });
  },

  resetMatch: () => {
    set({
      config: null,
      questionPool: {},
      teamAQuestionPool: {},
      teamBQuestionPool: {},
      subjects: [],
      currentSubjectIndex: 0,
      currentQuestionIndex: 0,
      teamTurn: 'TEAM_A',
      teamAScore: 0,
      teamBScore: 0,
      isQuestionRevealed: false,
      selectedOptionIndex: null,
      isAnswerSubmitted: false,
      isTieBreaker: false,
      tieBreakerQuestions: [],
      tieBreakerQuestionIndex: 0,
      selectedMysteryBox: null,
      revealedQuestionIds: [],
      isMatchFinished: false,
      winnerName: null,
      historyStack: [],
    });
  },
    }),
    {
      name: 'pgc_arena_active_match',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

