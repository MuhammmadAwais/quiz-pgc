'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Swords,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Trophy,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Contest } from '@/lib/types/tournament';

interface ContestLedgerProps {
  contests: Contest[];
}

const MATCHES_PER_PAGE = 8;

export function ContestLedger({ contests }: ContestLedgerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter contests based on team names or winner name
  const filteredContests = useMemo(() => {
    if (!searchQuery.trim()) return contests;
    const query = searchQuery.toLowerCase().trim();
    return contests.filter(
      (c) =>
        c.team_a_name.toLowerCase().includes(query) ||
        c.team_b_name.toLowerCase().includes(query) ||
        (c.winner_name && c.winner_name.toLowerCase().includes(query))
    );
  }, [contests, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredContests.length / MATCHES_PER_PAGE));

  // Reset to page 1 if search query changes and causes page out of bounds
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedContests = useMemo(() => {
    const start = (safeCurrentPage - 1) * MATCHES_PER_PAGE;
    return filteredContests.slice(start, start + MATCHES_PER_PAGE);
  }, [filteredContests, safeCurrentPage]);

  return (
    <Card variant="carbon" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <Swords className="w-5 h-5 text-team-a-bright" />
          <div>
            <h2 className="text-base font-bold font-sans tracking-wide text-optic-white uppercase">
              Tournament Contest Ledger
            </h2>
            <span className="text-xs font-mono text-text-muted-slate block">
              {contests.length} Completed Matches Recorded
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {contests.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by team or winner..."
              className="w-full bg-surface-onyx border border-border-medium rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-optic-white placeholder-text-muted-slate focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        )}
      </div>

      {contests.length === 0 ? (
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
            No completed matches match your search &ldquo;{searchQuery}&rdquo;.
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
                {paginatedContests.map((c) => {
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
                        <span className="text-state-success font-bold text-[11px] uppercase font-mono">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
