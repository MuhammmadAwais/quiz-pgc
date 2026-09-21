'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Layers,
  Settings2,
  Loader2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Subject, Chapter } from '@/lib/types/tournament';
import { Book } from '@/lib/types/books';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';
import { PdfPagePreviewCard } from './PdfPagePreviewCard';
import { RapidReviewDeck } from './RapidReviewDeck';
import { QuestionCardSkeleton } from '@/components/ui/Skeleton';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  chapters: Chapter[];
  books: Book[];
  initialBookId?: string | null;
  onOpenBooksBank: () => void;
  onSuccess: () => Promise<void>;
}

export function AiStudioModal({
  isOpen,
  onClose,
  subjects,
  chapters,
  books,
  initialBookId,
  onOpenBooksBank,
  onSuccess,
}: AiStudioModalProps) {
  const {
    config,
    setConfig,
    stagedQuestions,
    setStagedQuestions,
    isGenerating,
    setIsGenerating,
    error,
    setError,
    clearSession,
  } = useAiStudioStore();

  const [activeTab, setActiveTab] = useState<'SETUP' | 'REVIEW'>('SETUP');

  // Initialize selected book
  useEffect(() => {
    if (initialBookId) {
      const book = books.find((b) => b.id === initialBookId);
      if (book) {
        setConfig({
          selectedBookId: book.id,
          endPage: Math.min(config.startPage + 4, book.page_count || 10),
        });
      }
    } else if (!config.selectedBookId && books.length > 0) {
      setConfig({
        selectedBookId: books[0].id,
        endPage: Math.min(5, books[0].page_count || 10),
      });
    }
  }, [initialBookId, books]);

  // Set default target subject and chapter if not set
  useEffect(() => {
    if (!config.targetSubjectId && subjects.length > 0) {
      const firstSub = subjects[0];
      const subChaps = chapters.filter((c) => c.subject_id === firstSub.id);
      setConfig({
        targetSubjectId: firstSub.id,
        targetChapterId: subChaps.length > 0 ? subChaps[0].id : null,
      });
    }
  }, [subjects, chapters, config.targetSubjectId]);

  // Auto-switch to review tab if uncommitted questions exist
  useEffect(() => {
    if (stagedQuestions.length > 0) {
      setActiveTab('REVIEW');
    }
  }, [stagedQuestions.length]);

  if (!isOpen) return null;

  const selectedBook = books.find((b) => b.id === config.selectedBookId) || books[0] || null;
  const filteredChapters = chapters.filter((c) => c.subject_id === config.targetSubjectId);
  const activeSubject = subjects.find((s) => s.id === config.targetSubjectId);
  const activeChapter = chapters.find((c) => c.id === config.targetChapterId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      setError('Please select a textbook to generate from.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: selectedBook.file_url,
          startPage: config.startPage,
          endPage: config.endPage,
          count: config.count,
          difficultyBias: config.difficultyBias,
          cognitiveBias: config.cognitiveBias,
          topicPrompt: config.topicPrompt.trim() || undefined,
          targetSubjectName: activeSubject?.name,
          targetChapterName: activeChapter?.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions.');
      }

      setStagedQuestions(data.questions);
      setActiveTab('REVIEW');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err?.message || 'Error occurred during generation. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDone = async () => {
    await onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-obsidian/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl bg-surface-carbon border border-border-medium rounded-2xl shadow-2xl flex flex-col max-h-[92vh] z-10 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-onyx border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-team-a-core/15 border border-team-a-core/30 flex items-center justify-center text-team-a-bright">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono uppercase tracking-wider text-optic-white flex items-center gap-2">
                <span>Create Questions with AI</span>
              </h2>
              <p className="text-xs text-text-muted-slate">
                Generate multiple-choice questions directly from your textbooks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Nav Tabs */}
            <div className="flex items-center bg-surface-interactive border border-white/10 rounded-lg p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTab('SETUP')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  activeTab === 'SETUP'
                    ? 'bg-team-a-core text-optic-white font-bold'
                    : 'text-text-muted-slate hover:text-optic-white'
                }`}
              >
                1. Settings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('REVIEW')}
                disabled={stagedQuestions.length === 0}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-30 ${
                  activeTab === 'REVIEW'
                    ? 'bg-team-a-core text-optic-white font-bold'
                    : 'text-text-muted-slate hover:text-optic-white'
                }`}
              >
                2. Review Questions ({stagedQuestions.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-text-muted-slate hover:text-optic-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isGenerating ? (
            <div className="py-12 px-4 space-y-6 animate-fade-in text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-team-a-core/15 border border-team-a-core/40 shadow-[0_0_32px_rgba(139,92,246,0.35)] mb-1">
                <Sparkles className="w-8 h-8 text-team-a-bright animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold font-mono text-optic-white">
                  Reading Textbook &amp; Synthesizing MCQs
                </h3>
                <p className="text-xs text-text-muted-slate font-mono max-w-md mx-auto leading-relaxed">
                  Extracting pages {config.startPage}–{config.endPage} from {selectedBook?.title || 'textbook'} • Slicing PDF server-side and enforcing anti-hallucination validation...
                </p>
              </div>

              <div className="space-y-3 text-left pt-2">
                <QuestionCardSkeleton />
                <QuestionCardSkeleton />
              </div>
            </div>
          ) : activeTab === 'SETUP' ? (
            <form onSubmit={handleGenerate} className="space-y-6 max-w-4xl mx-auto">
              {/* Resumed Session Hint */}
              {stagedQuestions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-team-b-cyan/10 border border-team-b-cyan/30 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-team-b-cyan">
                    <RefreshCw className="w-4 h-4" />
                    <span>
                      You have <strong>{stagedQuestions.length} questions</strong> waiting for review.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => clearSession()}
                      className="px-2.5 py-1 rounded bg-surface-interactive hover:bg-white/10 text-text-muted-slate hover:text-state-warning-rose font-mono text-[11px]"
                    >
                      Clear Them
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('REVIEW')}
                      className="px-3 py-1 rounded bg-team-b-cyan text-surface-obsidian font-mono font-bold text-[11px]"
                    >
                      Review Questions ➔
                    </button>
                  </div>
                </div>
              )}

              {/* 1. Textbook Selection & Books Bank Integration */}
              <div className="p-4 rounded-xl bg-surface-onyx border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-team-b-cyan" />
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white">
                      Select Textbook:
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenBooksBank}
                    className="text-xs text-team-b-cyan hover:underline font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload New Book</span>
                  </button>
                </div>

                {books.length === 0 ? (
                  <div className="p-4 border border-dashed border-white/15 rounded-xl text-center space-y-2">
                    <p className="text-xs text-text-muted-slate">No textbooks available in Books Bank.</p>
                    <button
                      type="button"
                      onClick={onOpenBooksBank}
                      className="px-3 py-1.5 rounded-lg bg-team-b-cyan text-surface-obsidian text-xs font-mono font-bold"
                    >
                      Upload First Textbook
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={config.selectedBookId || ''}
                      onChange={(e) => {
                        const bId = e.target.value;
                        const b = books.find((x) => x.id === bId);
                        setConfig({
                          selectedBookId: bId,
                          startPage: 1,
                          endPage: Math.min(5, b?.page_count || 10),
                        });
                      }}
                      className="w-full bg-surface-carbon border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white focus:outline-none focus:border-team-b-cyan font-mono"
                    >
                      {books.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} ({b.page_count} pages) {b.subject_tags?.length ? `• [${b.subject_tags.join(', ')}]` : ''}
                        </option>
                      ))}
                    </select>

                    {selectedBook && selectedBook.subject_tags && selectedBook.subject_tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-text-muted-slate">
                        <span className="font-mono">Tags:</span>
                        {selectedBook.subject_tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-surface-interactive border border-white/10 text-team-b-cyan font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Page Range Selector */}
              {selectedBook && (
                <div className="p-4 rounded-xl bg-surface-onyx border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white">
                      Pages to Read from Book:
                    </span>
                    <span className="text-xs text-team-b-cyan font-mono font-bold">
                      {config.endPage - config.startPage + 1} Pages Selected
                    </span>
                  </div>

                  <PdfPagePreviewCard
                    fileUrl={selectedBook.file_url}
                    startPage={config.startPage}
                    endPage={config.endPage}
                    totalPages={selectedBook.page_count}
                    onStartPageChange={(p) => setConfig({ startPage: p })}
                    onEndPageChange={(p) => setConfig({ endPage: p })}
                  />
                </div>
              )}

              {/* 3. Target Subject & Chapter (Where to save after review) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-onyx border border-white/10">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-team-a-bright" />
                    <span>Target Subject:</span>
                  </label>
                  <select
                    value={config.targetSubjectId || ''}
                    onChange={(e) => {
                      const sId = e.target.value;
                      const subChaps = chapters.filter((c) => c.subject_id === sId);
                      setConfig({
                        targetSubjectId: sId,
                        targetChapterId: subChaps.length > 0 ? subChaps[0].id : null,
                      });
                    }}
                    required
                    className="w-full bg-surface-carbon border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white focus:outline-none focus:border-team-a-core"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-team-b-cyan" />
                    <span>Target Chapter / Topic:</span>
                  </label>
                  <select
                    value={config.targetChapterId || ''}
                    onChange={(e) => setConfig({ targetChapterId: e.target.value })}
                    required
                    disabled={!config.targetSubjectId || filteredChapters.length === 0}
                    className="w-full bg-surface-carbon border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white focus:outline-none focus:border-team-a-core disabled:opacity-40"
                  >
                    {filteredChapters.map((chap) => (
                      <option key={chap.id} value={chap.id}>
                        {chap.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Generation Constraints: Topic, Count, Difficulty, Cognitive */}
              <div className="p-4 rounded-xl bg-surface-onyx border border-white/10 space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-team-a-bright" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white">
                    Question Settings
                  </span>
                </div>

                {/* Topic Prompt */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-text-muted-slate">
                    Topic or Focus Area (Optional):
                  </label>
                  <input
                    type="text"
                    value={config.topicPrompt}
                    onChange={(e) => setConfig({ topicPrompt: e.target.value })}
                    placeholder="e.g. Projectile Motion, Laws of Motion, Work and Energy"
                    className="w-full bg-surface-carbon border border-white/15 rounded-lg px-3 py-2 text-xs text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-team-a-core"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Count */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-text-muted-slate">
                      Number of Questions:
                    </label>
                    <select
                      value={config.count}
                      onChange={(e) => setConfig({ count: Number(e.target.value) })}
                      className="w-full bg-surface-carbon border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-team-a-core"
                    >
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={20}>20 Questions</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-text-muted-slate">
                      Difficulty Level:
                    </label>
                    <select
                      value={config.difficultyBias}
                      onChange={(e) => setConfig({ difficultyBias: e.target.value as any })}
                      className="w-full bg-surface-carbon border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-team-a-core"
                    >
                      <option value="BALANCED">Mixed (Balanced)</option>
                      <option value="EASY">Easy (Foundational)</option>
                      <option value="MEDIUM">Medium (Standard)</option>
                      <option value="HARD">Hard (Advanced)</option>
                    </select>
                  </div>

                  {/* Cognitive */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-text-muted-slate">
                      Question Type:
                    </label>
                    <select
                      value={config.cognitiveBias}
                      onChange={(e) => setConfig({ cognitiveBias: e.target.value as any })}
                      className="w-full bg-surface-carbon border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-team-a-core"
                    >
                      <option value="MIXED">Mixed Balance</option>
                      <option value="KNOWLEDGE">Facts &amp; Definitions</option>
                      <option value="CONCEPTUAL">Concepts &amp; Principles</option>
                      <option value="APPLICATION">Formulas &amp; Math</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-surface-interactive text-text-muted-slate hover:text-optic-white text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGenerating || !selectedBook}
                  className="px-6 py-2.5 rounded-xl bg-team-a-core hover:bg-team-a-core/90 disabled:opacity-40 text-optic-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-team-a-core/25 hover:scale-[1.02]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reading Book &amp; Generating {config.count} Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {config.count} Questions with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Review Deck View */
            <RapidReviewDeck
              subjects={subjects}
              chapters={chapters}
              onSaveSuccess={handleSaveDone}
            />
          )}
        </div>
      </div>
    </div>
  );
}
