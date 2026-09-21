'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';
import { commitContestResult } from '@/lib/actions/contests';
import { soundFX } from '@/lib/utils/audio';

interface WinnerCelebrationProps {
  winnerName: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  revealedQuestionIds: string[];
  onPlayAgain: () => void;
}

export function WinnerCelebration({
  winnerName,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  revealedQuestionIds,
  onPlayAgain,
}: WinnerCelebrationProps) {
  const router = useRouter();
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    // Play zero-network victory fanfare
    soundFX.playVictory();

    // Stage fireworks celebration
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#3D52A0', '#7091E6', '#0E7490', '#124E66', '#9ACDEA'];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Automatically trigger single background atomic commit
    const handleCommit = async () => {
      setCommitting(true);
      try {
        await commitContestResult({
          team_a_name: teamAName,
          team_b_name: teamBName,
          team_a_score: teamAScore,
          team_b_score: teamBScore,
          winner_name: winnerName,
          revealed_question_ids: revealedQuestionIds,
        });
        setCommitted(true);
      } catch (err) {
        console.error('Error committing match:', err);
      } finally {
        setCommitting(false);
      }
    };

    handleCommit();
  }, [teamAName, teamBName, teamAScore, teamBScore, winnerName, revealedQuestionIds]);

  const isTeamAWinner = winnerName === teamAName;
  const isTeamBWinner = winnerName === teamBName;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-surface-carbon border border-border-medium rounded-2xl p-8 md:p-12 text-center shadow-modal-dialog relative overflow-hidden space-y-8">
        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-onyx border border-border-medium shadow-sm">
          <Trophy className="w-10 h-10 text-state-success" />
        </div>

        {/* Victory Announcement */}
        <div className="space-y-2 relative z-10">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-state-success">
            MATCH TOURNAMENT CONCLUDED
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-optic-white tracking-tight font-sans">
            {winnerName === 'Tie' ? 'MATCH TIED!' : `${winnerName} VICTORIOUS!`}
          </h1>
          <p className="text-sm text-text-muted-slate font-sans">
            {revealedQuestionIds.length} questions contested in this round
          </p>
        </div>

        {/* Final Scoreboard Breakdown */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto relative z-10">
          <div
            className={`p-5 rounded-xl border ${
              isTeamAWinner
                ? 'bg-team-a-core/15 border-team-a-core text-optic-white'
                : 'bg-surface-onyx border-border-subtle text-text-bright-slate'
            }`}
          >
            <span className="font-mono text-xs uppercase block text-team-a-bright mb-1">
              {teamAName}
            </span>
            <span className="font-mono text-4xl font-extrabold tabular-nums">
              {teamAScore}
            </span>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              isTeamBWinner
                ? 'bg-team-b-cyan/15 border-team-b-cyan text-optic-white'
                : 'bg-surface-onyx border-border-subtle text-text-bright-slate'
            }`}
          >
            <span className="font-mono text-xs uppercase block text-team-b-ice mb-1">
              {teamBName}
            </span>
            <span className="font-mono text-4xl font-extrabold tabular-nums">
              {teamBScore}
            </span>
          </div>
        </div>

        {/* Persistence Status */}
        <div className="text-xs font-mono text-text-muted-slate flex items-center justify-center gap-2">
          {committing ? (
            <span>Committing tournament record to database...</span>
          ) : committed ? (
            <span className="text-state-success flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Contest ledger record saved to database</span>
            </span>
          ) : null}
        </div>

        {/* Post-Match Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-border-subtle relative z-10">
          <Button
            variant="console"
            size="md"
            onClick={onPlayAgain}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Setup New Match</span>
          </Button>

          <Button
            variant="team-a"
            size="md"
            onClick={() => router.push('/dashboard')}
            className="w-full sm:w-auto font-bold"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
