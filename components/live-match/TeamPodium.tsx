'use client';

import React from 'react';
import { Swords, Trophy } from 'lucide-react';

interface TeamPodiumProps {
  faction: 'TEAM_A' | 'TEAM_B';
  name: string;
  score: number;
  isActiveTurn: boolean;
}

export function TeamPodium({
  faction,
  name,
  score,
  isActiveTurn,
}: TeamPodiumProps) {
  const isTeamA = faction === 'TEAM_A';

  return (
    <div
      className={`relative rounded-xl transition-all duration-300 p-6 flex flex-col justify-between overflow-hidden ${
        isTeamA
          ? isActiveTurn
            ? 'bg-surface-carbon border-2 border-team-a-core glow-team-a'
            : 'bg-surface-onyx border border-white/10 opacity-75'
          : isActiveTurn
          ? 'bg-surface-carbon border-2 border-team-b-cyan glow-team-b'
          : 'bg-surface-onyx border border-white/10 opacity-75'
      }`}
    >
      {/* Background glowing gradient when active */}
      {isActiveTurn && (
        <div
          className={`absolute inset-0 pointer-events-none opacity-20 ${
            isTeamA
              ? 'bg-gradient-to-b from-team-a-core via-transparent to-transparent'
              : 'bg-gradient-to-b from-team-b-cyan via-transparent to-transparent'
          }`}
        />
      )}

      {/* Team Identifier Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isTeamA
                ? isActiveTurn ? 'bg-team-a-core shadow-[0_0_10px_#8B5CF6] animate-pulse' : 'bg-team-a-deep'
                : isActiveTurn ? 'bg-team-b-cyan shadow-[0_0_10px_#06B6D4] animate-pulse' : 'bg-team-b-ice/40'
            }`}
          />
          <span
            className={`font-mono text-xs font-bold uppercase tracking-widest ${
              isTeamA ? 'text-team-a-bright' : 'text-team-b-ice'
            }`}
          >
            {isTeamA ? 'TEAM ALPHA' : 'TEAM BETA'}
          </span>
        </div>

        {isActiveTurn && (
          <span
            className={`font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
              isTeamA
                ? 'bg-team-a-core text-surface-obsidian'
                : 'bg-team-b-cyan text-surface-obsidian'
            }`}
          >
            ACTIVE TURN
          </span>
        )}
      </div>

      {/* Team Name */}
      <div className="my-6 z-10">
        <h3 className="text-xl md:text-2xl font-extrabold text-optic-white truncate tracking-tight font-sans">
          {name}
        </h3>
      </div>

      {/* Digital Tabular Score */}
      <div className="z-10 flex items-baseline justify-between pt-4 border-t border-white/10">
        <span className="font-mono text-xs text-text-muted-slate uppercase tracking-wider">
          POINTS
        </span>
        <span
          className={`font-mono text-6xl md:text-7xl font-extrabold tracking-tight tabular-nums ${
            isTeamA ? 'text-team-a-bright' : 'text-team-b-ice'
          }`}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
