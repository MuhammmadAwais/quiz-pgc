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
  Plus,
  Trash2,
  Clock,
  Palette,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton, SubjectRowSkeleton } from '@/components/ui/Skeleton';
import { Subject, TournamentConfig, Team } from '@/lib/types/tournament';
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

interface TeamItem {
  id: string;
  name: string;
  color: string;
}

const TIMER_PRESETS = [
  { label: 'Untimed', value: 0 },
  { label: '15s Blitz', value: 15 },
  { label: '30s Standard', value: 30 },
  { label: '45s Collegiate', value: 45 },
  { label: '60s Deep-Dive', value: 60 },
];

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
  const activeMatchTeams = useTournamentStore((s) => s.teams);
  const isMatchFinished = useTournamentStore((s) => s.isMatchFinished);

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Multi-team Roster (2 to 12 teams)
  const [teams, setTeams] = useState<TeamItem[]>([
    { id: '1', name: 'Alpha Titans', color: '#8B5CF6' },
    { id: '2', name: 'Cyber Phoenix', color: '#06B6D4' },
  ]);

  // Per-MCQ Timer state (0 = disabled)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);
  const [customTimerInput, setCustomTimerInput] = useState<string>('');

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

  // Fetch pool stats for all available subjects
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

  const handleAddTeam = () => {
    if (teams.length >= 12) return;
    const nextIndex = teams.length + 1;
    const preset = CURATED_TEAM_PRESETS[(nextIndex - 1) % CURATED_TEAM_PRESETS.length];
    setTeams((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: `Team ${String.fromCharCode(64 + nextIndex)}`,
        color: preset?.hex || '#F59E0B',
      },
    ]);
  };

  const handleRemoveTeam = (id: string) => {
    if (teams.length <= 2) return;
    setTeams((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTeam = (id: string, updates: Partial<TeamItem>) => {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

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
  const totalMatchQuestions = totalQuestionsPerTeam * teams.length;

  const isPoolSufficient =
    selectedSubjectIds.length > 0 &&
    selectedSubjectIds.every(
      (id) => (poolBreakdown[id] || 0) >= (subjectQuestionCounts[id] || 2) * teams.length
    );

  // Detect duplicate colors among teams
  const duplicateColorFound = (() => {
    const seen = new Set<string>();
    for (const t of teams) {
      const hex = t.color.toLowerCase();
      if (seen.has(hex)) return true;
      seen.add(hex);
    }
    return false;
  })();

  const handleStartMatch = async () => {
    if (!isPoolSufficient || launching) return;

    setLaunching(true);
    try {
      // Validate all team colors for contrast against obsidian background
      const validatedTeams: Team[] = teams.map((t) => {
        const safety = getAccessibleTeamColor(t.color, isDarkMode);
        return {
          id: t.id,
          name: t.name.trim() || `Team ${t.id}`,
          color: safety.safeColor,
          score: 0,
        };
      });

      const config: TournamentConfig = {
        teams: validatedTeams,
        timeLimitSeconds,
        teamAName: validatedTeams[0].name,
        teamBName: validatedTeams[1].name,
        teamAColor: validatedTeams[0].color,
        teamBColor: validatedTeams[1].color,
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
    <div className="min-h-screen bg-surface-obsidian p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wide text-optic-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-team-a-core" />
            <span>Match Setup Console</span>
          </h1>
          <p className="text-xs text-text-muted-slate mt-0.5">
            Configure 2 to 12 teams, set per-MCQ stage timers, and assign subject quotas
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
              RESUME ACTIVE MATCH ({activeMatchTeams.length} TEAMS) →
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Configuration Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-5 order-2 lg:order-1">
          {/* 1. Multi-Team Roster (2-12 Teams) */}
          <Card variant="carbon" className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-team-b-cyan" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate">
                  Team Roster ({teams.length} of 12)
                </span>
              </div>
              <Button
                variant="console"
                size="sm"
                onClick={handleAddTeam}
                disabled={teams.length >= 12}
                className="text-xs font-mono"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Team</span>
              </Button>
            </div>

            {duplicateColorFound && (
              <div className="p-2.5 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Some teams currently share the same color. Please choose distinct colors for stage visual clarity.</span>
              </div>
            )}

            <div className="space-y-3">
              {teams.map((team, idx) => {
                const safety = getAccessibleTeamColor(team.color, isDarkMode);
                return (
                  <div
                    key={team.id}
                    className="p-3.5 rounded-xl bg-surface-onyx border border-border-subtle space-y-2.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className="text-[11px] font-mono font-bold flex items-center gap-1.5"
                        style={{ color: safety.safeColor }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: safety.safeColor }}
                        />
                        TEAM #{idx + 1}
                      </span>

                      {teams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTeam(team.id)}
                          className="p-1 rounded text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors cursor-pointer"
                          title="Remove team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-8">
                        <Input
                          value={team.name}
                          onChange={(e) => handleUpdateTeam(team.id, { name: e.target.value })}
                          placeholder={`Team ${idx + 1} Name`}
                          className="text-xs font-semibold"
                        />
                      </div>

                      {/* Color Wheel & Swatch Selector */}
                      <div className="sm:col-span-4 flex items-center gap-2">
                        <label
                          className="relative w-8 h-8 rounded-lg cursor-pointer shrink-0 border border-border-medium overflow-hidden shadow-sm hover:scale-105 transition-transform"
                          title="Click to open color wheel"
                        >
                          <input
                            type="color"
                            value={team.color}
                            onChange={(e) => handleUpdateTeam(team.id, { color: e.target.value })}
                            className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer opacity-0"
                          />
                          <div className="w-full h-full" style={{ backgroundColor: team.color }} />
                        </label>

                        <input
                          type="text"
                          value={team.color.toUpperCase()}
                          onChange={(e) => handleUpdateTeam(team.id, { color: e.target.value })}
                          maxLength={7}
                          className="w-20 h-8 bg-surface-carbon border border-border-medium rounded-lg px-2 text-[11px] font-mono text-optic-white text-center focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Presets Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {CURATED_TEAM_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleUpdateTeam(team.id, { color: preset.hex })}
                          className={`w-5 h-5 rounded-full border transition-all shrink-0 cursor-pointer ${
                            team.color.toLowerCase() === preset.hex.toLowerCase()
                              ? 'ring-2 ring-brand-primary scale-110 border-white shadow-sm'
                              : 'border-border-subtle opacity-75 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 2. Per-MCQ Stage Timer */}
          <Card variant="carbon" className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-team-b-cyan" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate">
                  Per-MCQ Stage Clock
                </span>
              </div>
              <span className="text-[11px] font-mono text-team-b-ice font-bold">
                {timeLimitSeconds === 0 ? 'Untimed (No Limit)' : `${timeLimitSeconds}s Limit`}
              </span>
            </div>

            <p className="text-xs text-text-muted-slate">
              Withstands tab reloads, hardware sleep, and network disconnects. Switches colors through 3 phases with audio cues.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {TIMER_PRESETS.map((preset) => {
                const isSelected = timeLimitSeconds === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setTimeLimitSeconds(preset.value);
                      setCustomTimerInput('');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-team-b-cyan/20 border-team-b-cyan text-optic-white shadow-sm'
                        : 'bg-surface-onyx border-border-subtle text-text-muted-slate hover:text-optic-white hover:border-border-medium'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Seconds Input */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-mono text-text-muted-slate">Custom Seconds:</span>
              <input
                type="number"
                min="5"
                max="300"
                value={customTimerInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomTimerInput(val);
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0) {
                    setTimeLimitSeconds(num);
                  }
                }}
                placeholder="e.g. 20"
                className="w-24 h-8 bg-surface-onyx border border-border-medium rounded-lg px-2.5 text-xs font-mono text-optic-white focus:outline-none focus:border-brand-primary"
              />
            </div>
          </Card>

          {/* 3. Subjects & Question Quotas */}
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
                  const needed = count * teams.length;
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
                                    Short by {needed - available} (bank: {available}, needs {count} × {teams.length} = {needed})
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-team-b-ice flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>
                                    {available} in bank (needs {count} × {teams.length} = {needed})
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stepper */}
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

          {/* 4. Scoring & Rules */}
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
                  Awarded immediately on verbal confirmation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pointsPerMcq}
                  onChange={(e) => setPointsPerMcq(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-16 h-8 bg-surface-onyx border border-border-medium rounded-lg px-2 text-xs font-mono text-optic-white text-center focus:outline-none"
                />
                <span className="text-xs font-mono text-text-muted-slate">PTS</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-optic-white block">
                  Include previously used questions
                </span>
                <span className="text-[11px] text-text-muted-slate">
                  Disable for fresh questions strictly
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIncludeUsedQuestions(!includeUsedQuestions)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  includeUsedQuestions ? 'bg-team-a-core' : 'bg-surface-recessed'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md absolute top-1 transition-transform ${
                    includeUsedQuestions ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: Sticky Summary & Launch (5 cols) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4 order-1 lg:order-2">
          <Card variant="carbon" className="p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-text-muted-slate">
                Match Summary
              </span>
              <Badge variant={isPoolSufficient ? 'success' : 'warning'} className="text-[10px] font-mono">
                {isPoolSufficient ? 'READY TO LAUNCH' : 'INSUFFICIENT POOL'}
              </Badge>
            </div>

            {/* Participating Teams List */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-text-muted-slate block">
                ROSTER ({teams.length} TEAMS)
              </span>
              <div className="flex flex-wrap gap-2">
                {teams.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-onyx border border-border-subtle text-xs font-mono"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="font-bold text-optic-white truncate max-w-[120px]">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-surface-onyx border border-border-subtle">
                <span className="text-text-muted-slate block text-[10px]">MCQs PER TEAM</span>
                <span className="text-base font-bold text-optic-white">{totalQuestionsPerTeam}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-onyx border border-border-subtle">
                <span className="text-text-muted-slate block text-[10px]">TOTAL QUESTIONS</span>
                <span className="text-base font-bold text-optic-white">{totalMatchQuestions}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-onyx border border-border-subtle">
                <span className="text-text-muted-slate block text-[10px]">STAGE TIMER</span>
                <span className="text-base font-bold text-team-b-ice">
                  {timeLimitSeconds === 0 ? 'Off' : `${timeLimitSeconds}s`}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-onyx border border-border-subtle">
                <span className="text-text-muted-slate block text-[10px]">POINTS PER MCQ</span>
                <span className="text-base font-bold text-optic-white">{pointsPerMcq} PTS</span>
              </div>
            </div>

            {/* Validation Banner */}
            {!isPoolSufficient && (
              <div className="p-3 rounded-xl bg-state-warning-rose/15 border border-state-warning-rose/30 text-state-warning-rose text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Question Bank Deficit</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The selected subjects don&apos;t have enough questions to supply {teams.length} teams.
                  Reduce questions per team or seed more MCQs in the Question Bank.
                </p>
              </div>
            )}

            {/* Launch Button */}
            <Button
              variant="team-a"
              size="lg"
              onClick={handleStartMatch}
              disabled={!isPoolSufficient || launching}
              className="w-full font-mono text-sm font-bold tracking-wider py-4 shadow-sm"
            >
              {launching ? (
                <span>PREPARING ZERO-NETWORK STAGE...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  <span>LAUNCH LIVE ARENA MATCH</span>
                </>
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
