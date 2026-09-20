'use client';

import React from 'react';
import { Sparkles, Zap, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface StageHeaderProps {
  subjectName: string;
  currentQuestionIndex: number;
  totalQuestionsInSubject: number;
  teamTurn: 'TEAM_A' | 'TEAM_B';
  teamAName: string;
  teamBName: string;
  isTieBreaker: boolean;
}

export function StageHeader({
  subjectName,
  currentQuestionIndex,
  totalQuestionsInSubject,
  teamTurn,
  teamAName,
  teamBName,
  isTieBreaker,
}: StageHeaderProps) {
  const isTeamA = teamTurn === 'TEAM_A';
  const activeTeamName = isTeamA ? teamAName : teamBName;

  return (
    <div className="w-full flex flex-col items-center justify-between gap-3 pb-6 border-b border-white/10">
      {/* Top Telemetry & Subject Pill */}
      <div className="flex items-center justify-between w-full">
        {/* Left: Round / Telemetry */}
        <div className="flex items-center gap-2">
          {isTieBreaker ? (
            <Badge variant="warning" className="px-3 py-1 text-xs animate-pulse">
              <Flame className="w-3.5 h-3.5 mr-1 inline text-state-warning-rose" />
              SUDDEN-DEATH SUPER OVER
            </Badge>
          ) : (
            <Badge variant="neutral" className="px-3 py-1 text-xs">
              QUESTION {String(currentQuestionIndex + 1).padStart(2, '0')} /{' '}
              {String(totalQuestionsInSubject).padStart(2, '0')}
            </Badge>
          )}
        </div>

        {/* Center: Current Subject */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-carbon border border-white/15 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-team-b-cyan" />
          <span className="font-mono text-xs uppercase font-bold text-optic-white tracking-widest">
            {isTieBreaker ? 'RANDOM MYSTERY SUBJECT' : subjectName}
          </span>
        </div>

        {/* Right: Broadcast Status Chip */}
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted-slate">
          <span className="w-2 h-2 rounded-full bg-state-success animate-ping" />
          <span className="text-optic-white font-bold tracking-wider">LIVE 0ms LOOP</span>
        </div>
      </div>

      {/* Central High-Intensity Turn Banner */}
      <div
        className={`w-full text-center py-2.5 px-6 rounded-lg transition-all duration-300 ${
          isTeamA
            ? 'bg-team-a-core/20 border border-team-a-core/60 shadow-[0_0_24px_rgba(139,92,246,0.35)]'
            : 'bg-team-b-cyan/20 border border-team-b-cyan/60 shadow-[0_0_24px_rgba(6,182,212,0.35)]'
        }`}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-text-bright-slate mr-2">
          ACTIVE TURN:
        </span>
        <span
          className={`font-mono text-base md:text-lg font-extrabold uppercase tracking-wider ${
            isTeamA ? 'text-team-a-bright' : 'text-team-b-ice'
          }`}
        >
          {activeTeamName}
        </span>
      </div>
    </div>
  );
}
