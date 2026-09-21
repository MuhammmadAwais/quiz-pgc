'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Eye,
  LogOut,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { StageHeader } from '@/components/live-match/StageHeader';
import { TeamPodium } from '@/components/live-match/TeamPodium';
import { OptionCard } from '@/components/live-match/OptionCard';
import { MysteryBoxGrid } from '@/components/live-match/MysteryBoxGrid';
import { WinnerCelebration } from '@/components/live-match/WinnerCelebration';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Question } from '@/lib/types/tournament';
import { soundFX } from '@/lib/utils/audio';

export default function LiveMatchPage() {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    config,
    subjects,
    currentSubjectIndex,
    currentQuestionIndex,
    teamTurn,
    teamAScore,
    teamBScore,
    isQuestionRevealed,
    selectedOptionIndex,
    isAnswerSubmitted,
    isTieBreaker,
    tieBreakerQuestions,
    tieBreakerQuestionIndex,
    selectedMysteryBox,
    revealedQuestionIds,
    isMatchFinished,
    winnerName,
    teamAQuestionPool,
    teamBQuestionPool,
    historyStack,
    revealQuestion,
    selectOption,
    confirmAnswer,
    nextTurn,
    undoLastAction,
    selectMysteryBox,
    resetMatch,
  } = useTournamentStore();

  // Bulletproof auto-advance: 1800ms after answer confirmation, smoothly advance
  useEffect(() => {
    if (isAnswerSubmitted && !isMatchFinished) {
      const timer = setTimeout(() => {
        nextTurn();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isAnswerSubmitted, isMatchFinished, nextTurn]);

  // Loading state during initial client hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-surface-obsidian flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-team-a-core border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If no match initialized, prompt operator to start
  if (!config || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-surface-obsidian flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold font-sans text-optic-white">
            NO ACTIVE STAGE MATCH LOADED
          </h2>
          <p className="text-sm text-text-muted-slate font-sans">
            Configure match rules, teams, and question pool in the Match Setup console before entering
            the live arena.
          </p>
          <Button
            variant="team-a"
            size="lg"
            onClick={() => router.push('/match-setup')}
            className="w-full mt-4"
          >
            Go to Match Setup
          </Button>
        </div>
      </div>
    );
  }

  // Active Subject & Active Question (from the active team's unique pool)
  const activeSubject = subjects[currentSubjectIndex];
  let currentQuestion: Question | undefined;

  if (isTieBreaker) {
    currentQuestion =
      tieBreakerQuestions.length > 0
        ? tieBreakerQuestions[tieBreakerQuestionIndex % tieBreakerQuestions.length]
        : undefined;
  } else {
    const pool = teamTurn === 'TEAM_A' ? teamAQuestionPool : teamBQuestionPool;
    const subjectPool = pool?.[activeSubject?.id] || [];
    currentQuestion = subjectPool[currentQuestionIndex];
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleExitMatch = () => {
    resetMatch();
    router.push('/dashboard');
  };

  const isTeamA = teamTurn === 'TEAM_A';
  const activeTeamName = isTeamA ? config.teamAName : config.teamBName;
  const currentSubjectQuota = config.subjectQuestionCounts?.[activeSubject?.id] || config.mcqsPerSubject || 2;

  return (
    <div className="min-h-screen w-full bg-surface-obsidian text-optic-white flex flex-col justify-between projector-safe-margin select-none overflow-y-auto relative py-6 px-4 md:px-8 transition-colors duration-200">
      {/* Top Stage Header (Subject, Question telemetry, Active Turn) */}
      <div className="w-full z-10">
        <StageHeader
          subjectName={activeSubject?.name || 'Tournament Subject'}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestionsInSubject={currentSubjectQuota}
          subjectIndex={currentSubjectIndex}
          totalSubjects={subjects.length}
          teamTurn={teamTurn}
          teamAName={config.teamAName}
          teamBName={config.teamBName}
          teamAColor={config.teamAColor}
          teamBColor={config.teamBColor}
          isTieBreaker={isTieBreaker}
        />

        {/* Top Active Turn Advance Status Banner */}
        {isAnswerSubmitted && (
          <div className="w-full max-w-4xl mx-auto mt-3 px-6 py-2.5 rounded-xl bg-surface-carbon border border-state-success/40 shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-state-success animate-ping" />
              <span className="font-mono text-xs md:text-sm font-bold text-optic-white uppercase tracking-wider">
                Verbal Answer Recorded • Advancing Turn...
              </span>
            </div>
            <Button
              variant={isTeamA ? 'team-a' : 'team-b'}
              size="sm"
              onClick={nextTurn}
              className="text-xs font-mono font-bold px-4 py-1"
            >
              <span>SKIP (NEXT TURN)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Main 12-Column Projector Stage Grid */}
      <div className="flex-1 w-full max-w-7xl mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch z-10">
        {/* Left Column: Team A Podium (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          <TeamPodium
            faction="TEAM_A"
            name={config.teamAName}
            score={teamAScore}
            isActiveTurn={isTeamA}
            teamColor={config.teamAColor}
          />
        </div>

        {/* Center Column: Question & Interaction Arena (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          {isTieBreaker && selectedMysteryBox === null ? (
            /* Super Over Mystery Box Grid */
            <MysteryBoxGrid
              onSelectBox={(boxIdx) => {
                soundFX.playMysteryBox();
                selectMysteryBox(boxIdx);
                revealQuestion();
              }}
              selectedBox={selectedMysteryBox}
              activeTeamName={activeTeamName}
              isTeamA={isTeamA}
            />
          ) : !isQuestionRevealed ? (
            /* Unrevealed Question Placeholder Card */
            <div className="w-full h-80 rounded-2xl bg-surface-carbon border border-border-medium flex flex-col items-center justify-center p-8 text-center space-y-5 shadow-modal-dialog">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isTeamA
                    ? 'bg-team-a-core/15 border border-team-a-bright text-team-a-bright'
                    : 'bg-team-b-cyan/15 border border-team-b-ice text-team-b-cyan'
                }`}
              >
                <Eye className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold text-optic-white font-sans">
                  {activeTeamName}&apos;s Question Ready
                </h3>
                <p className="text-xs text-text-muted-slate font-mono uppercase">
                  Click Reveal Question below when contestants are focused
                </p>
              </div>

              <Button
                variant={isTeamA ? 'team-a' : 'team-b'}
                size="lg"
                onClick={() => {
                  soundFX.playReveal();
                  revealQuestion();
                }}
                className="font-bold text-sm tracking-wider px-8"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                REVEAL QUESTION & OPTIONS
              </Button>
            </div>
          ) : currentQuestion ? (
            /* Active Question Bay & 2x2 Option Grid */
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Question Text Prompt Card */}
              <div className="p-6 md:p-8 rounded-2xl bg-surface-carbon border border-border-medium shadow-modal-dialog">
                <span className="label-caps text-text-muted-slate block mb-2 font-sans">
                  QUESTION PROMPT
                </span>
                <h2 className="text-headline-md md:text-headline-lg font-bold text-optic-white leading-relaxed tracking-tight font-sans">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* 4 Options Grid (2x2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQuestion.options.map((optionText, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrect = currentQuestion?.correct_index === idx;

                  return (
                    <OptionCard
                      key={idx}
                      letter={letter}
                      text={optionText}
                      isSelected={isSelected}
                      isSubmitted={isAnswerSubmitted}
                      isCorrect={isCorrect}
                      teamTurn={teamTurn}
                      teamColor={isTeamA ? config.teamAColor : config.teamBColor}
                      points={config.pointsPerMcq || 10}
                      onSelect={() => selectOption(idx)}
                      disabled={isAnswerSubmitted}
                    />
                  );
                })}
              </div>

              {/* Confirm Answer Button (Only visible before confirmation) */}
              {!isAnswerSubmitted && selectedOptionIndex !== null && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant={isTeamA ? 'team-a' : 'team-b'}
                    size="lg"
                    onClick={() => {
                      if (selectedOptionIndex !== null && currentQuestion) {
                        const isCorrect = selectedOptionIndex === currentQuestion.correct_index;
                        if (isCorrect) {
                          soundFX.playCorrect();
                        } else {
                          soundFX.playIncorrect();
                        }
                      }
                      confirmAnswer();
                    }}
                    className="font-bold text-base px-10 shadow-sm"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    CONFIRM VERBAL RESPONSE
                  </Button>
                </div>
              )}

              {/* Proceed to Next Turn Button (Visible when answer is submitted) */}
              {isAnswerSubmitted && (
                <div className="flex justify-center pt-2 animate-in fade-in zoom-in-95 duration-200">
                  <Button
                    variant={isTeamA ? 'team-a' : 'team-b'}
                    size="lg"
                    onClick={nextTurn}
                    className="font-bold text-base px-10 shadow-sm"
                  >
                    <span>PROCEED TO NEXT TURN</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-6 text-text-muted-slate font-mono text-xs">
              No questions remaining in this round.
            </div>
          )}
        </div>

        {/* Right Column: Team B Podium (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          <TeamPodium
            faction="TEAM_B"
            name={config.teamBName}
            score={teamBScore}
            isActiveTurn={!isTeamA}
            teamColor={config.teamBColor}
          />
        </div>
      </div>

      {/* Floating Unobtrusive Operator Control Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4 border-t border-border-subtle z-20">
        <div className="flex items-center gap-3">
          {/* Undo Action Button */}
          <Button
            variant="console"
            size="sm"
            onClick={undoLastAction}
            disabled={historyStack.length === 0}
            className="text-xs font-mono"
            title="Revert last option click or score allocation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>UNDO MISCLICK ({historyStack.length})</span>
          </Button>

          {/* Quick Proceed button in control bar */}
          {isAnswerSubmitted && (
            <Button
              variant={isTeamA ? 'team-a' : 'team-b'}
              size="sm"
              onClick={nextTurn}
              className="text-xs font-mono font-bold"
            >
              <span>NEXT TURN</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}

          {/* Quick Reveal shortcut if hidden */}
          {!isQuestionRevealed && (
            <Button
              variant={isTeamA ? 'team-a' : 'team-b'}
              size="sm"
              onClick={revealQuestion}
              className="text-xs font-mono"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>REVEAL</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dual Theme Switcher */}
          <ThemeToggle />

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-surface-carbon border border-border-medium text-text-bright-slate hover:text-optic-white hover:bg-surface-interactive transition-colors cursor-pointer"
            title="Toggle Projector Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Match */}
          <button
            onClick={() => setExitModalOpen(true)}
            className="p-2 rounded-lg bg-surface-carbon border border-border-medium text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors cursor-pointer"
            title="Exit Live Match"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Winner Celebration Modal (Overlay) */}
      {isMatchFinished && winnerName && (
        <WinnerCelebration
          winnerName={winnerName}
          teamAName={config.teamAName}
          teamBName={config.teamBName}
          teamAScore={teamAScore}
          teamBScore={teamBScore}
          revealedQuestionIds={revealedQuestionIds}
          onPlayAgain={() => {
            resetMatch();
            router.push('/match-setup');
          }}
        />
      )}

      {/* Exit Match Confirmation Modal */}
      <Modal
        isOpen={exitModalOpen}
        onClose={() => setExitModalOpen(false)}
        title="Exit Active Match?"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted-slate font-sans">
            Exiting now will discard uncommitted live match scores. Are you sure you want to return to
            the tournament dashboard?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="console" size="sm" onClick={() => setExitModalOpen(false)}>
              Continue Match
            </Button>
            <Button variant="danger" size="sm" onClick={handleExitMatch}>
              Exit to Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
