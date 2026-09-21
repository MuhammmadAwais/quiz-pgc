'use client';

import React, { useState } from 'react';
import {
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StagedQuestion } from '@/lib/types/studio';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';
import { MathRenderer } from '@/components/ui/MathRenderer';

interface ReviewCardProps {
  question: StagedQuestion;
  index: number;
  total: number;
}

export function ReviewCard({ question, index, total }: ReviewCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const { setEditingQuestionId } = useAiStudioStore();

  const getStatusBadge = () => {
    switch (question.reviewStatus) {
      case 'ACCEPTED':
        return 'bg-state-success/20 text-state-success border-state-success/40 shadow-sm';
      case 'REJECTED':
        return 'bg-state-warning-rose/20 text-state-warning-rose border-state-warning-rose/40';
      default:
        return 'bg-surface-interactive text-text-muted-slate border-border-subtle';
    }
  };

  const getStatusLabel = () => {
    switch (question.reviewStatus) {
      case 'ACCEPTED':
        return 'ACCEPTED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'NEEDS REVIEW';
    }
  };

  const hasWarnings = question.warnings && question.warnings.length > 0;

  return (
    <div className="rounded-2xl bg-surface-carbon border border-border-medium p-5 sm:p-6 space-y-4 shadow-sm transition-all">
      {/* 1. Header Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-surface-onyx text-optic-white border border-border-medium">
            Question #{index + 1} of {total}
          </span>

          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getStatusBadge()}`}
          >
            {getStatusLabel()}
          </span>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-surface-interactive text-text-muted-slate border border-border-subtle uppercase">
            {question.difficulty}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setEditingQuestionId(question.id)}
          className="px-3 py-1.5 rounded-lg bg-surface-interactive hover:bg-surface-onyx border border-border-medium text-xs font-semibold text-text-bright-slate hover:text-optic-white flex items-center gap-1.5 transition-colors self-end sm:self-auto cursor-pointer"
          title="Edit Question (Press 'E')"
        >
          <Edit2 className="w-3.5 h-3.5 text-team-b-cyan" />
          <span>Edit (E)</span>
        </button>
      </div>

      {/* 2. Quality / Anti-Hallucination Warning Banner */}
      {hasWarnings && (
        <div className="p-3.5 rounded-xl bg-state-warning-rose/10 border border-state-warning-rose/30 text-xs text-state-warning-rose space-y-1 animate-fade-in font-sans">
          <div className="flex items-center gap-1.5 font-bold font-mono uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Please check this question:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1 font-sans">
            {question.warnings!.map((w, wIdx) => (
              <li key={wIdx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Question Prompt Stem */}
      <div className="space-y-1">
        <div className="text-base sm:text-lg text-optic-white font-medium leading-relaxed font-sans">
          <MathRenderer content={question.prompt} />
        </div>
      </div>

      {/* 4. 4 Options Grid (2x2 Landscape) */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {question.options.map((opt, optIdx) => {
            const isCorrect = optIdx === question.correct_option_index;
            const letter = ['A', 'B', 'C', 'D'][optIdx];

            return (
              <div
                key={optIdx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                  isCorrect
                    ? 'bg-state-success/15 border-state-success/50 text-optic-white ring-1 ring-state-success/30'
                    : 'bg-surface-onyx border-border-subtle text-text-bright-slate'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`h-6 w-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      isCorrect
                        ? 'bg-state-success text-white font-extrabold'
                        : 'bg-surface-interactive text-text-muted-slate'
                    }`}
                  >
                    {letter}
                  </span>
                  <div className={`text-xs sm:text-sm ${isCorrect ? 'font-bold text-optic-white' : 'font-normal'} font-sans`}>
                    <MathRenderer content={opt} inline />
                  </div>
                </div>

                {isCorrect && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-state-success shrink-0 font-mono uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Correct Answer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Solution / Explanation */}
      {question.explanation && (
        <div className="pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[11px] font-semibold text-text-muted-slate hover:text-team-b-cyan flex items-center gap-1.5 transition-colors cursor-pointer font-sans"
          >
            <Info className="w-3.5 h-3.5 text-team-b-cyan" />
            <span>{showExplanation ? 'Hide Explanation' : 'View Explanation'}</span>
            {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showExplanation && (
            <div className="mt-2 p-3 rounded-xl bg-surface-onyx border border-border-subtle text-xs text-text-bright-slate leading-relaxed font-sans">
              <MathRenderer content={question.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
