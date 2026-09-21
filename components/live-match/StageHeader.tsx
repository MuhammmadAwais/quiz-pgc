'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundFX } from '@/lib/utils/audio';

interface StageHeaderProps {
  subjectName: string;
  currentQuestionIndex: number;
  totalQuestionsInSubject: number;
  subjectIndex?: number;
  totalSubjects?: number;
  teamTurn?: string;
  activeTeamName?: string;
  activeTeamColor?: string;
  teamAName?: string;
  teamBName?: string;
  teamAColor?: string;
  teamBColor?: string;
  isTieBreaker: boolean;
  totalTeams?: number;
  activeTeamIndex?: number;
}

export function StageHeader({
  subjectName,
  currentQuestionIndex,
  totalQuestionsInSubject,
  subjectIndex = 0,
  totalSubjects = 1,
  teamTurn = 'TEAM_A',
  activeTeamColor: explicitActiveTeamColor,
  teamAColor,
  teamBColor,
  isTieBreaker,
}: StageHeaderProps) {
  const isTeamA = teamTurn === 'TEAM_A';
  const effectiveActiveTeamColor =
    explicitActiveTeamColor ||
    (isTeamA ? teamAColor || '#8B5CF6' : teamBColor || '#06B6D4');

  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(soundFX.isEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = soundFX.toggle();
    setSoundOn(newState);
  };

  // Question progress across current subject round
  const questionProgress =
    totalQuestionsInSubject > 0
      ? Math.min(
          100,
          Math.max(0, ((currentQuestionIndex + 1) / totalQuestionsInSubject) * 100)
        )
      : 0;

  return (
    <header
      className="w-full relative rounded-2xl bg-surface-carbon/90 border-2 backdrop-blur-md px-4 sm:px-6 py-3 shadow-modal-dialog transition-all duration-300 overflow-hidden"
      style={{
        borderColor: `${effectiveActiveTeamColor}55`,
        boxShadow: `0 0 24px -6px ${effectiveActiveTeamColor}22`,
      }}
    >
      {/* Top Ambient Glow Line accented in active team color */}
      <div
        className="absolute inset-x-0 top-0 h-[2.5px] transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, transparent, ${effectiveActiveTeamColor}, transparent)`,
        }}
      />

      {/* 3-Column True Center Grid */}
      <div className="flex flex-col md:grid md:grid-cols-3 items-center justify-between gap-3 sm:gap-4 w-full">
        {/* 1. Left: Round Status & Question Status */}
        <div className="flex items-center justify-center md:justify-start gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
          {/* Round Status */}
          <div
            className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-surface-onyx border transition-colors shadow-sm"
            style={{ borderColor: `${effectiveActiveTeamColor}35` }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: effectiveActiveTeamColor }}
            />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted-slate">
              ROUND
            </span>
            <span className="font-mono text-sm sm:text-base font-black text-optic-white tabular-nums">
              {subjectIndex + 1}
              <span className="text-text-muted-slate text-xs font-normal"> / </span>
              {totalSubjects}
            </span>
          </div>

          {/* Question Status */}
          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-surface-onyx border border-border-medium shadow-sm">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted-slate">
              QUESTION
            </span>
            <span
              className="font-mono text-sm sm:text-base font-black tabular-nums"
              style={{ color: effectiveActiveTeamColor }}
            >
              {String(currentQuestionIndex + 1).padStart(2, '0')}
              <span className="text-text-muted-slate text-xs font-normal"> / </span>
              {String(totalQuestionsInSubject).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* 2. Center: Prominent Subject Status (True Centered, No Icon) */}
        <div className="flex items-center justify-center w-full">
          <div
            className="flex flex-col items-center justify-center text-center px-6 sm:px-8 py-1.5 sm:py-2 rounded-xl border transition-all shadow-sm"
            style={{
              borderColor: `${effectiveActiveTeamColor}45`,
              backgroundColor: `${effectiveActiveTeamColor}12`,
            }}
          >
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted-slate text-center">
              CURRENT SUBJECT
            </span>
            <span className="font-mono text-base sm:text-lg md:text-xl font-black uppercase text-optic-white tracking-wider text-center truncate max-w-[260px] sm:max-w-md drop-shadow-sm">
              {isTieBreaker ? 'SUDDEN-DEATH SUPER OVER' : subjectName}
            </span>
          </div>
        </div>

        {/* 3. Right: Audio Synthesizer Mute Control */}
        <div className="flex items-center justify-center md:justify-end gap-3 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={handleToggleSound}
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              soundOn
                ? 'bg-surface-onyx border-border-medium text-optic-white hover:bg-surface-interactive'
                : 'bg-surface-onyx border-border-subtle text-text-muted-slate hover:text-optic-white'
            }`}
            style={soundOn ? { borderColor: `${effectiveActiveTeamColor}45` } : undefined}
            title={soundOn ? 'Mute tournament sound effects' : 'Enable tournament sound effects'}
            aria-label={soundOn ? 'Mute tournament sound effects' : 'Enable tournament sound effects'}
          >
            {soundOn ? (
              <>
                <Volume2 className="w-4 h-4" style={{ color: effectiveActiveTeamColor }} />
                <span className="font-mono text-xs font-bold tracking-wider hidden sm:inline">
                  AUDIO ON
                </span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-text-muted-slate" />
                <span className="font-mono text-xs font-bold tracking-wider text-text-muted-slate hidden sm:inline">
                  MUTED
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Bottom Progression Bar Accented in Active Team Color */}
      <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-border-subtle/30 overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{
            width: `${questionProgress}%`,
            backgroundColor: effectiveActiveTeamColor,
          }}
        />
      </div>
    </header>
  );
}
