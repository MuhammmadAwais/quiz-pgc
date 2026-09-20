'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Eye,
  LogOut,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { StageHeader } from '@/components/live-match/StageHeader';
import { TeamPodium } from '@/components/live-match/TeamPodium';
import { OptionCard } from '@/components/live-match/OptionCard';
import { MysteryBoxGrid } from '@/components/live-match/MysteryBoxGrid';
import { WinnerCelebration } from '@/components/live-match/WinnerCelebration';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Question } from '@/lib/types/tournament';

export default function LiveMatchPage() {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);

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
    questionPool,
    historyStack,
    revealQuestion,
    selectOption,
    confirmAnswer,
    undoLastAction,
    selectMysteryBox,
    resetMatch,
  } = useTournamentStore();

  // If no match initialized, prompt operator to start
  if (!config || subjects.length === 0) {
    return (
      <div className="min-h-screen bg-surface-obsidian flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold font-mono text-optic-white">
            NO ACTIVE STAGE MATCH LOADED
          </h2>
          <p className="text-sm text-text-muted-slate">
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

  // Active Subject & Active Question
  const activeSubject = subjects[currentSubjectIndex];
  let currentQuestion: Question | undefined;

  if (isTieBreaker) {
    currentQuestion = tieBreakerQuestions[tieBreakerQuestionIndex];
  } else {
    const subjectPool = questionPool[activeSubject?.id] || [];
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

  return (
    <div className="min-h-screen w-full bg-surface-obsidian text-optic-white flex flex-col justify-between projector-safe-margin select-none overflow-hidden relative">
      {/* Background ambient lighting */}
      <div
        className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700 ${
          isTeamA ? 'bg-team-a-core' : 'bg-transparent'
        }`}
      />
      <div
        className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700 ${
          !isTeamA ? 'bg-team-b-cyan' : 'bg-transparent'
        }`}
      />

      {/* Top Stage Header (Subject, Question telemetry, Active Turn) */}
      <div className="w-full z-10">
        <StageHeader
          subjectName={activeSubject?.name || 'Tournament Subject'}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestionsInSubject={config.mcqsPerSubject}
          teamTurn={teamTurn}
          teamAName={config.teamAName}
          teamBName={config.teamBName}
          isTieBreaker={isTieBreaker}
        />
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
          />
        </div>

        {/* Center Column: Question & Interaction Arena (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          {isTieBreaker && selectedMysteryBox === null ? (
            /* Super Over Mystery Box Grid */
            <MysteryBoxGrid
              onSelectBox={(boxIdx) => {
                selectMysteryBox(boxIdx);
                revealQuestion();
              }}
              selectedBox={selectedMysteryBox}
              activeTeamName={activeTeamName}
              isTeamA={isTeamA}
            />
          ) : !isQuestionRevealed ? (
            /* Unrevealed Question Placeholder Card */
            <div className="w-full h-80 rounded-2xl bg-surface-carbon border border-white/15 flex flex-col items-center justify-center p-8 text-center space-y-5 shadow-[0_16px_36px_rgba(0,0,0,0.85)]">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isTeamA
                    ? 'bg-team-a-core/20 border border-team-a-bright text-team-a-bright glow-team-a'
                    : 'bg-team-b-cyan/20 border border-team-b-ice text-team-b-ice glow-team-b'
                }`}
              >
                <Eye className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold text-optic-white">
                  {activeTeamName}&apos;s Question Ready
                </h3>
                <p className="text-xs text-text-muted-slate font-mono uppercase">
                  Click Reveal Question below when contestants are focused
                </p>
              </div>

              <Button
                variant={isTeamA ? 'team-a' : 'team-b'}
                size="lg"
                onClick={revealQuestion}
                className="font-bold text-sm tracking-wider px-8"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                REVEAL QUESTION & OPTIONS
              </Button>
            </div>
          ) : currentQuestion ? (
            /* Active Question Bay & 2x2 Option Grid */
            <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Question Text Prompt Card */}
              <div className="p-6 md:p-8 rounded-2xl bg-surface-carbon border border-white/20 shadow-[0_16px_32px_rgba(0,0,0,0.85)]">
                <span className="label-caps text-text-muted-slate block mb-2">
                  QUESTION PROMPT
                </span>
                <h2 className="text-headline-md md:text-headline-lg font-bold text-optic-white leading-relaxed tracking-tight">
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
                    onClick={confirmAnswer}
                    className="font-bold text-base px-10 shadow-[0_0_24px_rgba(255,255,255,0.2)] animate-pulse"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    CONFIRM VERBAL RESPONSE
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
          />
        </div>
      </div>

      {/* Floating Unobtrusive Operator Control Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4 border-t border-white/10 z-20">
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
          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md bg-surface-carbon border border-white/15 text-text-bright-slate hover:text-optic-white hover:bg-surface-interactive transition-colors"
            title="Toggle Projector Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Exit Match */}
          <button
            onClick={() => setExitModalOpen(true)}
            className="p-2 rounded-md bg-surface-carbon border border-white/15 text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors"
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
          <p className="text-sm text-text-muted-slate">
            Exiting now will discard uncommitted live match scores. Are you sure you want to return to
            the tournament dashboard?
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
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
