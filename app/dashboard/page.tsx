import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Swords,
  BookOpen,
  Layers,
  Play,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getContestStats, getContestHistory } from '@/lib/actions/contests';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [stats, contests] = await Promise.all([
    getContestStats(),
    getContestHistory(),
  ]);

  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-7xl mx-auto space-y-8 transition-colors duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-team-b-cyan">
            BROADCAST STAGE DASHBOARD
          </span>
          <h1 className="text-3xl font-extrabold font-sans tracking-tight text-optic-white mt-1">
            PGC ARENA CONTROL
          </h1>
          <p className="text-xs text-text-muted-slate mt-1 font-sans">
            Overview of live tournament competitions, questions database, and contest archives
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Contest History Ledger */}
      <Card variant="carbon" className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Swords className="w-5 h-5 text-team-a-bright" />
            <h2 className="text-base font-bold font-sans tracking-wide text-optic-white uppercase">
              Tournament Contest Ledger
            </h2>
          </div>
          <span className="text-xs font-mono text-text-muted-slate">
            {contests.length} Completed Matches Recorded
          </span>
        </div>

        {contests.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-medium rounded-2xl space-y-3">
            <Swords className="w-10 h-10 text-text-muted-slate mx-auto opacity-40" />
            <h3 className="text-base font-bold text-optic-white font-sans">No Matches Recorded Yet</h3>
            <p className="text-xs text-text-muted-slate max-w-sm mx-auto font-sans">
              Configure teams and launch your first live stage competition. Contest records and used
              questions are committed automatically upon match conclusion.
            </p>
            <div className="pt-2">
              <Link href="/match-setup">
                <Button variant="team-a" size="sm">
                  <span>Start First Match</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted-slate uppercase font-semibold">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Contestants & Scores</th>
                  <th className="py-3 px-4">Winner</th>
                  <th className="py-3 px-4 text-center">Questions Used</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {contests.map((c) => {
                  const dateStr = new Date(c.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-surface-interactive/60 transition-colors"
                    >
                      <td className="py-4 px-4 text-text-muted-slate flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-team-a-bright">
                            {c.team_a_name} ({c.team_a_score})
                          </span>
                          <span className="text-text-muted-slate">vs</span>
                          <span className="font-bold text-team-b-cyan">
                            {c.team_b_name} ({c.team_b_score})
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Badge variant="success">
                          {c.winner_name || 'Tie'}
                        </Badge>
                      </td>

                      <td className="py-4 px-4 text-center tabular-nums text-optic-white font-bold">
                        {c.revealed_count || 0}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="text-state-success font-bold text-[11px] uppercase">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
