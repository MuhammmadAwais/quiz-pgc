'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Inbox,
  XCircle,
  Trash2,
  Loader2,
  BookmarkCheck,
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

  return (
    <div className="sticky bottom-0 z-30 w-full bg-surface-onyx/95 border-t border-white/10 backdrop-blur-xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
      {/* Left: Summary Counters */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Inbox className="w-4 h-4 text-text-muted-slate" />
          <span className="text-text-muted-slate">Needs Review:</span>
          <span className="font-mono font-bold text-optic-white">{pending.length}</span>
        </div>

        <span className="text-white/20">•</span>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-state-success" />
          <span className="text-text-muted-slate">Accepted:</span>
          <span className="font-mono font-bold text-state-success">{accepted.length}</span>
        </div>

        <span className="text-white/20">•</span>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <XCircle className="w-4 h-4 text-state-warning-rose" />
          <span className="text-text-muted-slate">Rejected:</span>
          <span className="font-mono font-bold text-state-warning-rose">{rejected.length}</span>
        </div>
      </div>

      {/* Center: Destination Subject & Topic Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
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
          className="h-10 bg-surface-carbon border border-white/15 rounded-xl px-3 text-xs text-optic-white focus:outline-none focus:border-team-b-cyan"
        >
          <option value="">Choose Subject...</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>

        <select
          value={config.targetChapterId || ''}
          onChange={(e) => setConfig({ targetChapterId: e.target.value || null })}
          disabled={!config.targetSubjectId || filteredChapters.length === 0}
          className="h-10 bg-surface-carbon border border-white/15 rounded-xl px-3 text-xs text-optic-white focus:outline-none focus:border-team-b-cyan disabled:opacity-40"
        >
          <option value="">Choose Topic...</option>
          {filteredChapters.map((chap) => (
            <option key={chap.id} value={chap.id}>
              {chap.name}
            </option>
          ))}
        </select>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to clear all questions in this review?')) {
              clearSession();
            }
          }}
          disabled={isSaving}
          className="h-10 px-3.5 rounded-xl bg-surface-interactive hover:bg-state-warning-rose/15 hover:border-state-warning-rose/30 hover:text-state-warning-rose border border-white/10 text-xs font-semibold text-text-muted-slate transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || accepted.length === 0}
          className="h-10 px-5 rounded-xl bg-team-b-cyan hover:bg-team-b-cyan/90 disabled:opacity-40 text-surface-obsidian text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-team-b-cyan/20 hover:scale-[1.01]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving {accepted.length} Questions...</span>
            </>
          ) : (
            <>
              <BookmarkCheck className="w-4 h-4 stroke-[2.5]" />
              <span>Save {accepted.length} Accepted to Question Bank</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
