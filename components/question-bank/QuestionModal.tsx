'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Question, Subject, Chapter } from '@/lib/types/tournament';
import { createQuestion, updateQuestion } from '@/lib/actions/questions';
import { CheckCircle2 } from 'lucide-react';
import { MathRenderer } from '@/components/ui/MathRenderer';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  chapters: Chapter[];
  selectedSubjectId?: string;
  selectedChapterId?: string;
  editingQuestion?: Question | null;
  onSuccess: () => void;
}

export function QuestionModal({
  isOpen,
  onClose,
  subjects,
  chapters,
  selectedSubjectId,
  selectedChapterId,
  editingQuestion,
  onSuccess,
}: QuestionModalProps) {
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [text, setText] = useState('');
  const [options, setOptions] = useState<[string, string, string, string]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingQuestion) {
      setSubjectId(editingQuestion.subject_id);
      setChapterId(editingQuestion.chapter_id);
      setText(editingQuestion.text);
      setOptions(editingQuestion.options);
      setCorrectIndex(editingQuestion.correct_index);
    } else {
      setSubjectId(selectedSubjectId || (subjects[0]?.id || ''));
      setChapterId(selectedChapterId || (chapters[0]?.id || ''));
      setText('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
    }
    setError(null);
  }, [isOpen, editingQuestion, selectedSubjectId, selectedChapterId, subjects, chapters]);

  // Filter chapters matching current subjectId
  const availableChapters = chapters.filter((c) => c.subject_id === subjectId);

  const handleOptionChange = (idx: number, val: string) => {
    const updated: [string, string, string, string] = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Question prompt is required');
      return;
    }
    if (options.some((o) => !o.trim())) {
      setError('All 4 options must be filled');
      return;
    }
    if (!subjectId || !chapterId) {
      setError('Please assign both Subject and Chapter');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingQuestion) {
        const res = await updateQuestion(editingQuestion.id, {
          text,
          options,
          correct_index: correctIndex,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await createQuestion({
          subject_id: subjectId,
          chapter_id: chapterId,
          text,
          options,
          correct_index: correctIndex,
        });
        if (!res.success) throw new Error(res.error);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save question';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingQuestion ? 'Edit Competition MCQ' : 'Create Competition MCQ'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-state-warning-rose/15 border border-state-warning-rose/40 text-state-warning-rose text-xs font-mono">
            {error}
          </div>
        )}

        {/* Subject and Chapter Selectors */}
        {!editingQuestion && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast mb-1.5">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  const firstChap = chapters.find((c) => c.subject_id === e.target.value);
                  if (firstChap) setChapterId(firstChap.id);
                }}
                className="w-full bg-surface-obsidian border border-border-medium rounded-md px-3 py-2 text-optic-white text-xs font-mono focus:border-team-a-core focus:outline-none"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id} className="bg-surface-carbon text-optic-white">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast mb-1.5">
                Chapter / Topic
              </label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full bg-surface-obsidian border border-border-medium rounded-md px-3 py-2 text-optic-white text-xs font-mono focus:border-team-a-core focus:outline-none"
              >
                {availableChapters.length === 0 ? (
                  <option value="" disabled className="bg-surface-carbon text-text-muted-slate">
                    No Chapters Found
                  </option>
                ) : (
                  availableChapters.map((chap) => (
                    <option key={chap.id} value={chap.id} className="bg-surface-carbon text-optic-white">
                      {chap.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}

        {/* Question Text Prompt */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast">
              Question Prompt (Projector Display Text)
            </label>
            <span className="text-[10px] font-mono text-text-muted-slate">
              LaTeX supported ($x$ or $$x$$)
            </span>
          </div>
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Which thermodynamic process occurs at constant pressure? Or: What is $$S$$?"
            className="w-full bg-surface-obsidian border border-border-medium rounded-md p-3 text-optic-white text-sm focus:outline-none focus:border-team-a-core transition-colors"
            required
          />
          {text.includes('$') && (
            <div className="mt-2 p-2.5 rounded-lg bg-surface-carbon border border-border-subtle">
              <span className="text-[10px] font-mono text-team-a-bright uppercase font-bold block mb-1">
                Formula Live Preview:
              </span>
              <MathRenderer content={text} className="text-sm text-optic-white" />
            </div>
          )}
        </div>

        {/* Options A, B, C, D */}
        <div className="space-y-2.5">
          <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast">
            Options & Correct Answer Selection
          </label>
          <p className="text-[11px] text-text-muted-slate mb-1">
            Click the radio indicator to select the single correct answer.
          </p>

          {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => {
            const isCorrect = correctIndex === idx;

            return (
              <div
                key={letter}
                onClick={() => setCorrectIndex(idx)}
                className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isCorrect
                    ? 'bg-state-success/10 border-state-success/60 text-optic-white'
                    : 'bg-surface-obsidian border-border-subtle hover:border-border-medium'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                    isCorrect
                      ? 'bg-state-success text-surface-obsidian shadow-sm'
                      : 'bg-surface-carbon border border-border-medium text-text-muted-slate'
                  }`}
                >
                  {letter}
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={options[idx]}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${letter}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-sm text-optic-white focus:outline-none placeholder-text-muted-slate"
                    required
                  />
                  {options[idx].includes('$') && (
                    <div className="mt-1 pt-1 border-t border-border-subtle/40 text-xs text-optic-white">
                      <MathRenderer content={options[idx]} inline />
                    </div>
                  )}
                </div>

                {isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-state-success shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
          <Button type="button" variant="console" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="team-a" size="sm" disabled={loading}>
            {loading ? 'Saving Question...' : editingQuestion ? 'Update MCQ' : 'Create MCQ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
