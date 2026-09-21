'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Play, PauseCircle, Users, ArrowRight } from 'lucide-react';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { Button } from '@/components/ui/Button';

export function ResumeMatchBanner() {
  const router = useRouter();
  const config = useTournamentStore((s) => s.config);
  const teams = useTournamentStore((s) => s.teams);
  const isMatchFinished = useTournamentStore((s) => s.isMatchFinished);
  const currentSubjectIndex = useTournamentStore((s) => s.currentSubjectIndex);
  const subjects = useTournamentStore((s) => s.subjects);

  if (!config || isMatchFinished || teams.length === 0) {
    return null;
  }

  const activeSubject = subjects[currentSubjectIndex];

  return (
    <div className="w-full p-4 rounded-2xl bg-surface-carbon border border-team-b-cyan/50 shadow-modal-dialog flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-team-b-cyan/15 border border-team-b-cyan/40 flex items-center justify-center shrink-0">
          <PauseCircle className="w-5 h-5 text-team-b-cyan" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-team-b-cyan/20 text-team-b-cyan border border-team-b-cyan/30">
              POSTPONED MATCH IN PROGRESS
            </span>
            <span className="text-xs font-mono text-text-muted-slate hidden md:inline">
              Round {currentSubjectIndex + 1} of {subjects.length} • {activeSubject?.name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-optic-white font-sans">
              {teams.length} Teams: {teams.map((t) => t.name).slice(0, 3).join(', ')}
              {teams.length > 3 ? ` +${teams.length - 3} more` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <Button
          variant="team-b"
          size="md"
          onClick={() => router.push('/live-match')}
          className="font-mono text-xs font-bold w-full sm:w-auto shadow-sm"
        >
          <span>RESUME POSTPONED MATCH</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
