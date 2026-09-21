'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SubjectRowSkeleton } from '@/components/ui/Skeleton';
import { Subject, TournamentConfig } from '@/lib/types/tournament';
import { getSubjects } from '@/lib/actions/subjects';
import { getPoolStats, fetchEligibleQuestions, seedSampleQuestions } from '@/lib/actions/questions';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { useRepositoryStore } from '@/lib/store/useRepositoryStore';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  CURATED_TEAM_PRESETS,
  getAccessibleTeamColor,
  getTextContrastColor,
} from '@/lib/utils/color';
import { Palette, ShieldAlert } from 'lucide-react';

export default function MatchSetupPage() {
  const router = useRouter();
  const repoSubjects = useRepositoryStore((s) => s.subjects);
  const loadRepo = useRepositoryStore((s) => s.loadRepo);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  // Active in-progress match detection
  const activeMatch = useTournamentStore((s) => s.config);
  const isMatchFinished = useTournamentStore((s) => s.isMatchFinished);
  const teamAScore = useTournamentStore((s) => s.teamAScore);
  const teamBScore = useTournamentStore((s) => s.teamBScore);
  const resetMatch = useTournamentStore((s) => s.resetMatch);

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Form State
  const [teamAName, setTeamAName] = useState('Alpha Titans');
  const [teamBName, setTeamBName] = useState('Cyber Phoenix');
  const [teamAColor, setTeamAColor] = useState('#8B5CF6');
  const [teamBColor, setTeamBColor] = useState('#06B6D4');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});
  const [pointsPerMcq, setPointsPerMcq] = useState(10);
  const [includeUsedQuestions, setIncludeUsedQuestions] = useState(true);

  // Pool Validation State
  const [poolBreakdown, setPoolBreakdown] = useState<Record<string, number>>({});
  const [validatingPool, setValidatingPool] = useState(false);

  useEffect(() => {
    loadRepo();
  }, [loadRepo]);

  useEffect(() => {
    async function init() {
      let subs = repoSubjects;
      if (subs.length === 0) {
        subs = await getSubjects();
      }
      setSubjects(subs);

      const defaultCounts: Record<string, number> = {};
      subs.forEach((s) => {
        defaultCounts[s.id] = 2; // Default 2 questions per team
      });
      setSubjectQuestionCounts(defaultCounts);

      if (subs.length > 0) {
        setSelectedSubjectIds((prev) => (prev.length === 0 ? subs.slice(0, 3).map((s) => s.id) : prev));
      }
      setLoading(false);
    }
    init();
  }, [repoSubjects]);

  // Fetch pool stats for all available subjects so selections have immediate accurate stats
  useEffect(() => {
    async function validateAll() {
      if (subjects.length === 0) {
        setPoolBreakdown({});
        return;
      }

      setValidatingPool(true);
      try {
        const allSubjectIds = subjects.map((s) => s.id);
        const stats = await getPoolStats(allSubjectIds, includeUsedQuestions);
        setPoolBreakdown(stats.breakdown);
      } catch (err) {
        console.error('Failed to validate question pool:', err);
      } finally {
        setValidatingPool(false);
      }
    }
    validateAll();
  }, [subjects, includeUsedQuestions]);

  const poolTotal = selectedSubjectIds.reduce(
    (sum, id) => sum + (poolBreakdown[id] || 0),
    0
  );

  const toggleSubject = (id: string) => {
    if (selectedSubjectIds.includes(id)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((s) => s !== id));
    } else {
      setSelectedSubjectIds([...selectedSubjectIds, id]);
      if (!subjectQuestionCounts[id]) {
        setSubjectQuestionCounts((prev) => ({ ...prev, [id]: 2 }));
      }
    }
  };

  const updateSubjectCount = (id: string, delta: number) => {
    setSubjectQuestionCounts((prev) => {
      const current = prev[id] || 2;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const totalQuestionsPerTeam = selectedSubjectIds.reduce(
    (sum, id) => sum + (subjectQuestionCounts[id] || 2),
    0
  );
  const totalMatchQuestions = totalQuestionsPerTeam * 2;

  const isPoolSufficient =
    selectedSubjectIds.length > 0 &&
    selectedSubjectIds.every(
      (id) => (poolBreakdown[id] || 0) >= (subjectQuestionCounts[id] || 2) * 2
    );

  const handleStartMatch = async () => {
    if (!isPoolSufficient || launching) return;

    setLaunching(true);
    try {
      const safetyA = getAccessibleTeamColor(teamAColor, isDarkMode);
      const safetyB = getAccessibleTeamColor(teamBColor, isDarkMode);

      const config: TournamentConfig = {
        teamAName: teamAName.trim() || 'Team A',
        teamBName: teamBName.trim() || 'Team B',
        teamAColor: safetyA.safeColor,
        teamBColor: safetyB.safeColor,
        selectedSubjectIds,
        subjectQuestionCounts,
        mcqsPerSubject: 2,
        pointsPerMcq,
        includeUsedQuestions,
      };

      const selectedSubjectsList = subjects.filter((s) => selectedSubjectIds.includes(s.id));
      const questionsGrouped = await fetchEligibleQuestions(config);

      useTournamentStore
        .getState()
        .initializeMatch(config, questionsGrouped, selectedSubjectsList);

      router.push('/live-match');
    } catch (err) {
      console.error('Failed to launch match:', err);
      alert('Failed to launch match. Please check console.');
      setLaunching(false);
    }
  };

  const handleSeedQuick = async () => {
    setSeedLoading(true);
    try {
      await seedSampleQuestions();
      const subs = await getSubjects();
      setSubjects(subs);
      setSelectedSubjectIds(subs.slice(0, 3).map((s) => s.id));
    } finally {
      setSeedLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-obsidian flex items-center justify-center p-6 text-optic-white font-mono text-xs">
        Loading tournament configurations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-wide text-optic-white">
            Match Setup
          </h1>
          <p className="text-xs text-text-muted-slate mt-0.5">
            Configure teams, select subjects, and set question quotas
          </p>
        </div>

        <div className="flex items-center gap-3">
          {subjects.length === 0 && (
            <Button
              variant="team-b"
              size="sm"
              onClick={handleSeedQuick}
              disabled={seedLoading}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>{seedLoading ? 'Loading...' : 'Seed Sample MCQs'}</span>
            </Button>
          )}

          {activeMatch && !isMatchFinished && (
            <Button
              variant="team-a"
              size="sm"
              onClick={() => router.push('/live-match')}
              className="font-mono text-xs font-bold"
            >
              RESUME ACTIVE MATCH ({teamAScore} - {teamBScore}) →
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Teams & Custom Colors */}
          <Card variant="carbon" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate block">
                Teams &amp; Stage Identity
              </span>
              <span className="text-[11px] font-mono text-text-muted-slate flex items-center gap-1">
                <Palette className="w-3.5 h-3.5" />
                <span>Custom Color Wheel</span>
              </span>
            </div>

            {/* Same-color Warning */}
            {teamAColor.toLowerCase() === teamBColor.toLowerCase() && (
              <div className="p-2.5 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Both teams currently share the same color. Please choose distinct colors for stage visual clarity.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Team A Configuration */}
              {(() => {
                const safetyA = getAccessibleTeamColor(teamAColor, isDarkMode);
                return (
                  <div className="p-4 rounded-xl bg-surface-onyx border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold flex items-center gap-1.5" style={{ color: safetyA.safeColor }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: safetyA.safeColor }} />
                        Team Alpha (First Turn)
                      </span>
                      {safetyA.isAdjusted && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-interactive border border-border-medium text-text-muted-slate">
                          Contrast Adjusted
                        </span>
                      )}
                    </div>

                    <Input
                      label="Team Name"
                      value={teamAName}
                      onChange={(e) => setTeamAName(e.target.value)}
                      placeholder="Team A Name"
                      className="text-sm font-semibold"
                    />

                    {/* Color Wheel & Swatch Selector */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase font-bold text-text-muted-slate block">
                          Team Accent Color
                        </label>
                        <span className="text-[10px] font-mono text-text-muted-slate">
                          Click swatch to open wheel
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <label className="relative w-9 h-9 rounded-lg cursor-pointer shrink-0 border border-border-medium overflow-hidden shadow-sm hover:scale-105 transition-transform" title="Click to open color wheel">
                          <input
                            type="color"
                            value={teamAColor}
                            onChange={(e) => setTeamAColor(e.target.value)}
                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                            title="Open Color Wheel"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: teamAColor }} />
                        </label>

                        <input
                          type="text"
                          value={teamAColor.toUpperCase()}
                          onChange={(e) => setTeamAColor(e.target.value)}
                          placeholder="#8B5CF6"
                          maxLength={7}
                          className="w-24 h-9 bg-surface-carbon border border-border-medium rounded-lg px-2.5 text-xs font-mono text-optic-white text-center focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Presets Row without scrollbar */}
                      <div className="space-y-1 pt-1 border-t border-border-subtle/50">
                        <span className="text-[10px] font-mono text-text-muted-slate block">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {CURATED_TEAM_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setTeamAColor(preset.hex)}
                              className={`w-6 h-6 rounded-full border transition-all shrink-0 cursor-pointer ${
                                teamAColor.toLowerCase() === preset.hex.toLowerCase()
                                  ? 'ring-2 ring-brand-primary scale-110 border-white shadow-sm'
                                  : 'border-border-subtle opacity-80 hover:opacity-100 hover:scale-110'
                              }`}
                              style={{ backgroundColor: preset.hex }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>

                      {safetyA.isAdjusted && (
                        <p className="text-[10px] font-mono text-text-muted-slate pt-1">
                          Note: Displayed as <span className="font-bold" style={{ color: safetyA.safeColor }}>{safetyA.safeColor}</span> on stage to ensure readability against the background.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Team B Configuration */}
              {(() => {
                const safetyB = getAccessibleTeamColor(teamBColor, isDarkMode);
                return (
                  <div className="p-4 rounded-xl bg-surface-onyx border border-border-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold flex items-center gap-1.5" style={{ color: safetyB.safeColor }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: safetyB.safeColor }} />
                        Team Beta (Second Turn)
                      </span>
                      {safetyB.isAdjusted && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-interactive border border-border-medium text-text-muted-slate">
                          Contrast Adjusted
                        </span>
                      )}
                    </div>

                    <Input
                      label="Team Name"
                      value={teamBName}
                      onChange={(e) => setTeamBName(e.target.value)}
                      placeholder="Team B Name"
                      className="text-sm font-semibold"
                    />

                    {/* Color Wheel & Swatch Selector */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono uppercase font-bold text-text-muted-slate block">
                          Team Accent Color
                        </label>
                        <span className="text-[10px] font-mono text-text-muted-slate">
                          Click swatch to open wheel
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <label className="relative w-9 h-9 rounded-lg cursor-pointer shrink-0 border border-border-medium overflow-hidden shadow-sm hover:scale-105 transition-transform" title="Click to open color wheel">
                          <input
                            type="color"
                            value={teamBColor}
                            onChange={(e) => setTeamBColor(e.target.value)}
                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                            title="Open Color Wheel"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: teamBColor }} />
                        </label>

                        <input
                          type="text"
                          value={teamBColor.toUpperCase()}
                          onChange={(e) => setTeamBColor(e.target.value)}
                          placeholder="#06B6D4"
                          maxLength={7}
                          className="w-24 h-9 bg-surface-carbon border border-border-medium rounded-lg px-2.5 text-xs font-mono text-optic-white text-center focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Presets Row without scrollbar */}
                      <div className="space-y-1 pt-1 border-t border-border-subtle/50">
                        <span className="text-[10px] font-mono text-text-muted-slate block">
                          Quick Presets:
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {CURATED_TEAM_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setTeamBColor(preset.hex)}
                              className={`w-6 h-6 rounded-full border transition-all shrink-0 cursor-pointer ${
                                teamBColor.toLowerCase() === preset.hex.toLowerCase()
                                  ? 'ring-2 ring-brand-primary scale-110 border-white shadow-sm'
                                  : 'border-border-subtle opacity-80 hover:opacity-100 hover:scale-110'
                              }`}
                              style={{ backgroundColor: preset.hex }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>

                      {safetyB.isAdjusted && (
                        <p className="text-[10px] font-mono text-text-muted-slate pt-1">
                          Note: Displayed as <span className="font-bold" style={{ color: safetyB.safeColor }}>{safetyB.safeColor}</span> on stage to ensure readability against the background.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* 2. Subjects & Question Quotas (Clean Unified List) */}
          <Card variant="carbon" className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate">
                Subjects & Questions per Team
              </span>
              <span className="text-[11px] font-mono text-text-muted-slate">
                {selectedSubjectIds.length} selected
              </span>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <SubjectRowSkeleton key={i} />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-xs text-text-muted-slate py-4 text-center">
                No subjects found in Question Bank. Click &quot;Seed Sample MCQs&quot; above to begin.
              </p>
            ) : (
              <div className="space-y-2">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectIds.includes(sub.id);
                  const count = subjectQuestionCounts[sub.id] || 2;
                  const available = poolBreakdown[sub.id] || 0;
                  const needed = count * 2;
                  const isShort = isSelected && available < needed;

                  return (
                    <div
                      key={sub.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-surface-onyx border-team-a-core/40 shadow-sm'
                          : 'bg-surface-onyx/40 border-border-subtle/40 opacity-60 hover:opacity-100 hover:border-border-medium'
                      }`}
                    >
                      {/* Checkbox & Subject info */}
                      <div
                        onClick={() => toggleSubject(sub.id)}
                        className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center text-xs shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-team-a-core border-team-a-core text-surface-obsidian font-bold'
                              : 'border-border-medium bg-surface-carbon'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-optic-white block truncate">
                            {sub.name}
                          </span>
                          {isSelected && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isShort ? (
                                <span className="text-[11px] font-mono text-state-warning-rose flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0" />
                                  <span>
                                    Short by {needed - available} (have {available}, need {needed})
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-team-b-ice flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>
                                    {available} available in bank (need {needed})
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stepper (only shown when selected) */}
                      {isSelected && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono text-text-muted-slate hidden sm:inline">
                            Per team:
                          </span>
                          <div className="flex items-center border border-border-medium rounded-lg bg-surface-carbon overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateSubjectCount(sub.id, -1)}
                              className="w-8 h-8 flex items-center justify-center text-text-bright-slate hover:text-optic-white hover:bg-surface-interactive active:scale-95 font-mono text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono text-sm font-bold text-optic-white">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateSubjectCount(sub.id, 1)}
                              className="w-8 h-8 flex items-center justify-center text-text-bright-slate hover:text-optic-white hover:bg-surface-interactive active:scale-95 font-mono text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 3. Scoring & Past Questions */}
          <Card variant="carbon" className="p-5 space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate block">
              Match Rules
            </span>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold text-optic-white block">
                  Points per correct MCQ
                </span>
                <span className="text-[11px] text-text-muted-slate">
                  Awarded immediately on correct answer
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={5}
                  value={pointsPerMcq}
                  onChange={(e) => setPointsPerMcq(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-16 bg-surface-obsidian border border-border-medium rounded-lg px-2.5 py-1.5 text-optic-white text-sm font-mono text-center focus:border-team-a-core focus:outline-none"
                />
                <span className="text-xs font-mono text-text-muted-slate">pts</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-semibold text-optic-white block">
                  Allow questions from past matches
                </span>
                <span className="text-[11px] text-text-muted-slate">
                  Enable if your question bank is running low
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={includeUsedQuestions}
                onClick={() => setIncludeUsedQuestions(!includeUsedQuestions)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 p-0.5 flex items-center ${
                  includeUsedQuestions ? 'bg-team-a-core' : 'bg-surface-interactive border border-border-medium'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    includeUsedQuestions ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Match Summary & Launch (5 cols) */}
        <div className="lg:col-span-5">
          <Card variant="carbon" className="p-5 space-y-4 sticky top-24">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate block pb-2 border-b border-border-subtle">
              Match Summary
            </span>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted-slate">Selected Subjects</span>
                <span className="font-mono font-bold text-optic-white">
                  {selectedSubjectIds.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted-slate">Questions per Team</span>
                <span className="font-mono font-bold text-optic-white">
                  {totalQuestionsPerTeam} questions
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted-slate">Total Match Questions</span>
                <span className="font-mono font-bold text-optic-white">
                  {totalMatchQuestions} questions
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted-slate">Questions Available</span>
                {validatingPool ? (
                  <Skeleton className="w-20 h-4 rounded bg-surface-interactive/60" />
                ) : (
                  <span
                    className={`font-mono font-bold ${
                      isPoolSufficient ? 'text-state-success' : 'text-state-warning-rose'
                    }`}
                  >
                    {poolTotal} available
                  </span>
                )}
              </div>
            </div>

            {/* Shortage Helper with 1-click resolve */}
            {!isPoolSufficient && selectedSubjectIds.length > 0 && (
              <div className="p-3 rounded-xl bg-state-warning-rose/10 border border-state-warning-rose/30 space-y-2">
                <p className="text-xs text-state-warning-rose font-mono">
                  Need {totalMatchQuestions - poolTotal} more questions.
                </p>
                {!includeUsedQuestions && (
                  <Button
                    variant="console"
                    size="sm"
                    onClick={() => setIncludeUsedQuestions(true)}
                    className="w-full text-xs font-mono"
                  >
                    Allow Past Questions
                  </Button>
                )}
              </div>
            )}

            {/* Start Match Button */}
            <div className="pt-2 border-t border-border-subtle space-y-2">
              <Button
                variant="team-a"
                size="lg"
                onClick={handleStartMatch}
                disabled={!isPoolSufficient || launching}
                className="w-full font-bold text-sm tracking-wider py-3 shadow-md"
              >
                {launching ? (
                  'Starting Match...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-4 h-4 fill-current" />
                    <span>START LIVE MATCH</span>
                  </span>
                )}
              </Button>

              {activeMatch && !isMatchFinished && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Discard the current active match?')) {
                      resetMatch();
                    }
                  }}
                  className="w-full text-[11px] font-mono text-text-muted-slate hover:text-state-warning-rose py-1 text-center transition-colors"
                >
                  Discard Saved Match
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
