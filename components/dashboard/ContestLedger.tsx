'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Swords,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Trophy,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Contest } from '@/lib/types/tournament';
import { useTournamentStore } from '@/lib/store/tournament-store';

interface ContestLedgerProps {
  contests: Contest[];
}

const MATCHES_PER_PAGE = 8;

export function renderContestStatus(status: string) {
  const norm = (status || 'completed').toLowerCase().trim();

  if (norm === 'postponed' || norm === 'paused') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-team-b-cyan/15 border border-team-b-cyan/40 text-team-b-cyan shadow-sm animate-pulse">
        <PauseCircle className="w-3 h-3 text-team-b-cyan shrink-0" />
        <span>POSTPONED</span>
      </span>
    );
  }

  if (norm === 'ongoing' || norm === 'in_progress' || norm === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-surface-interactive border border-state-success/40 text-optic-white shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-ping shrink-0" />
        <span>ONGOING</span>
      </span>
    );
  }

  if (norm === 'cancelled' || norm === 'abandoned') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-state-warning-rose/10 border border-state-warning-rose/30 text-state-warning-rose">
        <XCircle className="w-3 h-3 text-state-warning-rose shrink-0" />
        <span>CANCELLED</span>
      </span>
    );
  }

  // Default completed
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-state-success/10 border border-state-success/20 text-state-success">
      <CheckCircle2 className="w-3 h-3 text-state-success shrink-0" />
      <span>COMPLETED</span>
    </span>
  );
}

