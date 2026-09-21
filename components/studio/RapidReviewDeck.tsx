'use client';

import React, { useEffect } from 'react';
import {
  Check,
  CheckCheck,
  X,
  XCircle,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Subject, Chapter } from '@/lib/types/tournament';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';
import { ReviewCard } from './ReviewCard';
import { ReviewCardEditMode } from './ReviewCardEditMode';
import { ReviewProgressRail } from './ReviewProgressRail';
import { StudioStickyFooter } from './StudioStickyFooter';

interface RapidReviewDeckProps {
  subjects: Subject[];
  chapters: Chapter[];
  onSaveSuccess?: () => void;
  onCommitSuccess?: () => void;
}

export function RapidReviewDeck({
  subjects,
  chapters,
  onSaveSuccess,
  onCommitSuccess,
}: RapidReviewDeckProps) {
  const {
    stagedQuestions,
    activeCardIndex,
    setActiveCardIndex,
    editingQuestionId,
    setEditingQuestionId,
    acceptQuestion,
    acceptAll,
    rejectQuestion,
    rejectAll,
    resetQuestion,
  } = useAiStudioStore();

  const activeQuestion = stagedQuestions[activeCardIndex];

  // Keyboard Shortcuts: Enter = Accept, Backspace = Reject, E = Edit, Arrows = Nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        editingQuestionId !== null
      ) {
        return;
      }

      if (!activeQuestion) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        acceptQuestion(activeQuestion.id);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        rejectQuestion(activeQuestion.id);
      } else if (e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setEditingQuestionId(activeQuestion.id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveCardIndex(activeCardIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveCardIndex(activeCardIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeQuestion,
    activeCardIndex,
    editingQuestionId,
    acceptQuestion,
    rejectQuestion,
    setActiveCardIndex,
    setEditingQuestionId,
  ]);

  if (stagedQuestions.length === 0) return null;

  return (
    <section className="space-y-4 font-sans animate-fade-in">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-surface-onyx border border-white/10 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-team-b-cyan/15 border border-team-b-cyan/30 flex items-center justify-center text-team-b-cyan shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-optic-white flex items-center gap-2">
              <span>Review Generated Questions</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-interactive border border-white/10 text-team-b-cyan font-bold">
                {stagedQuestions.length}
              </span>
            </h2>
            <p className="text-xs text-text-muted-slate mt-0.5">
              Accept good questions, reject or edit any that look off, then save them to Question Bank.
            </p>
          </div>
        </div>

        {/* Shortcuts & Bulk Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-text-muted-slate font-mono mr-1">
            <span className="opacity-70">Shortcuts:</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">↵ Accept</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">⌫ Reject</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">E Edit</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={rejectAll}
              className="h-9 px-3.5 rounded-xl bg-surface-interactive hover:bg-state-warning-rose/20 border border-white/10 hover:border-state-warning-rose/40 text-text-muted-slate hover:text-state-warning-rose text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reject all questions in this batch"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject All</span>
            </button>

            <button
              type="button"
              onClick={acceptAll}
              className="h-9 px-4 rounded-xl bg-state-success/20 hover:bg-state-success/30 border border-state-success/40 text-state-success text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
              title="Accept all questions at once"
            >
              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Accept All ({stagedQuestions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column: Left (Progress Rail) | Right (Active Card) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start pb-24">
        <ReviewProgressRail />

        <div className="flex-1 min-w-0 w-full space-y-4">
          {activeQuestion && (
            <>
              {editingQuestionId === activeQuestion.id ? (
                <ReviewCardEditMode
                  question={activeQuestion}
                  index={activeCardIndex}
                />
              ) : (
                <ReviewCard
                  question={activeQuestion}
                  index={activeCardIndex}
                  total={stagedQuestions.length}
                />
              )}

              {/* Card Action Controls Bar */}
              <div className="p-2.5 rounded-2xl bg-surface-onyx border border-white/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-lg">
                {/* Steppers */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCardIndex(activeCardIndex - 1)}
                    disabled={activeCardIndex === 0}
                    className="h-9 px-3 rounded-xl bg-surface-interactive hover:bg-white/10 disabled:opacity-30 text-xs font-semibold text-optic-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-text-muted-slate px-2">
                    {activeCardIndex + 1} / {stagedQuestions.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveCardIndex(activeCardIndex + 1)}
                    disabled={activeCardIndex === stagedQuestions.length - 1}
                    className="h-9 px-3 rounded-xl bg-surface-interactive hover:bg-white/10 disabled:opacity-30 text-xs font-semibold text-optic-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeQuestion.reviewStatus !== 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => resetQuestion(activeQuestion.id)}
                      className="h-9 px-3 rounded-xl bg-surface-interactive hover:bg-white/10 text-xs font-semibold text-text-muted-slate hover:text-optic-white flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Reset status back to Needs Review"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => rejectQuestion(activeQuestion.id)}
                    className="h-9 px-3.5 rounded-xl bg-state-warning-rose/15 hover:bg-state-warning-rose/25 border border-state-warning-rose/30 text-state-warning-rose text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject (⌫)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingQuestionId(
                        editingQuestionId === activeQuestion.id ? null : activeQuestion.id
                      )
                    }
                    className="h-9 px-3.5 rounded-xl bg-surface-interactive hover:bg-white/10 border border-white/10 text-optic-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-team-b-cyan" />
                    <span>
                      {editingQuestionId === activeQuestion.id ? 'Close Edit' : 'Edit (E)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => acceptQuestion(activeQuestion.id)}
                    className="h-9 px-4 rounded-xl bg-state-success hover:bg-state-success/90 text-surface-obsidian text-xs font-bold flex items-center gap-1.5 shadow-md shadow-state-success/20 transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Accept &amp; Next (↵)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Bottom Save Footer */}
      <StudioStickyFooter
        subjects={subjects}
        chapters={chapters}
        onSaveSuccess={onSaveSuccess || onCommitSuccess || (() => {})}
      />
    </section>
  );
}
