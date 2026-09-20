import { create } from 'zustand';
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

export const useTournamentStore = create<TournamentState>((set, get) => ({
  config: null,
  questionPool: {},
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
    // Shuffle questions within each subject
    const shuffledPool: Record<string, Question[]> = {};
    const allRemainingQuestions: Question[] = [];

    subjects.forEach((sub) => {
      const qs = questionsBySubject[sub.id] || [];
      const shuffled = shuffleArray(qs);
      shuffledPool[sub.id] = shuffled;

      // Unused questions that can serve as tie-breaker reserve
      const reserve = shuffled.slice(config.mcqsPerSubject);
      allRemainingQuestions.push(...reserve);
    });

    set({
      config,
      questionPool: shuffledPool,
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
      tieBreakerQuestions: shuffleArray(allRemainingQuestions),
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

    // Determine current active question
    let currentQ: Question | undefined;
    if (state.isTieBreaker) {
      currentQ = state.tieBreakerQuestions[state.tieBreakerQuestionIndex];
    } else {
      const activeSub = state.subjects[state.currentSubjectIndex];
      const subjectPool = state.questionPool[activeSub?.id] || [];
      currentQ = subjectPool[state.currentQuestionIndex];
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
      currentQ = state.tieBreakerQuestions[state.tieBreakerQuestionIndex];
    } else {
      const activeSub = state.subjects[state.currentSubjectIndex];
      const subjectPool = state.questionPool[activeSub?.id] || [];
      currentQ = subjectPool[state.currentQuestionIndex];
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
      revealedQuestionIds: [...state.revealedQuestionIds],
    };

    const isCorrect = state.selectedOptionIndex === currentQ.correct_index;
    const pointsAwarded = isCorrect ? state.config.pointsPerMcq : 0;

    const newTeamAScore =
      state.teamTurn === 'TEAM_A' ? state.teamAScore + pointsAwarded : state.teamAScore;
    const newTeamBScore =
      state.teamTurn === 'TEAM_B' ? state.teamBScore + pointsAwarded : state.teamBScore;

    // Handle Tie-Breaker (Super Over) Sudden Death
    if (state.isTieBreaker) {
      // In sudden death, each pair of turns constitutes an over.
      if (state.teamTurn === 'TEAM_A') {
        // Switch to Team B
        set({
          teamAScore: newTeamAScore,
          teamTurn: 'TEAM_B',
          isAnswerSubmitted: true,
          historyStack: [...state.historyStack, snapshot],
        });
      } else {
        // Team B just finished turn — check if tie broken
        if (newTeamAScore !== newTeamBScore) {
          const winner = newTeamAScore > newTeamBScore ? state.config.teamAName : state.config.teamBName;
          set({
            teamBScore: newTeamBScore,
            isAnswerSubmitted: true,
            isMatchFinished: true,
            winnerName: winner,
            historyStack: [...state.historyStack, snapshot],
          });
        } else {
          // Still tied, advance tie breaker question
          set({
            teamBScore: newTeamBScore,
            teamTurn: 'TEAM_A',
            isAnswerSubmitted: true,
            tieBreakerQuestionIndex: state.tieBreakerQuestionIndex + 1,
            selectedMysteryBox: null,
            isQuestionRevealed: false,
            selectedOptionIndex: null,
            historyStack: [...state.historyStack, snapshot],
          });
        }
      }
      return;
    }

    // Normal Round: Alternate turn ping-pong
    const nextTurn = state.teamTurn === 'TEAM_A' ? 'TEAM_B' : 'TEAM_A';
    const nextQuestionIndex = state.currentQuestionIndex + 1;

    // Check if subject questions limit reached
    if (nextQuestionIndex >= state.config.mcqsPerSubject) {
      const nextSubjectIndex = state.currentSubjectIndex + 1;

      if (nextSubjectIndex < state.subjects.length) {
        // Move to next subject
        set({
          teamAScore: newTeamAScore,
          teamBScore: newTeamBScore,
          isAnswerSubmitted: true,
          historyStack: [...state.historyStack, snapshot],
        });

        // Delay state flip for visual satisfaction on stage
        setTimeout(() => {
          set({
            currentSubjectIndex: nextSubjectIndex,
            currentQuestionIndex: 0,
            teamTurn: nextTurn,
            isQuestionRevealed: false,
            selectedOptionIndex: null,
            isAnswerSubmitted: false,
          });
        }, 1200);
      } else {
        // All subjects exhausted! Check if tied
        set({
          teamAScore: newTeamAScore,
          teamBScore: newTeamBScore,
          isAnswerSubmitted: true,
          historyStack: [...state.historyStack, snapshot],
        });

        setTimeout(() => {
          if (newTeamAScore === newTeamBScore) {
            // Sudden death tie breaker
            set({
              isTieBreaker: true,
              teamTurn: 'TEAM_A',
              isQuestionRevealed: false,
              selectedOptionIndex: null,
              isAnswerSubmitted: false,
              selectedMysteryBox: null,
            });
          } else {
            // Match Won
            const winner =
              newTeamAScore > newTeamBScore ? state.config?.teamAName || 'Team A' : state.config?.teamBName || 'Team B';
            set({
              isMatchFinished: true,
              winnerName: winner,
            });
          }
        }, 1200);
      }
    } else {
      // Advance to next question within same subject
      set({
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        isAnswerSubmitted: true,
        historyStack: [...state.historyStack, snapshot],
      });

      setTimeout(() => {
        set({
          currentQuestionIndex: nextQuestionIndex,
          teamTurn: nextTurn,
          isQuestionRevealed: false,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
        });
      }, 1200);
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
}));
