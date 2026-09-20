'use client';

import React, { useState } from 'react';
import {
  Rocket,
  Trash2,
  CheckCircle2,
  Inbox,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Subject, Chapter } from '@/lib/types/tournament';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';
import { commitApprovedQuestions } from '@/lib/actions/books';

interface StudioStickyFooterProps {
  subjects: Subject[];
  chapters: Chapter[];
  onCommitSuccess: () => void;
}

export function StudioStickyFooter({
  subjects,
  chapters,
  onCommitSuccess,
}: StudioStickyFooterProps) {
  const { config, setConfig, stagedQuestions, clearSession, setError } = useAiStudioStore();
  const [isCommitting, setIsCommitting] = useState(false);

  if (stagedQuestions.length === 0) return null;

  const approved = stagedQuestions.filter((q) => q.reviewStatus === 'APPROVED');
  const inbox = stagedQuestions.filter((q) => q.reviewStatus === 'INBOX');
  const discarded = stagedQuestions.filter((q) => q.reviewStatus === 'DISCARDED');

  const filteredChapters = chapters.filter((c) => c.subject_id === config.targetSubjectId);

  const handleCommit = async () => {
    if (approved.length === 0) {
      setError('Please approve at least 1 question before saving to the question bank.');
      return;
    }

    if (!config.targetSubjectId) {
      setError('Please select a target Subject below before saving.');
      return;
    }

    if (!config.targetChapterId) {
      setError('Please select a target Chapter / Topic below before saving.');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const res = await commitApprovedQuestions(
        config.targetSubjectId,
        config.targetChapterId,
        stagedQuestions
      );

      if (!res.success) {
        throw new Error(res.error || 'Failed to commit questions to database.');
      }

      clearSession();
      onCommitSuccess();
    } catch (err: any) {
      console.error('Commit failed:', err);
      setError(err?.message || 'Failed to save questions to database.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="sticky bottom-0 z-30 w-full bg-surface-onyx/95 border-t border-white/10 backdrop-blur-xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
      {/* Left: Summary Counters */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Inbox className="w-4 h-4 text-text-muted-slate" />
          <span className="text-text-muted-slate">Pending:</span>
          <span className="font-mono font-bold text-optic-white">{inbox.length}</span>
        </div>

        <span className="text-white/20">•</span>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-state-success" />
          <span className="text-text-muted-slate">Approved:</span>
          <span className="font-mono font-bold text-state-success">{approved.length}</span>
        </div>

        <span className="text-white/20">•</span>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <XCircle className="w-4 h-4 text-state-warning-rose" />
          <span className="text-text-muted-slate">Discarded:</span>
          <span className="font-mono font-bold text-state-warning-rose">{discarded.length}</span>
        </div>
      </div>

      {/* Center: Target Subject & Chapter Pickers */}
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
          className="bg-surface-carbon border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-team-a-core"
        >
          <option value="">Select Target Subject...</option>
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
          className="bg-surface-carbon border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-team-a-core disabled:opacity-40"
        >
          <option value="">Select Topic / Chapter...</option>
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
            if (confirm('Discard all questions in this generation session?')) {
              clearSession();
            }
          }}
          disabled={isCommitting}
          className="px-3 py-2 rounded-xl bg-surface-interactive hover:bg-white/10 text-xs font-semibold text-text-muted-slate hover:text-optic-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>

        <button
          type="button"
          onClick={handleCommit}
          disabled={isCommitting || approved.length === 0}
          className="px-5 py-2.5 rounded-xl bg-state-success hover:bg-state-success/90 disabled:opacity-40 text-surface-obsidian text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-state-success/20 hover:scale-[1.02]"
        >
          {isCommitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving {approved.length} MCQs...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Save {approved.length} Approved MCQs</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
