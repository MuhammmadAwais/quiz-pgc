'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { StagedQuestion, Difficulty, CognitiveType } from '@/lib/types/studio';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';

interface ReviewCardEditModeProps {
  question: StagedQuestion;
  index: number;
}

export function ReviewCardEditMode({ question, index }: ReviewCardEditModeProps) {
  const { updateQuestion, setEditingQuestionId } = useAiStudioStore();

  const [prompt, setPrompt] = useState(question.prompt);
  const [options, setOptions] = useState<[string, string, string, string]>([...question.options] as [string, string, string, string]);
  const [correctIndex, setCorrectIndex] = useState(question.correct_option_index);
  const [difficulty, setDifficulty] = useState<Difficulty>(question.difficulty);
  const [cognitiveType, setCognitiveType] = useState<CognitiveType>(question.cognitive_type);
  const [explanation, setExplanation] = useState(question.explanation || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuestion(question.id, {
      prompt: prompt.trim(),
      options: options.map((o) => o.trim()) as [string, string, string, string],
      correct_option_index: correctIndex,
      difficulty,
      cognitive_type: cognitiveType,
      explanation: explanation.trim() || null,
    });
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options] as [string, string, string, string];
    updated[idx] = val;
    setOptions(updated);
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl bg-surface-carbon border border-team-a-core/50 p-5 sm:p-6 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <span className="text-xs font-mono font-bold text-optic-white">
          Editing Question #{index + 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingQuestionId(null)}
            className="px-2.5 py-1 rounded bg-surface-interactive text-text-muted-slate hover:text-optic-white text-xs flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-team-a-core hover:brightness-105 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Edits</span>
          </button>
        </div>
      </div>

      {/* Prompt Field */}
      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-text-muted-slate">
          Question Text (use $ for math formulas):
        </label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          className="w-full bg-surface-obsidian border border-border-medium rounded-lg p-2.5 text-sm text-optic-white focus:outline-none focus:border-brand-primary font-sans"
        />
      </div>

      {/* 4 Options & Correct Radio Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-text-muted-slate block">
          Options (click a letter to mark correct answer):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {options.map((opt, optIdx) => {
            const letter = ['A', 'B', 'C', 'D'][optIdx];
            const isCorrect = correctIndex === optIdx;

            return (
              <div
                key={optIdx}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isCorrect
                    ? 'bg-state-success/15 border-state-success/50 ring-1 ring-state-success/30'
                    : 'bg-surface-onyx border-border-subtle'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCorrectIndex(optIdx)}
                  className={`h-7 w-7 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors cursor-pointer ${
                    isCorrect
                      ? 'bg-state-success text-white font-extrabold shadow-sm'
                      : 'bg-surface-interactive text-text-muted-slate hover:text-optic-white'
                  }`}
                  title="Mark as correct answer"
                >
                  {letter}
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next: [string, string, string, string] = [options[0], options[1], options[2], options[3]];
                    next[optIdx] = e.target.value;
                    setOptions(next);
                  }}
                  required
                  placeholder={`Option ${letter}`}
                  className="w-full bg-surface-obsidian border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-brand-primary"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Type Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase font-bold text-text-muted-slate">
            Difficulty:
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full bg-surface-obsidian border border-border-medium rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-brand-primary font-sans"
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase font-bold text-text-muted-slate">
            Question Type:
          </label>
          <select
            value={cognitiveType}
            onChange={(e) => setCognitiveType(e.target.value as CognitiveType)}
            className="w-full bg-surface-obsidian border border-border-medium rounded-lg px-2.5 py-1.5 text-xs text-optic-white focus:outline-none focus:border-brand-primary font-sans"
          >
            <option value="KNOWLEDGE">Facts &amp; Definitions</option>
            <option value="CONCEPTUAL">Concepts &amp; Principles</option>
            <option value="APPLICATION">Formulas &amp; Math</option>
          </select>
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-1 pt-1">
        <label className="text-[10px] font-mono uppercase tracking-wider font-bold text-text-muted-slate">
          Explanation / Reason (Optional):
        </label>
        <textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explanation for why this option is correct..."
          className="w-full bg-surface-obsidian border border-border-medium rounded-lg p-2.5 text-xs text-optic-white focus:outline-none focus:border-brand-primary font-sans"
        />
      </div>
    </form>
  );
}
