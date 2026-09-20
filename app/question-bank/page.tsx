'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Library,
  Layers,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { QuestionModal } from '@/components/question-bank/QuestionModal';
import { AiStudioModal } from '@/components/studio/AiStudioModal';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { Subject, Chapter, Question } from '@/lib/types/tournament';
import { Book } from '@/lib/types/books';
import { getBooks } from '@/lib/actions/books';
import {
  getSubjects,
  createSubject,
  deleteSubject,
} from '@/lib/actions/subjects';
import {
  getChapters,
  createChapter,
  deleteChapter,
} from '@/lib/actions/chapters';
import {
  getQuestions,
  deleteQuestion,
  seedSampleQuestions,
} from '@/lib/actions/questions';

export default function QuestionBankPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  // Books Bank & AI Studio state
  const [books, setBooks] = useState<Book[]>([]);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);
  const [selectedBookForAi, setSelectedBookForAi] = useState<Book | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subs, chaps, qs, bks] = await Promise.all([
        getSubjects(),
        getChapters(),
        getQuestions(),
        getBooks(),
      ]);
      setSubjects(subs);
      setChapters(chaps);
      setQuestions(qs);
      setBooks(bks);

      if (!selectedSubjectId && subs.length > 0) {
        setSelectedSubjectId(subs[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshBooks = async () => {
    const bks = await getBooks();
    setBooks(bks);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId);
  const filteredChapters = chapters.filter((c) => c.subject_id === selectedSubjectId);
  const activeChapter = filteredChapters.find((c) => c.id === selectedChapterId);

  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = !selectedSubjectId || q.subject_id === selectedSubjectId;
    const matchesChapter = !selectedChapterId || q.chapter_id === selectedChapterId;
    const matchesSearch =
      !searchQuery.trim() ||
      q.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.options.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSubject && matchesChapter && matchesSearch;
  });

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    startTransition(async () => {
      const res = await createSubject(newSubjectName);
      if (res.success) {
        setNewSubjectName('');
        setIsAddSubjectOpen(false);
        await loadData();
      }
    });
  };

  const handleDeleteSubject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this subject and all its chapters & questions?')) return;

    startTransition(async () => {
      await deleteSubject(id);
      if (selectedSubjectId === id) {
        setSelectedSubjectId(null);
        setSelectedChapterId(null);
      }
      await loadData();
    });
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim() || !selectedSubjectId) return;

    startTransition(async () => {
      const res = await createChapter(selectedSubjectId, newChapterName);
      if (res.success) {
        setNewChapterName('');
        setIsAddChapterOpen(false);
        await loadData();
      }
    });
  };

  const handleDeleteChapter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chapter and its questions?')) return;

    startTransition(async () => {
      await deleteChapter(id);
      if (selectedChapterId === id) setSelectedChapterId(null);
      await loadData();
    });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    startTransition(async () => {
      await deleteQuestion(id);
      await loadData();
    });
  };

  const handleSeedQuick = async () => {
    setSeedLoading(true);
    try {
      await seedSampleQuestions();
      await loadData();
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-obsidian flex flex-col">
      {/* Top Action Header */}
      <div className="bg-surface-onyx border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-optic-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-team-a-bright" />
              <span>QUESTION BANK MANAGEMENT</span>
            </h1>
            <p className="text-xs text-text-muted-slate mt-0.5">
              Hierarchical bank: Subjects → Chapters / Topics → Multiple Choice Questions
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Books Bank Dedicated Page Link */}
            <Link href="/books-bank">
              <Button
                variant="console"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <Library className="w-4 h-4 text-team-b-cyan" />
                <span>Books Bank ({books.length})</span>
              </Button>
            </Link>

            {/* AI Generator Trigger */}
            <Button
              variant="team-b"
              size="sm"
              onClick={() => {
                setSelectedBookForAi(null);
                setIsAiStudioOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate with AI</span>
            </Button>

            {questions.length === 0 && (
              <Button
                variant="team-b"
                size="sm"
                onClick={handleSeedQuick}
                disabled={seedLoading}
              >
                <Sparkles className="w-4 h-4" />
                <span>{seedLoading ? 'Loading Sample MCQs...' : 'Seed Sample MCQs'}</span>
              </Button>
            )}

            <Button
              variant="team-a"
              size="sm"
              onClick={() => {
                setEditingQuestion(null);
                setIsQuestionModalOpen(true);
              }}
              disabled={subjects.length === 0}
            >
              <Plus className="w-4 h-4" />
              <span>New Question</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3-Pane Main Interface */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Pane 1: Subjects (3 cols) */}
        <div className="md:col-span-3 flex flex-col h-full">
          <Card variant="carbon" className="flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-team-a-bright" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                  Subjects ({subjects.length})
                </span>
              </div>
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="p-1 rounded hover:bg-surface-interactive text-text-bright-slate hover:text-team-a-bright transition-colors"
                title="Add Subject"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Subjects List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[70vh] pr-1">
              {subjects.length === 0 ? (
                <p className="text-xs text-text-muted-slate p-3 text-center">
                  No subjects created yet.
                </p>
              ) : (
                subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubjectId(sub.id);
                        setSelectedChapterId(null);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-team-a-core/15 border border-team-a-core text-optic-white shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                          : 'bg-surface-onyx border border-white/8 hover:bg-surface-interactive text-text-bright-slate'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-xs truncate">{sub.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                          {sub.question_count || 0}
                        </Badge>
                        <button
                          onClick={(e) => handleDeleteSubject(sub.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted-slate hover:text-state-warning-rose transition-all"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Pane 2: Chapters / Topics (3 cols) */}
        <div className="md:col-span-3 flex flex-col h-full">
          <Card variant="carbon" className="flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-team-b-cyan" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white truncate">
                  {activeSubject ? activeSubject.name : 'Chapters'}
                </span>
              </div>
              {selectedSubjectId && (
                <button
                  onClick={() => setIsAddChapterOpen(true)}
                  className="p-1 rounded hover:bg-surface-interactive text-text-bright-slate hover:text-team-b-cyan transition-colors"
                  title="Add Chapter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chapters List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[70vh] pr-1">
              {!selectedSubjectId ? (
                <p className="text-xs text-text-muted-slate p-3 text-center">
                  Select a subject on the left.
                </p>
              ) : filteredChapters.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-xs text-text-muted-slate mb-2">No chapters yet.</p>
                  <Button
                    variant="console"
                    size="sm"
                    onClick={() => setIsAddChapterOpen(true)}
                    className="text-xs"
                  >
                    Add First Chapter
                  </Button>
                </div>
              ) : (
                <>
                  {/* "All Chapters" Option */}
                  <div
                    onClick={() => setSelectedChapterId(null)}
                    className={`flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all ${
                      selectedChapterId === null
                        ? 'bg-team-b-cyan/15 border border-team-b-cyan text-optic-white'
                        : 'bg-surface-onyx border border-white/8 hover:bg-surface-interactive text-text-muted-slate'
                    }`}
                  >
                    <span className="font-medium text-xs font-mono uppercase">
                      All Topics
                    </span>
                    <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                      {questions.filter((q) => q.subject_id === selectedSubjectId).length}
                    </Badge>
                  </div>

                  {filteredChapters.map((chap) => {
                    const isSelected = selectedChapterId === chap.id;

                    return (
                      <div
                        key={chap.id}
                        onClick={() => setSelectedChapterId(chap.id)}
                        className={`group flex items-center justify-between p-2.5 rounded-md cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-team-b-cyan/15 border border-team-b-cyan text-optic-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                            : 'bg-surface-onyx border border-white/8 hover:bg-surface-interactive text-text-bright-slate'
                        }`}
                      >
                        <span className="font-medium text-xs truncate">{chap.name}</span>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="neutral" className="text-[10px] px-1.5 py-0">
                            {chap.question_count || 0}
                          </Badge>
                          <button
                            onClick={(e) => handleDeleteChapter(chap.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted-slate hover:text-state-warning-rose transition-all"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Pane 3: Questions List (6 cols) */}
        <div className="md:col-span-6 flex flex-col h-full">
          <Card variant="carbon" className="flex-1 flex flex-col p-4">
            {/* Header & Search */}
            <div className="pb-3 border-b border-white/10 mb-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-team-a-bright" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                    Questions ({filteredQuestions.length})
                  </span>
                </div>

                {activeChapter && (
                  <Badge variant="team-b" className="text-[10px]">
                    Topic: {activeChapter.name}
                  </Badge>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted-slate" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or options..."
                  className="w-full bg-surface-obsidian border border-white/15 rounded-md pl-9 pr-3 py-1.5 text-xs text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-team-a-core"
                />
              </div>
            </div>

            {/* Questions Scroll Area */}
            <div className="space-y-3 overflow-y-auto max-h-[66vh] pr-1">
              {filteredQuestions.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-lg">
                  <HelpCircle className="w-8 h-8 text-text-muted-slate mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-text-muted-slate mb-3">
                    No questions match the current filters.
                  </p>
                  <Button
                    variant="team-a"
                    size="sm"
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsQuestionModalOpen(true);
                    }}
                    disabled={subjects.length === 0}
                  >
                    Create First Question
                  </Button>
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-lg bg-surface-onyx border border-white/10 hover:border-white/20 transition-all group space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-xs text-team-a-bright font-bold mt-0.5">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <div className="text-sm font-medium text-optic-white leading-relaxed">
                          <MathRenderer content={q.text} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setIsQuestionModalOpen(true);
                          }}
                          className="p-1 text-text-muted-slate hover:text-team-a-bright rounded transition-colors"
                          title="Edit Question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-text-muted-slate hover:text-state-warning-rose rounded transition-colors"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Options 2x2 Preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct_index === oIdx;
                        const letter = ['A', 'B', 'C', 'D'][oIdx];

                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                              isCorrect
                                ? 'bg-state-success/15 border border-state-success/40 text-state-success font-medium'
                                : 'bg-surface-carbon/80 border border-white/5 text-text-bright-slate'
                            }`}
                          >
                            <span className="font-mono font-bold text-[11px] opacity-70">
                              [{letter}]
                            </span>
                            <span className="truncate">
                              <MathRenderer content={opt} inline />
                            </span>
                            {isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        title="Add New Subject"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g. Computer Science, Physics, Chemistry"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="console"
              size="sm"
              onClick={() => setIsAddSubjectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="team-a"
              size="sm"
              disabled={isPending || !newSubjectName.trim()}
            >
              Add Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal
        isOpen={isAddChapterOpen}
        onClose={() => setIsAddChapterOpen(false)}
        title={`Add Chapter to ${activeSubject?.name || 'Subject'}`}
      >
        <form onSubmit={handleAddChapter} className="space-y-4">
          <Input
            label="Chapter / Topic Name"
            placeholder="e.g. Thermodynamics, Data Structures, Calculus"
            value={newChapterName}
            onChange={(e) => setNewChapterName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <Button
              type="button"
              variant="console"
              size="sm"
              onClick={() => setIsAddChapterOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="team-b"
              size="sm"
              disabled={isPending || !newChapterName.trim()}
            >
              Add Chapter
            </Button>
          </div>
        </form>
      </Modal>

      {/* Question Modal (Create/Edit) */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        subjects={subjects}
        chapters={chapters}
        selectedSubjectId={selectedSubjectId || undefined}
        selectedChapterId={selectedChapterId || undefined}
        editingQuestion={editingQuestion}
        onSuccess={loadData}
      />

      {/* AI Studio Modal */}
      <AiStudioModal
        isOpen={isAiStudioOpen}
        onClose={() => setIsAiStudioOpen(false)}
        subjects={subjects}
        chapters={chapters}
        books={books}
        initialBookId={selectedBookForAi?.id}
        onOpenBooksBank={() => {
          setIsAiStudioOpen(false);
          router.push('/books-bank');
        }}
        onSuccess={loadData}
      />
    </div>
  );
}
