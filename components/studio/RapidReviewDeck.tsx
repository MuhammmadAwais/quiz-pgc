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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-onyx border border-white/10 p-4 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-team-b-cyan/15 border border-team-b-cyan/30 flex items-center justify-center text-team-b-cyan">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-optic-white">
              Review Generated Questions ({stagedQuestions.length})
            </h2>
            <p className="text-xs text-text-muted-slate font-sans">
              Accept good questions, reject or edit any that look off, then save them to your Question Bank.
            </p>
          </div>
        </div>

        {/* Shortcuts & Bulk Accept/Reject Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-text-muted-slate font-mono mr-1">
            <span>Shortcuts:</span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">
              ↵ Accept
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">
              ⌫ Reject
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-interactive text-text-bright-slate font-bold">
              E Edit
            </span>
          </div>

          <button
            type="button"
            onClick={rejectAll}
            className="px-3.5 py-2 rounded-xl bg-state-warning-rose/15 hover:bg-state-warning-rose/25 border border-state-warning-rose/30 text-state-warning-rose text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            title="Reject all questions in this batch"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject All</span>
          </button>

          <button
            type="button"
            onClick={acceptAll}
            className="px-4 py-2 rounded-xl bg-state-success/15 hover:bg-state-success/25 border border-state-success/30 text-state-success text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            title="Accept all questions at once"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Accept All ({stagedQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* 2-Column: Left (Progress Rail) | Right (Active Card) */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
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
              <div className="p-3 rounded-2xl bg-surface-onyx border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                {/* Steppers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCardIndex(activeCardIndex - 1)}
                    disabled={activeCardIndex === 0}
                    className="px-3 py-2 rounded-xl bg-surface-interactive hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-optic-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-text-muted-slate px-1">
                    {activeCardIndex + 1} / {stagedQuestions.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveCardIndex(activeCardIndex + 1)}
                    disabled={activeCardIndex === stagedQuestions.length - 1}
                    className="px-3 py-2 rounded-xl bg-surface-interactive hover:bg-white/10 disabled:opacity-40 text-xs font-semibold text-optic-white flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Toggles: Reset, Reject, Edit, Accept */}
                <div className="flex items-center gap-2 flex-wrap">
                  {activeQuestion.reviewStatus !== 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => resetQuestion(activeQuestion.id)}
                      className="px-3 py-2 rounded-xl bg-surface-interactive hover:bg-white/10 text-xs font-semibold text-text-muted-slate hover:text-optic-white flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset status back to Needs Review"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => rejectQuestion(activeQuestion.id)}
                    className="px-3.5 py-2 rounded-xl bg-state-warning-rose/15 hover:bg-state-warning-rose/25 border border-state-warning-rose/30 text-state-warning-rose text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
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
                    className="px-3.5 py-2 rounded-xl bg-surface-interactive hover:bg-white/10 border border-white/10 text-optic-white text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-team-b-cyan" />
                    <span>
                      {editingQuestionId === activeQuestion.id ? 'Close Edit' : 'Edit (E)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => acceptQuestion(activeQuestion.id)}
                    className="px-5 py-2 rounded-xl bg-state-success hover:bg-state-success/90 text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-state-success/20 transition-all cursor-pointer hover:scale-[1.02]"
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
