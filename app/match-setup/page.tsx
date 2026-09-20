'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Layers,
  Settings2,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Subject, TournamentConfig } from '@/lib/types/tournament';
import { getSubjects } from '@/lib/actions/subjects';
import { getPoolStats, fetchEligibleQuestions, seedSampleQuestions } from '@/lib/actions/questions';
import { useTournamentStore } from '@/lib/store/tournament-store';

export default function MatchSetupPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  // Active in-progress match detection from persisted store
  const activeMatch = useTournamentStore((s) => s.config);
  const isMatchFinished = useTournamentStore((s) => s.isMatchFinished);
  const teamAScore = useTournamentStore((s) => s.teamAScore);
  const teamBScore = useTournamentStore((s) => s.teamBScore);
  const resetMatch = useTournamentStore((s) => s.resetMatch);

  // Form State
  const [teamAName, setTeamAName] = useState('Alpha Titans');
  const [teamBName, setTeamBName] = useState('Cyber Phoenix');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});
  const [pointsPerMcq, setPointsPerMcq] = useState(10);
  const [includeUsedQuestions, setIncludeUsedQuestions] = useState(false);

  // Pool Validation State
  const [poolTotal, setPoolTotal] = useState(0);
  const [poolBreakdown, setPoolBreakdown] = useState<Record<string, number>>({});
  const [validatingPool, setValidatingPool] = useState(false);

  useEffect(() => {
    async function init() {
      const subs = await getSubjects();
      setSubjects(subs);

      const defaultCounts: Record<string, number> = {};
      subs.forEach((s) => {
        defaultCounts[s.id] = 2; // Default 2 MCQs per team
      });
      setSubjectQuestionCounts(defaultCounts);

      if (subs.length > 0) {
        setSelectedSubjectIds(subs.slice(0, 3).map((s) => s.id));
      }
      setLoading(false);
    }
    init();
  }, []);

  // Recalculate pool whenever selection or toggle changes
  useEffect(() => {
    async function validate() {
      if (selectedSubjectIds.length === 0) {
        setPoolTotal(0);
        setPoolBreakdown({});
        return;
      }

      setValidatingPool(true);
      try {
        const stats = await getPoolStats(selectedSubjectIds, includeUsedQuestions);
        setPoolTotal(stats.totalAvailable);
        setPoolBreakdown(stats.breakdown);
      } finally {
        setValidatingPool(false);
      }
    }
    validate();
  }, [selectedSubjectIds, includeUsedQuestions]);

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

  // Total required: Sum of (Count per team * 2 teams) for each selected subject
  const totalRequiredQuestions = selectedSubjectIds.reduce(
    (sum, id) => sum + (subjectQuestionCounts[id] || 2) * 2,
    0
  );

  const isPoolSufficient =
    selectedSubjectIds.length > 0 &&
    selectedSubjectIds.every((id) => (poolBreakdown[id] || 0) >= (subjectQuestionCounts[id] || 2) * 2);

  const handleStartMatch = async () => {
    if (!isPoolSufficient || launching) return;

    setLaunching(true);
    try {
      const config: TournamentConfig = {
        teamAName: teamAName.trim() || 'Team A',
        teamBName: teamBName.trim() || 'Team B',
        selectedSubjectIds,
        subjectQuestionCounts,
        mcqsPerSubject: 2,
        pointsPerMcq,
        includeUsedQuestions,
      };

      const selectedSubjectsList = subjects.filter((s) => selectedSubjectIds.includes(s.id));
      const questionsGrouped = await fetchEligibleQuestions(config);

      // Hydrate offline Zustand Store
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
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-carbon border border-white/15 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.3)]">
            <Swords className="w-5 h-5 text-team-a-bright" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-wide text-optic-white">
              MATCH SETUP CONSOLE
            </h1>
            <p className="text-xs text-text-muted-slate mt-0.5">
              Configure team factions, per-subject question quotas, and verify pool readiness
            </p>
          </div>
        </div>

        {subjects.length === 0 && (
          <Button
            variant="team-b"
            size="sm"
            onClick={handleSeedQuick}
            disabled={seedLoading}
          >
            <Sparkles className="w-4 h-4" />
            <span>{seedLoading ? 'Loading Sample MCQs...' : 'Seed Sample MCQs'}</span>
          </Button>
        )}
      </div>

      {/* Disaster Recovery Banner: Active Match Detected */}
      {activeMatch && !isMatchFinished && (
        <div className="p-4 rounded-xl bg-surface-carbon border-2 border-team-a-core/60 shadow-[0_0_24px_rgba(139,92,246,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase font-extrabold text-team-a-bright flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-team-a-core animate-ping" />
              ACTIVE LIVE TOURNAMENT IN PROGRESS
            </span>
            <p className="text-sm font-semibold text-optic-white">
              {activeMatch.teamAName} ({teamAScore}) vs {activeMatch.teamBName} ({teamBScore})
            </p>
            <p className="text-xs text-text-muted-slate">
              Your stage session is 100% preserved in browser storage. You can jump back into the arena
              without losing any score or turn progress.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm('Discard the current active match and start a new setup?')) {
                  resetMatch();
                }
              }}
            >
              Discard Match
            </Button>
            <Button
              variant="team-a"
              size="sm"
              onClick={() => router.push('/live-match')}
              className="font-bold font-mono"
            >
              RESUME LIVE MATCH →
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Match Parameters Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Team Factions */}
          <Card variant="carbon" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                Team Faction Designations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-surface-onyx border border-team-a-core/30 space-y-2">
                <span className="text-xs font-mono font-bold text-team-a-bright uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-team-a-core animate-pulse" />
                  Team Alpha (Violet)
                </span>
                <Input
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  placeholder="Team A Name"
                  className="font-semibold text-optic-white"
                />
              </div>

              <div className="p-4 rounded-lg bg-surface-onyx border border-team-b-cyan/30 space-y-2">
                <span className="text-xs font-mono font-bold text-team-b-ice uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-team-b-cyan animate-pulse" />
                  Team Beta (Cyan)
                </span>
                <Input
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  placeholder="Team B Name"
                  className="font-semibold text-optic-white"
                />
              </div>
            </div>
          </Card>

          {/* Subject Selection & Custom MCQ Counts Per Team */}
          <Card variant="carbon" className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                Tournament Subjects & Per-Team Quotas
              </span>
              <span className="text-[11px] font-mono text-text-muted-slate">
                Sequential Blocks: Team A finishes subject, then Team B
              </span>
            </div>

            {subjects.length === 0 ? (
              <p className="text-xs text-text-muted-slate p-4 text-center">
                No subjects found in Question Bank. Click &quot;Seed Sample MCQs&quot; above to get started.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    const availableCount = poolBreakdown[sub.id] || 0;
                    const countPerTeam = subjectQuestionCounts[sub.id] || 2;
                    const needed = countPerTeam * 2;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => toggleSubject(sub.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-team-a-core/15 border-team-a-core text-optic-white shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                            : 'bg-surface-onyx border-white/8 hover:bg-surface-interactive text-text-bright-slate'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                              isSelected
                                ? 'bg-team-a-core border-team-a-core text-surface-obsidian'
                                : 'border-white/20 bg-surface-carbon'
                            }`}
                          >
                            {isSelected && '✓'}
                          </div>
                          <span className="text-xs font-medium">{sub.name}</span>
                        </div>

                        <Badge
                          variant={availableCount >= needed ? 'success' : 'warning'}
                          className="text-[10px]"
                        >
                          {availableCount} eligible
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Individual Subject MCQs Steppers */}
                {selectedSubjectIds.length > 0 && (
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-optic-white block">
                      Custom MCQs Per Team (Each Team Answers)
                    </span>
                    <p className="text-[11px] text-text-muted-slate">
                      Configure how many questions each team answers for each selected subject. Team A answers their set, followed by Team B.
                    </p>

                    <div className="space-y-2.5">
                      {selectedSubjectIds.map((id) => {
                        const sub = subjects.find((s) => s.id === id);
                        if (!sub) return null;
                        const count = subjectQuestionCounts[id] || 2;
                        const available = poolBreakdown[id] || 0;
                        const needed = count * 2;
                        const hasEnough = available >= needed;

                        return (
                          <div
                            key={id}
                            className="p-3 rounded-lg bg-surface-onyx border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-optic-white">{sub.name}</span>
                                <Badge variant={hasEnough ? 'success' : 'warning'} className="text-[10px]">
                                  {hasEnough ? `${available} in pool` : `Shortage: need ${needed - available} more`}
                                </Badge>
                              </div>
                              <span className="text-[11px] font-mono text-text-muted-slate block mt-0.5">
                                Match needs {needed} distinct MCQs ({count} for {teamAName || 'Team A'}, {count} for {teamBName || 'Team B'})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className="text-xs font-mono text-text-muted-slate mr-1">Per team:</span>
                              <button
                                type="button"
                                onClick={() => updateSubjectCount(id, -1)}
                                className="w-7 h-7 rounded bg-surface-interactive border border-white/20 text-optic-white flex items-center justify-center hover:bg-white/20 font-mono text-sm active:scale-95"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-mono text-sm font-bold text-optic-white">
                                {count}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateSubjectCount(id, 1)}
                                className="w-7 h-7 rounded bg-surface-interactive border border-white/20 text-optic-white flex items-center justify-center hover:bg-white/20 font-mono text-sm active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Scoring & History Exclusion Rules */}
          <Card variant="carbon" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <Settings2 className="w-4 h-4 text-team-b-ice" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                Match Scoring & History Rules
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast mb-1.5">
                  Points per Correct MCQ
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={5}
                  value={pointsPerMcq}
                  onChange={(e) => setPointsPerMcq(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full bg-surface-obsidian border border-white/20 rounded-md px-4 py-2 text-optic-white text-sm font-mono focus:border-team-a-core focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-text-muted-slate">
                  Awarded instantly upon correct answer on stage. Zero for misses.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast mb-1.5">
                  Question Repetition
                </label>
                <div className="p-3 rounded bg-surface-onyx border border-white/10 text-xs font-mono text-state-success flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-state-success shrink-0" />
                  <span>Zero intra-match repetition strictly enforced</span>
                </div>
              </div>
            </div>

            {/* Toggle: Include Used Questions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-optic-white block">
                  Include Previously Used Questions
                </span>
                <span className="text-[11px] text-text-muted-slate">
                  {includeUsedQuestions
                    ? 'Questions played in previous tournament contests are eligible to be asked again.'
                    : 'Questions played in past contests are strictly excluded from the pool.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIncludeUsedQuestions(!includeUsedQuestions)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  includeUsedQuestions ? 'bg-team-a-core' : 'bg-surface-interactive border border-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-optic-white absolute top-1 transition-transform ${
                    includeUsedQuestions ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Pool Verification Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="carbon" className="space-y-6 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-optic-white">
                Live Pool Readiness
              </span>
              {validatingPool ? (
                <span className="text-xs font-mono text-text-muted-slate animate-pulse">
                  Querying...
                </span>
              ) : isPoolSufficient ? (
                <Badge variant="success">STAGE READY</Badge>
              ) : (
                <Badge variant="warning">INSUFFICIENT</Badge>
              )}
            </div>

            {/* Telemetry Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-surface-onyx border border-white/10 text-center">
                <span className="font-mono text-[10px] text-text-muted-slate uppercase block">
                  Total Match MCQs
                </span>
                <span className="font-mono text-3xl font-bold text-optic-white tabular-nums">
                  {totalRequiredQuestions}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-surface-onyx border border-white/10 text-center">
                <span className="font-mono text-[10px] text-text-muted-slate uppercase block">
                  Eligible in Pool
                </span>
                <span
                  className={`font-mono text-3xl font-bold tabular-nums ${
                    isPoolSufficient ? 'text-state-success' : 'text-state-warning-rose'
                  }`}
                >
                  {poolTotal}
                </span>
              </div>
            </div>

            {/* Subject Breakdown List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-text-muted-slate uppercase tracking-wider block">
                Subject Quota Breakdown
              </span>

              {selectedSubjectIds.length === 0 ? (
                <p className="text-xs text-text-muted-slate py-2">
                  Select at least one subject to verify question quotas.
                </p>
              ) : (
                selectedSubjectIds.map((id) => {
                  const sub = subjects.find((s) => s.id === id);
                  const countPerTeam = subjectQuestionCounts[id] || 2;
                  const needed = countPerTeam * 2;
                  const available = poolBreakdown[id] || 0;
                  const satisfied = available >= needed;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded bg-surface-onyx text-xs"
                    >
                      <span className="text-text-bright-slate truncate mr-2">
                        {sub?.name || 'Unknown'}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-text-muted-slate">
                          {available} / {needed} needed
                        </span>
                        {satisfied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-state-success" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-state-warning-rose" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Launch Call-To-Action */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {!isPoolSufficient && selectedSubjectIds.length > 0 && (
                <p className="text-xs text-state-warning-rose font-mono flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Some selected subjects do not have enough eligible questions. Reduce MCQs per
                    team, add questions in Question Bank, or enable &quot;Include Used Questions&quot;.
                  </span>
                </p>
              )}

              <Button
                variant="team-a"
                size="lg"
                onClick={handleStartMatch}
                disabled={!isPoolSufficient || launching}
                className="w-full text-base font-bold shadow-[0_0_24px_rgba(139,92,246,0.4)]"
              >
                {launching ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-surface-obsidian border-t-transparent rounded-full animate-spin" />
                    Partitioning Zero-Network Loop...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play className="w-5 h-5 fill-surface-obsidian" />
                    <span>LAUNCH TO LIVE MATCH STAGE</span>
                  </span>
                )}
              </Button>

              <p className="text-[10px] font-mono text-center text-text-muted-slate">
                100% Offline Zero-Network Loop with persistent auto-recovery.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