function renderWinnerBadge(c: Contest) {
  const norm = (c.status || '').toLowerCase().trim();

  if (norm === 'postponed' || norm === 'paused') {
    return (
      <Badge variant="warning" className="text-[11px] font-mono">
        PAUSED
      </Badge>
    );
  }

  if (norm === 'ongoing' || norm === 'in_progress' || norm === 'active') {
    return (
      <Badge variant="team-b" className="text-[11px] font-mono animate-pulse">
        IN PLAY
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      {c.winner_name || 'Tie'}
    </Badge>
  );
}

export function ContestLedger({ contests }: ContestLedgerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Active match state from local tournament store
  const activeConfig = useTournamentStore((s) => s.config);
  const activeTeams = useTournamentStore((s) => s.teams);
  const isMatchFinished = useTournamentStore((s) => s.isMatchFinished);
  const isPostponed = useTournamentStore((s) => s.isPostponed);
  const revealedQuestionIds = useTournamentStore((s) => s.revealedQuestionIds);

  // Synthesize active live/postponed match session if active in app
  const activeContest: Contest | null = useMemo(() => {
    if (!activeConfig || isMatchFinished || activeTeams.length === 0) {
      return null;
    }

    const teamAName = activeTeams[0]?.name || 'Team 1';
    const teamBName = activeTeams.length > 2
      ? `${activeTeams[1]?.name || 'Team 2'} (+${activeTeams.length - 2} teams)`
      : activeTeams[1]?.name || 'Team 2';

    return {
      id: 'active-live-match',
      team_a_name: teamAName,
      team_b_name: teamBName,
      team_a_score: activeTeams[0]?.score || 0,
      team_b_score: activeTeams[1]?.score || 0,
      winner_name: null,
      status: isPostponed ? 'postponed' : 'ongoing',
      created_at: new Date().toISOString(),
      revealed_count: revealedQuestionIds.length,
    };
  }, [activeConfig, isMatchFinished, activeTeams, isPostponed, revealedQuestionIds]);

  // Merge active session with recorded database history
  const allContests = useMemo(() => {
    if (activeContest) {
      return [activeContest, ...contests];
    }
    return contests;
  }, [activeContest, contests]);

  // Filter contests based on team names, winner, or status
  const filteredContests = useMemo(() => {
    if (!searchQuery.trim()) return allContests;
    const query = searchQuery.toLowerCase().trim();
    return allContests.filter(
      (c) =>
        c.team_a_name.toLowerCase().includes(query) ||
        c.team_b_name.toLowerCase().includes(query) ||
        c.status.toLowerCase().includes(query) ||
        (c.winner_name && c.winner_name.toLowerCase().includes(query))
    );
  }, [allContests, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContests.length / MATCHES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedContests = useMemo(() => {
    const start = (safeCurrentPage - 1) * MATCHES_PER_PAGE;
    return filteredContests.slice(start, start + MATCHES_PER_PAGE);
  }, [filteredContests, safeCurrentPage]);

  return (
    <Card variant="carbon" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <Swords className="w-5 h-5 text-team-a-bright shrink-0" />
          <div className="min-w-0">
            <h2 className="text-base font-bold font-sans tracking-wide text-optic-white uppercase">
              Tournament Contest Ledger
            </h2>
            <span className="text-xs font-mono text-text-muted-slate block">
              {allContests.length} {allContests.length === 1 ? 'Match' : 'Matches'} Recorded
              {activeContest && ' • 1 Active Stage Session'}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {allContests.length > 0 && (
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-text-muted-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by team, status, or winner..."
              className="w-full bg-surface-onyx border border-border-medium rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        )}
      </div>

      {allContests.length === 0 ? (
        /* Empty State: Zero matches recorded in database */
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
      ) : filteredContests.length === 0 ? (
        /* Empty State: Search filter yielded 0 matches */
        <div className="text-center py-10 border border-dashed border-border-medium rounded-xl space-y-2">
          <p className="text-xs font-mono text-text-muted-slate">
            No matches match your filter &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs font-mono text-team-a-bright hover:underline cursor-pointer"
          >
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table — hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted-slate uppercase font-semibold">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Contestants &amp; Scores</th>
                  <th className="py-3 px-4">Winner</th>
                  <th className="py-3 px-4 text-center">Questions Used</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {paginatedContests.map((c) => {
                  const isLiveSession = c.id === 'active-live-match';
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
                      onClick={() => {
                        if (isLiveSession) {
                          router.push('/live-match');
                        }
                      }}
                      className={`transition-colors ${
                        isLiveSession
                          ? 'bg-team-b-cyan/10 hover:bg-team-b-cyan/15 border-y border-team-b-cyan/30 cursor-pointer'
                          : 'hover:bg-surface-interactive/60'
                      }`}
                    >
                      <td className="py-4 px-4 text-text-muted-slate">
                        {isLiveSession ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-team-b-cyan/20 border border-team-b-cyan/40 text-[10px] font-mono font-bold text-team-b-cyan uppercase animate-pulse">
                              ACTIVE NOW
                            </span>
                            <span className="text-optic-white font-semibold">
                              {c.status === 'postponed' ? 'Postponed Session' : 'Live Arena Session'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-team-a-bright">
                            {c.team_a_name} ({c.team_a_score})
                          </span>
                          <span className="text-text-muted-slate">vs</span>
                          <span className="font-bold text-team-b-cyan">
                            {c.team_b_name} ({c.team_b_score})
                          </span>
                          {isLiveSession && (
                            <span className="text-[10px] font-mono font-bold text-team-b-cyan ml-1">
                              (Resume &rarr;)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {renderWinnerBadge(c)}
                      </td>

                      <td className="py-4 px-4 text-center tabular-nums text-optic-white font-bold">
                        {c.revealed_count || 0}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {renderContestStatus(c.status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View — shown only on mobile */}
          <div className="md:hidden space-y-3">
            {paginatedContests.map((c) => {
              const isLiveSession = c.id === 'active-live-match';
              const dateStr = new Date(c.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = new Date(c.created_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (isLiveSession) {
                      router.push('/live-match');
                    }
                  }}
                  className={`p-4 rounded-xl border space-y-3 ${
                    isLiveSession
                      ? 'bg-surface-carbon border-team-b-cyan/40 shadow-sm cursor-pointer'
                      : 'bg-surface-onyx border-border-subtle'
                  }`}
                >
                  {/* Date & Status row */}
                  <div className="flex items-center justify-between">
                    {isLiveSession ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-team-b-cyan font-bold">
                        <span className="w-2 h-2 rounded-full bg-team-b-cyan animate-ping shrink-0" />
                        <span>ACTIVE STAGE SESSION</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-muted-slate">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{dateStr} • {timeStr}</span>
                      </div>
                    )}
                    {renderContestStatus(c.status)}
                  </div>

                  {/* Teams */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-team-a-bright truncate">{c.team_a_name}</div>
                      <div className="text-2xl font-bold font-mono text-optic-white tabular-nums">{c.team_a_score}</div>
                    </div>
                    <div className="text-text-muted-slate text-xs font-mono font-bold shrink-0">VS</div>
                    <div className="text-center flex-1">
                      <div className="text-xs font-bold text-team-b-cyan truncate">{c.team_b_name}</div>
                      <div className="text-2xl font-bold font-mono text-optic-white tabular-nums">{c.team_b_score}</div>
                    </div>
                  </div>

                  {/* Winner & Questions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-team-b-cyan shrink-0" />
                      {renderWinnerBadge(c)}
                    </div>
                    <span className="text-[11px] font-mono text-text-muted-slate">
                      {c.revealed_count || 0} questions used
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {filteredContests.length > MATCHES_PER_PAGE && (
            <div className="pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-text-muted-slate text-[11px]">
                Showing {(safeCurrentPage - 1) * MATCHES_PER_PAGE + 1}–
                {Math.min(safeCurrentPage * MATCHES_PER_PAGE, filteredContests.length)} of{' '}
                {filteredContests.length} matches
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 px-2 text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-0.5" /> Prev
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      totalPages > 6 &&
                      Math.abs(pageNum - safeCurrentPage) > 2 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages
                    ) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span key={pageNum} className="text-text-muted-slate px-0.5 text-[10px]">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors cursor-pointer ${
                          safeCurrentPage === pageNum
                            ? 'bg-team-a-core text-surface-obsidian font-bold shadow-sm'
                            : 'bg-surface-onyx text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 px-2 text-xs cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
