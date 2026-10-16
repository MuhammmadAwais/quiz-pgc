import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  TournamentState,
  TournamentConfig,
  Question,
  Subject,
  TurnSnapshot,
  Team,
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
      teams: [],
      activeTeamIndex: 0,
      questionPool: {},
      teamQuestionPools: {},
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

      // Timer state
      timerStartedAt: null,
      isTimerPaused: false,
      isTimeExpired: false,
      isPostponed: false,

      initializeMatch: (
        config: TournamentConfig,
        questionsBySubject: Record<string, Question[]>,
        subjects: Subject[]
      ) => {
        const fullPool: Record<string, Question[]> = {};
        const teamPools: Record<string, Record<string, Question[]>> = {};
        const tieBreakerReserve: Question[] = [];

        // Ensure teams exist (fallback to 2 teams if empty)
        const initializedTeams: Team[] =
          config.teams && config.teams.length >= 2
            ? config.teams.map((t) => ({ ...t, score: 0 }))
            : [
                {
                  id: 'team-1',
                  name: config.teamAName || 'Team Alpha',
                  color: config.teamAColor || '#8B5CF6',
                  score: 0,
                },
                {
                  id: 'team-2',
                  name: config.teamBName || 'Team Beta',
                  color: config.teamBColor || '#06B6D4',
                  score: 0,
                },
              ];

        // Initialize team pool buckets
        initializedTeams.forEach((team) => {
          teamPools[team.id] = {};
        });

        // Slices non-overlapping questions for each team based on per-subject counts
        subjects.forEach((sub) => {
          const qs = questionsBySubject[sub.id] || [];
          const shuffled = shuffleArray(qs);
          fullPool[sub.id] = shuffled;

          const quota = config.subjectQuestionCounts?.[sub.id] || config.mcqsPerSubject || 2;

          initializedTeams.forEach((team, teamIdx) => {
            const startIdx = teamIdx * quota;
            const endIdx = startIdx + quota;
            teamPools[team.id][sub.id] = shuffled.slice(startIdx, endIdx);
          });

          // Remaining unused questions are reserved for tie-breakers
          const reserveStart = initializedTeams.length * quota;
          const remaining = shuffled.slice(reserveStart);
          tieBreakerReserve.push(...remaining);
        });

        // Fallback: If no extra questions for reserve, pool unused questions across subjects
        if (tieBreakerReserve.length === 0) {
          const usedIds = new Set<string>();
          Object.values(teamPools).forEach((subjectMap) => {
            Object.values(subjectMap).forEach((list) => list.forEach((q) => usedIds.add(q.id)));
          });

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

        const teamAId = initializedTeams[0].id;
        const teamBId = initializedTeams[1].id;

        set({
          config: {
            ...config,
            teams: initializedTeams,
            teamAName: initializedTeams[0].name,
            teamBName: initializedTeams[1].name,
            teamAColor: initializedTeams[0].color,
            teamBColor: initializedTeams[1].color,
          },
          teams: initializedTeams,
          activeTeamIndex: 0,
          questionPool: fullPool,
          teamQuestionPools: teamPools,
          teamAQuestionPool: teamPools[teamAId] || {},
          teamBQuestionPool: teamPools[teamBId] || {},
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
          timerStartedAt: null,
          isTimerPaused: false,
          isTimeExpired: false,
        });
      },

      revealQuestion: () => {
        const state = get();
        if (state.isQuestionRevealed || state.isMatchFinished) return;

        // Determine current active question
        let currentQ: Question | undefined;
        if (state.isTieBreaker) {
          if (state.tieBreakerQuestions.length > 0) {
            currentQ = state.tieBreakerQuestions[state.tieBreakerQuestionIndex % state.tieBreakerQuestions.length];
          }
        } else {
          const activeSub = state.subjects[state.currentSubjectIndex];
          const activeTeam = state.teams[state.activeTeamIndex];
          const pool = activeTeam ? state.teamQuestionPools[activeTeam.id] : undefined;
          currentQ = pool?.[activeSub?.id]?.[state.currentQuestionIndex];
        }

        // Capture snapshot for Undo
        const snapshot: TurnSnapshot = {
          activeTeamIndex: state.activeTeamIndex,
          teams: state.teams.map((t) => ({ ...t })),
          teamTurn: state.teamTurn,
          subjectIndex: state.currentSubjectIndex,
          questionIndexInSubject: state.currentQuestionIndex,
          teamAScore: state.teams[0]?.score || 0,
          teamBScore: state.teams[1]?.score || 0,
          isQuestionRevealed: state.isQuestionRevealed,
          selectedOptionIndex: state.selectedOptionIndex,
          isAnswerSubmitted: state.isAnswerSubmitted,
          isTieBreaker: state.isTieBreaker,
          tieBreakerQuestionIndex: state.tieBreakerQuestionIndex,
          selectedMysteryBox: state.selectedMysteryBox,
          revealedQuestionIds: [...state.revealedQuestionIds],
          timerStartedAt: state.timerStartedAt,
          isTimeExpired: state.isTimeExpired,
        };

        const newRevealedIds = currentQ?.id
          ? Array.from(new Set([...state.revealedQuestionIds, currentQ.id]))
          : state.revealedQuestionIds;

        // Start timer if time limit configured
        const timeLimit = state.config?.timeLimitSeconds || 0;
        const now = timeLimit > 0 ? Date.now() : null;

        set({
          isQuestionRevealed: true,
          selectedOptionIndex: null,
          isAnswerSubmitted: false,
          revealedQuestionIds: newRevealedIds,
          timerStartedAt: now,
          isTimerPaused: false,
          isTimeExpired: false,
          historyStack: [...state.historyStack, snapshot],
        });
      },

      selectOption: (index: number) => {
        const state = get();
        if (!state.isQuestionRevealed || state.isAnswerSubmitted || state.isTimeExpired) return;
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
          const activeTeam = state.teams[state.activeTeamIndex];
          const pool = activeTeam ? state.teamQuestionPools[activeTeam.id] : undefined;
          currentQ = pool?.[activeSub?.id]?.[state.currentQuestionIndex];
        }

        if (!currentQ) return;

        // Capture snapshot before score & turn mutation for Undo
        const snapshot: TurnSnapshot = {
          activeTeamIndex: state.activeTeamIndex,
          teams: state.teams.map((t) => ({ ...t })),
          teamTurn: state.teamTurn,
          subjectIndex: state.currentSubjectIndex,
          questionIndexInSubject: state.currentQuestionIndex,
          teamAScore: state.teams[0]?.score || 0,
          teamBScore: state.teams[1]?.score || 0,
          isQuestionRevealed: state.isQuestionRevealed,
          selectedOptionIndex: state.selectedOptionIndex,
          isAnswerSubmitted: state.isAnswerSubmitted,
          isTieBreaker: state.isTieBreaker,
          tieBreakerQuestionIndex: state.tieBreakerQuestionIndex,
          selectedMysteryBox: state.selectedMysteryBox,
          revealedQuestionIds: [...state.revealedQuestionIds],
          timerStartedAt: state.timerStartedAt,
          isTimeExpired: state.isTimeExpired,
        };

        const isCorrect = state.selectedOptionIndex === currentQ.correct_index;
        const pointsAwarded = isCorrect ? state.config.pointsPerMcq : 0;

        // Update score for the active team
        const updatedTeams = state.teams.map((team, idx) =>
          idx === state.activeTeamIndex ? { ...team, score: team.score + pointsAwarded } : team
        );

        set({
          teams: updatedTeams,
          teamAScore: updatedTeams[0]?.score || 0,
          teamBScore: updatedTeams[1]?.score || 0,
          isAnswerSubmitted: true,
          timerStartedAt: null, // Stop timer
          isTimerPaused: false,
          historyStack: [...state.historyStack, snapshot],
        });

        // Automatically advance after a brief visual reveal on stage (1800ms)
        setTimeout(() => {
          const current = get();
          if (current.isAnswerSubmitted && !current.isMatchFinished) {
            get().nextTurn();
          }
        }, 1800);
      },

      nextTurn: () => {
        const state = get();
        if (!state.config || state.teams.length === 0) return;

        // ----------------------------------------------------
        // CASE 1: TIE-BREAKER (SUPER OVER SUDDEN DEATH)
        // ----------------------------------------------------
        if (state.isTieBreaker) {
          const nextTeamIdx = (state.activeTeamIndex + 1) % state.teams.length;

          if (nextTeamIdx !== 0) {
            // Next team's turn in sudden death
            set({
              activeTeamIndex: nextTeamIdx,
              teamTurn: nextTeamIdx === 0 ? 'TEAM_A' : 'TEAM_B',
              isQuestionRevealed: false,
              selectedOptionIndex: null,
              isAnswerSubmitted: false,
              selectedMysteryBox: null,
              timerStartedAt: null,
              isTimerPaused: false,
              isTimeExpired: false,
              tieBreakerQuestionIndex: state.tieBreakerQuestionIndex + 1,
            });
          } else {
            // Full sudden-death cycle finished for all teams!
            // Check if highest score is unique
            const sortedTeams = [...state.teams].sort((a, b) => b.score - a.score);
            const topScore = sortedTeams[0].score;
            const tiedForFirst = sortedTeams.filter((t) => t.score === topScore);

            if (tiedForFirst.length === 1) {
              // Tie broken!
              set({
                isMatchFinished: true,
                winnerName: sortedTeams[0].name,
                timerStartedAt: null,
                isTimerPaused: false,
                isTimeExpired: false,
              });
            } else {
              // Still tied! Advance to another sudden death cycle
              set({
                activeTeamIndex: 0,
                teamTurn: 'TEAM_A',
                isQuestionRevealed: false,
                selectedOptionIndex: null,
                isAnswerSubmitted: false,
                selectedMysteryBox: null,
                timerStartedAt: null,
                isTimerPaused: false,
                isTimeExpired: false,
                tieBreakerQuestionIndex: state.tieBreakerQuestionIndex + 1,
              });
            }
          }
          return;
        }

        // ----------------------------------------------------
        // CASE 2: REGULAR TOURNAMENT ROUND (Sequential Team Block)
        // Active team completes all questions for Subject K, then next team does, etc.
        // ----------------------------------------------------
        const activeSub = state.subjects[state.currentSubjectIndex];
        const subjectQuota =
          state.config.subjectQuestionCounts?.[activeSub?.id] || state.config.mcqsPerSubject || 2;

        const nextQuestionIdx = state.currentQuestionIndex + 1;

        if (nextQuestionIdx < subjectQuota) {
          // Active team still has questions remaining in this subject:
          // AUTO-REVEAL for smooth continuous stream within the same team's block.
          // The host only clicks 'Reveal' for Question 1; subsequent questions stream automatically.
          const activeTeam = state.teams[state.activeTeamIndex];
          const pool = activeTeam ? state.teamQuestionPools[activeTeam.id] : undefined;
          const nextQ = pool?.[activeSub?.id]?.[nextQuestionIdx];

          const newRevealedIds = nextQ?.id
            ? Array.from(new Set([...state.revealedQuestionIds, nextQ.id]))
            : state.revealedQuestionIds;

          const timeLimit = state.config?.timeLimitSeconds || 0;
          const now = timeLimit > 0 ? Date.now() : null;

          set({
            currentQuestionIndex: nextQuestionIdx,
            isQuestionRevealed: true,
            selectedOptionIndex: null,
            isAnswerSubmitted: false,
            revealedQuestionIds: newRevealedIds,
            timerStartedAt: now,
            isTimerPaused: false,
            isTimeExpired: false,
          });
        } else {
          // Active team finished all questions in this subject! Hand off to next team!
          const nextTeamIdx = state.activeTeamIndex + 1;

          if (nextTeamIdx < state.teams.length) {
            // Next team's turn in the current subject
            set({
              activeTeamIndex: nextTeamIdx,
              teamTurn: nextTeamIdx === 0 ? 'TEAM_A' : 'TEAM_B',
              currentQuestionIndex: 0,
              isQuestionRevealed: false,
              selectedOptionIndex: null,
              isAnswerSubmitted: false,
              timerStartedAt: null,
              isTimerPaused: false,
              isTimeExpired: false,
            });
          } else {
            // All teams finished all questions in this subject! Subject round complete!
            const nextSubjectIndex = state.currentSubjectIndex + 1;

            if (nextSubjectIndex < state.subjects.length) {
              // Advance to next subject round, restarting with Team 0
              set({
                currentSubjectIndex: nextSubjectIndex,
                activeTeamIndex: 0,
                teamTurn: 'TEAM_A',
                currentQuestionIndex: 0,
                isQuestionRevealed: false,
                selectedOptionIndex: null,
                isAnswerSubmitted: false,
                timerStartedAt: null,
                isTimerPaused: false,
                isTimeExpired: false,
              });
            } else {
              // All subjects exhausted! Check if top score is tied
              const sortedTeams = [...state.teams].sort((a, b) => b.score - a.score);
              const topScore = sortedTeams[0]?.score || 0;
              const tiedForFirst = sortedTeams.filter((t) => t.score === topScore);

              if (tiedForFirst.length > 1) {
                // Sudden Death Tie-Breaker
                set({
                  isTieBreaker: true,
                  activeTeamIndex: 0,
                  teamTurn: 'TEAM_A',
                  currentQuestionIndex: 0,
                  isQuestionRevealed: false,
                  selectedOptionIndex: null,
                  isAnswerSubmitted: false,
                  selectedMysteryBox: null,
                  timerStartedAt: null,
                  isTimerPaused: false,
                  isTimeExpired: false,
                  tieBreakerQuestionIndex: 0,
                });
              } else {
                // Match Won
                set({
                  isMatchFinished: true,
                  winnerName: sortedTeams[0]?.name || 'Champion',
                  timerStartedAt: null,
                  isTimerPaused: false,
                  isTimeExpired: false,
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
          activeTeamIndex: previousSnapshot.activeTeamIndex,
          teams: previousSnapshot.teams.map((t) => ({ ...t })),
          teamTurn: previousSnapshot.teamTurn || 'TEAM_A',
          currentSubjectIndex: previousSnapshot.subjectIndex,
          currentQuestionIndex: previousSnapshot.questionIndexInSubject,
          teamAScore: previousSnapshot.teams[0]?.score || 0,
          teamBScore: previousSnapshot.teams[1]?.score || 0,
          isQuestionRevealed: previousSnapshot.isQuestionRevealed,
          selectedOptionIndex: previousSnapshot.selectedOptionIndex,
          isAnswerSubmitted: previousSnapshot.isAnswerSubmitted,
          isTieBreaker: previousSnapshot.isTieBreaker,
          tieBreakerQuestionIndex: previousSnapshot.tieBreakerQuestionIndex,
          selectedMysteryBox: previousSnapshot.selectedMysteryBox ?? null,
          revealedQuestionIds: previousSnapshot.revealedQuestionIds,
          timerStartedAt: previousSnapshot.timerStartedAt,
          isTimeExpired: previousSnapshot.isTimeExpired,
          isTimerPaused: false,
          isMatchFinished: false,
          winnerName: null,
          historyStack: state.historyStack.slice(0, -1),
        });
      },

      finishMatch: () => {
        const state = get();
        if (state.isMatchFinished) return;

        const sortedTeams = [...state.teams].sort((a, b) => b.score - a.score);
        const winner = sortedTeams[0]?.name || 'Match Complete';

        set({
          isMatchFinished: true,
          winnerName: winner,
          timerStartedAt: null,
          isTimerPaused: false,
          isTimeExpired: false,
        });
      },

      resetMatch: () => {
        set({
          config: null,
          teams: [],
          activeTeamIndex: 0,
          questionPool: {},
          teamQuestionPools: {},
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
          timerStartedAt: null,
          isTimerPaused: false,
          isTimeExpired: false,
          isPostponed: false,
        });
      },

      postponeMatch: () => {
        set({ isTimerPaused: true, isPostponed: true });
      },

      startTimer: () => {
        set({
          timerStartedAt: Date.now(),
          isTimerPaused: false,
          isTimeExpired: false,
          isPostponed: false,
        });
      },

      pauseTimer: () => {
        set({ isTimerPaused: true });
      },

      resumeTimer: () => {
        set({ isTimerPaused: false, isPostponed: false });
      },

      expireTimer: () => {
        const state = get();
        if (!state.isQuestionRevealed || state.isAnswerSubmitted || state.isMatchFinished) return;

        // Capture snapshot before timeout mutation so Undo works seamlessly
        const snapshot: TurnSnapshot = {
          activeTeamIndex: state.activeTeamIndex,
          teams: state.teams.map((t) => ({ ...t })),
          teamTurn: state.teamTurn,
          subjectIndex: state.currentSubjectIndex,
          questionIndexInSubject: state.currentQuestionIndex,
          teamAScore: state.teams[0]?.score || 0,
          teamBScore: state.teams[1]?.score || 0,
          isQuestionRevealed: state.isQuestionRevealed,
          selectedOptionIndex: state.selectedOptionIndex,
          isAnswerSubmitted: state.isAnswerSubmitted,
          isTieBreaker: state.isTieBreaker,
          tieBreakerQuestionIndex: state.tieBreakerQuestionIndex,
          selectedMysteryBox: state.selectedMysteryBox,
          revealedQuestionIds: [...state.revealedQuestionIds],
          timerStartedAt: state.timerStartedAt,
          isTimeExpired: state.isTimeExpired,
        };

        // Automatically declare 0 points (scores unchanged) and advance to submitted state
        set({
          isTimeExpired: true,
          isAnswerSubmitted: true,
          timerStartedAt: null,
          isTimerPaused: false,
          historyStack: [...state.historyStack, snapshot],
        });
      },
    }),
    {
      name: 'pgc_arena_active_match',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
