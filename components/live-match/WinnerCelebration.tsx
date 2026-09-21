'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, ArrowRight, RotateCcw, CheckCircle2, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/Button';
import { commitContestResult } from '@/lib/actions/contests';
import { soundFX } from '@/lib/utils/audio';
import { Team } from '@/lib/types/tournament';

interface WinnerCelebrationProps {
  winnerName: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  revealedQuestionIds: string[];
  teams?: Team[];
  onPlayAgain: () => void;
}

export function WinnerCelebration({
  winnerName,
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  revealedQuestionIds,
  teams,
  onPlayAgain,
}: WinnerCelebrationProps) {
  const router = useRouter();
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  // Sorted leaderboard of all participating teams
  const rankedTeams = teams && teams.length > 0
    ? [...teams].sort((a, b) => b.score - a.score)
    : [
        { id: '1', name: teamAName, color: '#8B5CF6', score: teamAScore },
        { id: '2', name: teamBName, color: '#06B6D4', score: teamBScore },
      ].sort((a, b) => b.score - a.score);

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
          teams: rankedTeams,
        });
        setCommitted(true);
      } catch (err) {
        console.error('Error committing match:', err);
      } finally {
        setCommitting(false);
      }
    };

    handleCommit();
  }, [teamAName, teamBName, teamAScore, teamBScore, winnerName, revealedQuestionIds, rankedTeams]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-surface-carbon border border-border-medium rounded-2xl p-6 md:p-10 text-center shadow-modal-dialog relative overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-surface-onyx border border-border-medium shadow-sm">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-state-success animate-bounce" />
        </div>

        {/* Victory Announcement */}
        <div className="space-y-1 relative z-10">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-state-success">
            MATCH TOURNAMENT CONCLUDED
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-optic-white tracking-tight font-sans">
            {winnerName === 'Tie' ? 'MATCH TIED!' : `${winnerName} VICTORIOUS!`}
          </h1>
          <p className="text-xs md:text-sm text-text-muted-slate font-sans">
            {revealedQuestionIds.length} questions contested across {rankedTeams.length} teams
          </p>
        </div>

        {/* Ranked Leaderboard Breakdown */}
        <div className="space-y-2 max-w-lg mx-auto relative z-10 text-left">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-text-muted-slate block text-center mb-1">
            FINAL TOURNAMENT STANDINGS
          </span>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {rankedTeams.map((team, rankIdx) => {
              const isWinner = rankIdx === 0 && team.score > (rankedTeams[1]?.score ?? -1);
              return (
                <div
                  key={team.id || rankIdx}
                  style={isWinner ? { borderColor: team.color } : undefined}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isWinner
                      ? 'bg-surface-interactive border-2 shadow-sm'
                      : 'bg-surface-onyx border-border-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isWinner
                          ? 'bg-state-success text-surface-obsidian'
                          : 'bg-surface-carbon border border-border-subtle text-text-muted-slate'
                      }`}
                    >
                      {rankIdx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-bold text-optic-white text-sm md:text-base truncate">
                          {team.name}
                        </span>
                        {isWinner && (
                          <Award className="w-4 h-4 text-state-success shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono font-black text-xl tabular-nums ml-4" style={{ color: team.color }}>
                    {team.score} PTS
                  </div>
                </div>
              );
            })}
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
