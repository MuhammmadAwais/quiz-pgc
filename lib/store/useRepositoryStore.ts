import { create } from 'zustand';
import { Subject, Chapter, Question } from '@/lib/types/tournament';
import { Book } from '@/lib/types/books';
import { getSubjects } from '@/lib/actions/subjects';
import { getChapters } from '@/lib/actions/chapters';
import { getQuestions } from '@/lib/actions/questions';
import { getBooks } from '@/lib/actions/books';

interface RepositoryState {
  subjects: Subject[];
  chapters: Chapter[];
  questions: Question[];
  books: Book[];
  isLoaded: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;

  // Actions
  loadRepo: (force?: boolean) => Promise<void>;
  refreshRepo: () => Promise<void>;

  // Optimistic Cache Mutations
  addSubject: (subject: Subject) => void;
  removeSubject: (subjectId: string) => void;

  addChapter: (chapter: Chapter) => void;
  removeChapter: (chapterId: string) => void;

  addQuestion: (question: Question) => void;
  updateQuestion: (question: Question) => void;
  removeQuestion: (questionId: string) => void;
  addQuestionsBatch: (newQuestions: Question[]) => void;

  addBook: (book: Book) => void;
  updateBook: (book: Book) => void;
  removeBook: (bookId: string) => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  subjects: [],
  chapters: [],
  questions: [],
  books: [],
  isLoaded: false,
  isLoading: false,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,

  loadRepo: async (force = false) => {
    const { isLoaded, isLoading } = get();
    if (isLoaded && !force) return;
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const [subs, chaps, qs, bks] = await Promise.all([
        getSubjects(),
        getChapters(),
        getQuestions(),
        getBooks(),
      ]);

      set({
        subjects: subs,
        chapters: chaps,
        questions: qs,
        books: bks,
        isLoaded: true,
        isLoading: false,
        lastSyncedAt: Date.now(),
        error: null,
      });
    } catch (err: unknown) {
      console.error('Failed to load repository store:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch repository data';
      set({ isLoading: false, error: message });
    }
  },

  refreshRepo: async () => {
    set({ isSyncing: true, error: null });

    try {
      const [subs, chaps, qs, bks] = await Promise.all([
        getSubjects(),
        getChapters(),
        getQuestions(),
        getBooks(),
      ]);

      set({
        subjects: subs,
        chapters: chaps,
        questions: qs,
        books: bks,
        isLoaded: true,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        error: null,
      });
    } catch (err: unknown) {
      console.error('Failed to sync repository store:', err);
      const message = err instanceof Error ? err.message : 'Sync failed';
      set({ isSyncing: false, error: message });
    }
  },

  addSubject: (subject) => {
    set((state) => ({
      subjects: [subject, ...state.subjects],
    }));
  },

  removeSubject: (subjectId) => {
    set((state) => ({
      subjects: state.subjects.filter((s) => s.id !== subjectId),
      chapters: state.chapters.filter((c) => c.subject_id !== subjectId),
      questions: state.questions.filter((q) => q.subject_id !== subjectId),
    }));
  },

  addChapter: (chapter) => {
    set((state) => ({
      chapters: [...state.chapters, chapter],
    }));
  },

  removeChapter: (chapterId) => {
    set((state) => ({
      chapters: state.chapters.filter((c) => c.id !== chapterId),
      questions: state.questions.filter((q) => q.chapter_id !== chapterId),
    }));
  },

  addQuestion: (question) => {
    set((state) => ({
      questions: [question, ...state.questions],
    }));
  },

  updateQuestion: (question) => {
    set((state) => ({
      questions: state.questions.map((q) => (q.id === question.id ? question : q)),
    }));
  },

  removeQuestion: (questionId) => {
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== questionId),
    }));
  },

  addQuestionsBatch: (newQuestions) => {
    set((state) => ({
      questions: [...newQuestions, ...state.questions],
    }));
  },

  addBook: (book) => {
    set((state) => ({
      books: [book, ...state.books],
    }));
  },

  updateBook: (book) => {
    set((state) => ({
      books: state.books.map((b) => (b.id === book.id ? book : b)),
    }));
  },

  removeBook: (bookId) => {
    set((state) => ({
      books: state.books.filter((b) => b.id !== bookId),
    }));
  },
}));
