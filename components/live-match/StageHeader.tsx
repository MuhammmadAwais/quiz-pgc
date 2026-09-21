'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Flame, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { soundFX } from '@/lib/utils/audio';

interface StageHeaderProps {
  subjectName: string;
  currentQuestionIndex: number;
  totalQuestionsInSubject: number;
  subjectIndex?: number;
  totalSubjects?: number;
  teamTurn: 'TEAM_A' | 'TEAM_B';
  teamAName: string;
  teamBName: string;
  teamAColor?: string;
  teamBColor?: string;
  isTieBreaker: boolean;
}

export function StageHeader({
  subjectName,
  currentQuestionIndex,
  totalQuestionsInSubject,
  subjectIndex = 0,
  totalSubjects = 1,
  teamTurn,
  teamAName,
  teamBName,
  teamAColor,
  teamBColor,
  isTieBreaker,
}: StageHeaderProps) {
  const isTeamA = teamTurn === 'TEAM_A';
  const activeTeamName = isTeamA ? teamAName : teamBName;
  const activeTeamColor = isTeamA
    ? teamAColor || '#8B5CF6'
    : teamBColor || '#06B6D4';

  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(soundFX.isEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = soundFX.toggle();
    setSoundOn(newState);
  };

  return (
    <div className="w-full flex flex-col items-center justify-between gap-3 pb-6 border-b border-border-subtle">
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
            <div className="flex items-center gap-2">
              <Badge variant="team-a" className="px-2.5 py-1 text-xs font-mono">
                ROUND {subjectIndex + 1}/{totalSubjects}
              </Badge>
              <Badge variant="neutral" className="px-3 py-1 text-xs font-mono">
                QUESTION {String(currentQuestionIndex + 1).padStart(2, '0')} /{' '}
                {String(totalQuestionsInSubject).padStart(2, '0')}
              </Badge>
            </div>
          )}
        </div>

        {/* Center: Current Subject */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-carbon border border-border-medium shadow-sm">
          <Zap className="w-3.5 h-3.5 text-team-b-cyan" />
          <span className="font-mono text-xs uppercase font-bold text-optic-white tracking-widest">
            {isTieBreaker ? 'RANDOM MYSTERY SUBJECT' : subjectName}
          </span>
        </div>

        {/* Right: Broadcast Status Chip & Sound Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSound}
            className="p-1.5 rounded-lg bg-surface-carbon border border-border-medium text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive transition-colors cursor-pointer"
            title={soundOn ? 'Mute tournament sound effects' : 'Enable tournament sound effects'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-team-b-cyan" />
            ) : (
              <VolumeX className="w-4 h-4 text-text-muted-slate" />
            )}
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-text-muted-slate">
            <span className="w-2 h-2 rounded-full bg-state-success animate-ping" />
            <span className="text-optic-white font-bold tracking-wider">LIVE 0ms LOOP</span>
          </div>
        </div>
      </div>

      {/* Central High-Intensity Turn Banner with Custom Team Color */}
      <div
        style={{
          backgroundColor: `${activeTeamColor}18`,
          borderColor: activeTeamColor,
        }}
        className="w-full text-center py-2.5 px-6 rounded-lg transition-all duration-300 shadow-sm border"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-text-bright-slate mr-2">
          ACTIVE TURN:
        </span>
        <span
          style={{ color: activeTeamColor }}
          className="font-mono text-base md:text-lg font-extrabold uppercase tracking-wider"
        >
          {activeTeamName}
        </span>
      </div>
    </div>
  );
}

