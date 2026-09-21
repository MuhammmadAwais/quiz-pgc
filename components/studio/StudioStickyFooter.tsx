'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Inbox,
  XCircle,
  Trash2,
  Loader2,
  BookmarkCheck,
  ChevronDown,
} from 'lucide-react';
import { Subject, Chapter } from '@/lib/types/tournament';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';

interface StudioStickyFooterProps {
  subjects: Subject[];
  chapters: Chapter[];
  onSaveSuccess: () => void;
  onCommitSuccess?: () => void;
}

export function StudioStickyFooter({
  subjects,
  chapters,
  onSaveSuccess,
  onCommitSuccess,
}: StudioStickyFooterProps) {
  const { config, setConfig, stagedQuestions, clearSession, setError } = useAiStudioStore();
  const [isSaving, setIsSaving] = useState(false);

  if (stagedQuestions.length === 0) return null;

  const accepted = stagedQuestions.filter((q) => q.reviewStatus === 'ACCEPTED');
  const pending = stagedQuestions.filter((q) => q.reviewStatus === 'PENDING');
  const rejected = stagedQuestions.filter((q) => q.reviewStatus === 'REJECTED');

  const filteredChapters = chapters.filter((c) => c.subject_id === config.targetSubjectId);

  const handleSave = async () => {
    if (accepted.length === 0) {
      setError('Please accept at least 1 question before saving.');
      return;
    }

    if (!config.targetSubjectId) {
      setError('Please choose a Subject below before saving.');
      return;
    }

    if (!config.targetChapterId) {
      setError('Please choose a Topic below before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: config.targetSubjectId,
          chapterId: config.targetChapterId,
          questions: stagedQuestions,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save questions to database.');
      }

      clearSession();
      if (onSaveSuccess) onSaveSuccess();
      else if (onCommitSuccess) onCommitSuccess();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.message || 'Failed to save questions to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = accepted.length > 0 && !!config.targetSubjectId && !!config.targetChapterId;

  return (
    <div className="sticky bottom-0 z-30 w-full bg-surface-onyx/97 border-t border-border-subtle backdrop-blur-xl shadow-modal-dialog mt-6">
      {/* Top row: Stats + Destination */}
      <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: Summary Counters */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
            <Inbox className="w-3.5 h-3.5 text-text-muted-slate shrink-0" />
            <span className="text-text-muted-slate font-sans">Needs Review:</span>
            <span className="font-mono font-bold text-optic-white">{pending.length}</span>
          </div>

          <span className="text-text-muted-slate/30">•</span>

          <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-state-success shrink-0" />
            <span className="text-text-muted-slate font-sans">Accepted:</span>
            <span className="font-mono font-bold text-state-success">{accepted.length}</span>
          </div>

          <span className="text-text-muted-slate/30">•</span>

          <div className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-state-warning-rose shrink-0" />
            <span className="text-text-muted-slate font-sans">Rejected:</span>
            <span className="font-mono font-bold text-state-warning-rose">{rejected.length}</span>
          </div>
        </div>

        {/* Destination Dropdowns */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Subject dropdown */}
          <div className="relative flex-1 min-w-0">
            <select
              value={config.targetSubjectId || ''}
              onChange={(e) => {
                const newSubId = e.target.value || null;
                const subChaps = chapters.filter((c) => c.subject_id === newSubId);
                setConfig({
                  targetSubjectId: newSubId,
                  targetChapterId: subChaps.length > 0 ? subChaps[0].id : null,
                });
              }}
              className="w-full h-9 appearance-none bg-surface-carbon border border-border-medium rounded-lg pl-3 pr-7 text-xs text-optic-white focus:outline-none focus:border-brand-secondary font-sans"
            >
              <option value="">Choose Subject...</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted-slate absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Chapter dropdown */}
          <div className="relative flex-1 min-w-0">
            <select
              value={config.targetChapterId || ''}
              onChange={(e) => setConfig({ targetChapterId: e.target.value || null })}
              disabled={!config.targetSubjectId || filteredChapters.length === 0}
              className="w-full h-9 appearance-none bg-surface-carbon border border-border-medium rounded-lg pl-3 pr-7 text-xs text-optic-white focus:outline-none focus:border-brand-secondary disabled:opacity-40 font-sans"
            >
              <option value="">Choose Topic...</option>
              {filteredChapters.map((chap) => (
                <option key={chap.id} value={chap.id}>
                  {chap.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted-slate absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bottom row: Actions */}
      <div className="px-4 sm:px-5 pb-3 flex items-center justify-between gap-3">
        {/* Hint text when no accepted questions */}
        {accepted.length === 0 ? (
          <p className="text-[11px] font-mono text-text-muted-slate italic">
            Accept questions above to enable save
          </p>
        ) : (
          <p className="text-[11px] font-mono text-state-success">
            {accepted.length} question{accepted.length !== 1 ? 's' : ''} ready to commit
          </p>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {/* Clear All */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to clear all questions in this review?')) {
                clearSession();
              }
            }}
            disabled={isSaving}
            className="h-9 px-3 rounded-lg bg-surface-interactive hover:bg-state-warning-rose/15 hover:border-state-warning-rose/30 hover:text-state-warning-rose border border-border-subtle text-xs font-semibold text-text-muted-slate transition-all cursor-pointer flex items-center gap-1.5 font-sans whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear All</span>
          </button>

          {/* Save to Question Bank */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !canSave}
            className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer font-sans whitespace-nowrap ${
              canSave
                ? 'bg-team-b-cyan hover:brightness-105 text-surface-obsidian shadow-sm hover:scale-[1.01]'
                : 'bg-surface-interactive border border-border-medium text-text-muted-slate opacity-60 cursor-not-allowed'
            } disabled:opacity-40`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving {accepted.length}...</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {accepted.length === 0
                    ? 'Save to Question Bank'
                    : `Save ${accepted.length} to Question Bank`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
