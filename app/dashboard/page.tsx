import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  BookOpen,
  Layers,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getContestStats, getContestHistory } from '@/lib/actions/contests';
import { ContestLedger } from '@/components/dashboard/ContestLedger';
import { ResumeMatchBanner } from '@/components/dashboard/ResumeMatchBanner';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, contests] = await Promise.all([
    getContestStats(),
    getContestHistory(),
  ]);

  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-7xl mx-auto space-y-8 transition-colors duration-200">
      {/* Resume Postponed Match Banner if active */}
      <ResumeMatchBanner />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="min-w-0">
          <span className="font-mono text-xs uppercase tracking-widest text-team-b-cyan">
            BROADCAST STAGE DASHBOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight text-optic-white mt-1">
            PGC ARENA CONTROL
          </h1>
          <p className="text-xs text-text-muted-slate mt-1 font-sans">
            Overview of live tournament competitions, questions database, and contest archives
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Link href="/question-bank">
            <Button variant="console" size="md">
              <BookOpen className="w-4 h-4" />
              <span>Question Bank</span>
            </Button>
          </Link>

          <Link href="/match-setup">
            <Button variant="team-a" size="md" className="font-bold">
              <Play className="w-4 h-4 fill-white" />
              <span>Launch New Match</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Contests */}
        <Card variant="carbon" className="flex items-center gap-5 p-6">
          <div className="w-12 h-12 rounded-xl bg-team-a-core/15 border border-team-a-core/30 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-team-a-bright" />
          </div>
          <div>
            <span className="font-sans text-xs text-text-muted-slate uppercase tracking-wider block font-semibold">
              Total Contests Held
            </span>
            <span className="text-3xl font-bold text-optic-white tabular-nums font-sans">
              {stats.totalContests}
            </span>
          </div>
        </Card>

        {/* Questions in Bank */}
        <Card variant="carbon" className="flex items-center gap-5 p-6">
          <div className="w-12 h-12 rounded-xl bg-team-b-cyan/15 border border-team-b-cyan/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-team-b-cyan" />
          </div>
          <div>
            <span className="font-sans text-xs text-text-muted-slate uppercase tracking-wider block font-semibold">
              Questions in Bank
            </span>
            <span className="text-3xl font-bold text-optic-white tabular-nums font-sans">
              {stats.totalQuestions}
            </span>
          </div>
        </Card>

        {/* Active Subjects */}
        <Card variant="carbon" className="flex items-center gap-5 p-6">
          <div className="w-12 h-12 rounded-xl bg-surface-onyx border border-border-medium flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-state-success" />
          </div>
          <div>
            <span className="font-sans text-xs text-text-muted-slate uppercase tracking-wider block font-semibold">
              Active Subjects
            </span>
            <span className="text-3xl font-bold text-optic-white tabular-nums font-sans">
              {stats.totalSubjects}
            </span>
          </div>
        </Card>
      </div>

      {/* Contest History Ledger with Search & Pagination */}
      <ContestLedger contests={contests} />
    </div>
  );
}
