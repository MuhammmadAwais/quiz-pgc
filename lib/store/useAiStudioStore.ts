import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StagedQuestion, StudioConfig, ReviewStatus } from '@/lib/types/studio';
import { lintQuestion } from '@/lib/utils/linter';

interface AiStudioStoreState {
  // Configuration
  config: StudioConfig;
  setConfig: (patch: Partial<StudioConfig>) => void;

  // Question Review State
  stagedQuestions: StagedQuestion[];
  activeCardIndex: number;
  editingQuestionId: string | null;

  // Generation Lifecycle
  isGenerating: boolean;
  error: string | null;

  // Simple Action Verbs
  setStagedQuestions: (questions: StagedQuestion[]) => void;
  acceptQuestion: (id: string) => void;
  acceptAll: () => void;
  rejectQuestion: (id: string) => void;
  rejectAll: () => void;
  resetQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<StagedQuestion>) => void;
  setActiveCardIndex: (index: number) => void;
  setEditingQuestionId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
}

const DEFAULT_CONFIG: StudioConfig = {
  selectedBookId: null,
  targetSubjectId: null,
  targetChapterId: null,
  startPage: 1,
  endPage: 5,
  count: 10,
  difficultyBias: 'BALANCED',
  cognitiveBias: 'MIXED',
  topicPrompt: '',
};

export const useAiStudioStore = create<AiStudioStoreState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      stagedQuestions: [],
      activeCardIndex: 0,
      editingQuestionId: null,
      isGenerating: false,
      error: null,

      setConfig: (patch) => {
        set((state) => ({
          config: { ...state.config, ...patch },
        }));
      },

      setStagedQuestions: (questions) => {
        // Run quality linter on every question
        const linted = questions.map((q) => {
          const report = lintQuestion(q.prompt, q.options, q.correct_option_index);
          return {
            ...q,
            reviewStatus: 'PENDING' as ReviewStatus,
            warnings: report.warnings,
          };
        });

        set({
          stagedQuestions: linted,
          activeCardIndex: 0,
          editingQuestionId: null,
          error: null,
        });
      },

      acceptQuestion: (id) => {
        set((state) => {
          const updated = state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'ACCEPTED' as ReviewStatus } : q
          );
          const nextIndex = Math.min(state.activeCardIndex + 1, updated.length - 1);
          return {
            stagedQuestions: updated,
            activeCardIndex: nextIndex,
            editingQuestionId: null,
          };
        });
      },

      acceptAll: () => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) => ({
            ...q,
            reviewStatus: 'ACCEPTED' as ReviewStatus,
          })),
        }));
      },

      rejectQuestion: (id) => {
        set((state) => {
          const updated = state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'REJECTED' as ReviewStatus } : q
          );
          const nextIndex = Math.min(state.activeCardIndex + 1, updated.length - 1);
          return {
            stagedQuestions: updated,
            activeCardIndex: nextIndex,
            editingQuestionId: null,
          };
        });
      },

      rejectAll: () => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) => ({
            ...q,
            reviewStatus: 'REJECTED' as ReviewStatus,
          })),
        }));
      },

      resetQuestion: (id) => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'PENDING' as ReviewStatus } : q
          ),
        }));
      },

      updateQuestion: (id, patch) => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) => {
            if (q.id !== id) return q;
            const merged = { ...q, ...patch };
            const report = lintQuestion(merged.prompt, merged.options, merged.correct_option_index);
            return { ...merged, warnings: report.warnings };
          }),
          editingQuestionId: null,
        }));
      },

      setActiveCardIndex: (index) => {
        const total = get().stagedQuestions.length;
        if (total === 0) {
          set({ activeCardIndex: 0 });
          return;
        }
        const clamped = Math.max(0, Math.min(index, total - 1));
        set({ activeCardIndex: clamped, editingQuestionId: null });
      },

      setEditingQuestionId: (id) => {
        set({ editingQuestionId: id });
      },

      setIsGenerating: (isGenerating) => {
        set({ isGenerating });
      },

      setError: (error) => {
        set({ error });
      },

      clearSession: () => {
        set({
          stagedQuestions: [],
          activeCardIndex: 0,
          editingQuestionId: null,
          error: null,
        });
      },
    }),
    {
      name: 'pgc_arena_ai_studio_vault',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        stagedQuestions: state.stagedQuestions,
        config: state.config,
      }),
    }
  )
);
