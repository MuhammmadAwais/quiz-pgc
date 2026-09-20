import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { StagedQuestion, StudioConfig, ReviewStatus } from '@/lib/types/studio';

interface AiStudioStoreState {
  // Configuration
  config: StudioConfig;
  setConfig: (patch: Partial<StudioConfig>) => void;

  // Staging Deck
  stagedQuestions: StagedQuestion[];
  activeCardIndex: number;
  editingQuestionId: string | null;

  // Lifecycle & Status
  isGenerating: boolean;
  error: string | null;

  // Actions
  setStagedQuestions: (questions: StagedQuestion[]) => void;
  approveQuestion: (id: string) => void;
  approveAll: () => void;
  discardQuestion: (id: string) => void;
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
        set({
          stagedQuestions: questions,
          activeCardIndex: 0,
          editingQuestionId: null,
          error: null,
        });
      },

      approveQuestion: (id) => {
        set((state) => {
          const updated = state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'APPROVED' as ReviewStatus } : q
          );
          const nextIndex = Math.min(state.activeCardIndex + 1, updated.length - 1);
          return {
            stagedQuestions: updated,
            activeCardIndex: nextIndex,
            editingQuestionId: null,
          };
        });
      },

      approveAll: () => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) => ({
            ...q,
            reviewStatus: 'APPROVED' as ReviewStatus,
          })),
        }));
      },

      discardQuestion: (id) => {
        set((state) => {
          const updated = state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'DISCARDED' as ReviewStatus } : q
          );
          const nextIndex = Math.min(state.activeCardIndex + 1, updated.length - 1);
          return {
            stagedQuestions: updated,
            activeCardIndex: nextIndex,
            editingQuestionId: null,
          };
        });
      },

      resetQuestion: (id) => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, reviewStatus: 'INBOX' as ReviewStatus } : q
          ),
        }));
      },

      updateQuestion: (id, patch) => {
        set((state) => ({
          stagedQuestions: state.stagedQuestions.map((q) =>
            q.id === id ? { ...q, ...patch } : q
          ),
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
