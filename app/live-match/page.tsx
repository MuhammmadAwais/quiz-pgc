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
  PauseCircle,
} from 'lucide-react';
import { useTournamentStore } from '@/lib/store/tournament-store';
import { StageHeader } from '@/components/live-match/StageHeader';
import { TeamFlank } from '@/components/live-match/TeamFlank';
import { OptionCard } from '@/components/live-match/OptionCard';
import { TimerBar } from '@/components/live-match/TimerBar';
import { MysteryBoxGrid } from '@/components/live-match/MysteryBoxGrid';
import { WinnerCelebration } from '@/components/live-match/WinnerCelebration';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Question } from '@/lib/types/tournament';
import { soundFX } from '@/lib/utils/audio';
import { MathRenderer } from '@/components/ui/MathRenderer';
import { getTextDirectionProps } from '@/lib/utils/text';

export default function LiveMatchPage() {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [postponeModalOpen, setPostponeModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    config,
    teams,
    activeTeamIndex,
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
    teamQuestionPools,
    historyStack,
    timerStartedAt,
    isTimerPaused,
    isTimeExpired,
    revealQuestion,
    selectOption,
    confirmAnswer,
    nextTurn,
    undoLastAction,
    selectMysteryBox,
    resetMatch,
    pauseTimer,
    resumeTimer,
    expireTimer,
  } = useTournamentStore();

  // Bulletproof auto-advance: 1800ms after answer confirmation or 2200ms after timeout
  useEffect(() => {
    if (isAnswerSubmitted && !isMatchFinished) {
      const delay = isTimeExpired ? 2200 : 1800;
      const timer = setTimeout(() => {
        nextTurn();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isAnswerSubmitted, isTimeExpired, isMatchFinished, nextTurn]);

  // Loading state during initial client hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-surface-obsidian flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-team-a-core border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If no match initialized, prompt operator to start
  if (!config || subjects.length === 0 || !teams || teams.length === 0) {
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

  // Active Subject & Active Question (from active team's unique pool)
  const activeSubject = subjects[currentSubjectIndex];
  const activeTeam = teams[activeTeamIndex] || teams[0];
  const activeTeamName = activeTeam?.name || 'Active Team';
  const activeTeamColor = activeTeam?.color || '#8B5CF6';

  let currentQuestion: Question | undefined;

  if (isTieBreaker) {
    currentQuestion =
      tieBreakerQuestions.length > 0
        ? tieBreakerQuestions[tieBreakerQuestionIndex % tieBreakerQuestions.length]
        : undefined;
  } else {
    const subjectPool = teamQuestionPools?.[activeTeam?.id]?.[activeSubject?.id] || [];
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

  const handlePostponeMatch = () => {
    pauseTimer();
    setPostponeModalOpen(false);
    router.push('/dashboard');
  };

  const currentSubjectQuota =
    config.subjectQuestionCounts?.[activeSubject?.id] || config.mcqsPerSubject || 2;

  // Split teams symmetrically into Left and Right flanks
  // Left Flank: Teams 1, 3, 5, 7, 9, 11 (0, 2, 4, 6...)
  // Right Flank: Teams 2, 4, 6, 8, 10, 12 (1, 3, 5, 7...)
  const leftFlankTeams: { team: typeof teams[0]; index: number }[] = [];
  const rightFlankTeams: { team: typeof teams[0]; index: number }[] = [];

  teams.forEach((team, idx) => {
    if (idx % 2 === 0) {
      leftFlankTeams.push({ team, index: idx });
    } else {
      rightFlankTeams.push({ team, index: idx });
    }
  });

  const questionDirProps = getTextDirectionProps(currentQuestion?.text);

  return (
    <div className="min-h-screen w-full bg-surface-obsidian text-optic-white flex flex-col justify-between projector-safe-margin select-none overflow-y-auto relative py-4 px-3 sm:px-6 md:px-8 transition-colors duration-200">
      {/* 1. Top Stage Header (Subject, Round, Active Turn Banner, Sound Toggle) */}
      <div className="w-full max-w-[1720px] mx-auto z-10">
        <StageHeader
          subjectName={activeSubject?.name || 'Tournament Subject'}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestionsInSubject={currentSubjectQuota}
          subjectIndex={currentSubjectIndex}
          totalSubjects={subjects.length}
          teamTurn={teamTurn}
          activeTeamName={activeTeamName}
          activeTeamColor={activeTeamColor}
          totalTeams={teams.length}
          activeTeamIndex={activeTeamIndex}
          isTieBreaker={isTieBreaker}
        />

        {/* Verbal Answer Submitted or Time Expired Status Banner */}
        {isAnswerSubmitted && (
          <div
            className={`w-full max-w-5xl mx-auto mt-2.5 px-6 py-2 rounded-xl border shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 ${
              isTimeExpired
                ? 'bg-surface-carbon border-state-warning-rose/60'
                : 'bg-surface-carbon border-state-success/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-ping ${
                  isTimeExpired ? 'bg-state-warning-rose' : 'bg-state-success'
                }`}
              />
              <span
                className={`font-mono text-xs md:text-sm font-bold uppercase tracking-wider ${
                  isTimeExpired ? 'text-state-warning-rose' : 'text-optic-white'
                }`}
              >
                {isTimeExpired
                  ? 'TIME EXPIRED • 0 POINTS AWARDED (MISSED) • Advancing Turn...'
                  : 'Verbal Answer Recorded • Advancing Turn...'}
              </span>
            </div>
            <Button
              variant={isTimeExpired ? 'danger' : 'team-a'}
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

      {/* 2. Top Full-Width Question Bar (Spanning Full Projector Width) */}
      <div className="w-full max-w-[1720px] mx-auto my-3 z-10">
        {!isQuestionRevealed ? (
          /* Unrevealed Question Placeholder Banner */
          <div className="w-full py-7 px-6 rounded-2xl bg-surface-carbon border border-border-medium flex flex-col md:flex-row items-center justify-between gap-6 shadow-modal-dialog transition-all">
            <div className="flex items-center gap-4 text-left">
              <div
                style={{
                  backgroundColor: `${activeTeamColor}20`,
                  borderColor: activeTeamColor,
                  color: activeTeamColor,
                }}
                className="w-13 h-13 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm"
              >
                <Eye className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold text-optic-white font-sans">
                  {activeTeamName}&apos;s Question Ready
                </h3>
                <p className="text-xs text-text-muted-slate font-mono uppercase tracking-wide">
                  Question hidden on stage. Click Reveal when contestants are ready.
                </p>
              </div>
            </div>

            <Button
              variant="team-a"
              size="lg"
              onClick={() => {
                soundFX.playReveal();
                revealQuestion();
              }}
              style={{
                backgroundColor: activeTeamColor,
                color: '#FFFFFF',
              }}
              className="font-bold text-sm tracking-wider px-8 whitespace-nowrap shadow-sm hover:brightness-110 cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              REVEAL QUESTION & OPTIONS
            </Button>
          </div>
        ) : currentQuestion ? (
          /* Full-Width Revealed Question Prompt Card (with RTL & Math support) */
          <div
            className="w-full p-5 md:p-7 rounded-2xl bg-surface-carbon border-2 shadow-modal-dialog animate-in fade-in zoom-in-95 duration-200 transition-all"
            style={{ borderColor: `${activeTeamColor}40` }}
            dir={questionDirProps.dir}
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="label-caps text-text-muted-slate font-sans">
                QUESTION {currentQuestionIndex + 1} OF {currentSubjectQuota}
              </span>
              <span
                className="font-mono text-xs font-bold uppercase px-2.5 py-0.5 rounded shadow-sm"
                style={{
                  backgroundColor: `${activeTeamColor}20`,
                  color: activeTeamColor,
                }}
              >
                {activeTeamName}
              </span>
            </div>

            <h2
              className={`text-xl md:text-3xl font-bold text-optic-white tracking-tight ${questionDirProps.className}`}
            >
              <MathRenderer content={currentQuestion.text} />
            </h2>
          </div>
        ) : (
          <div className="text-center p-6 text-text-muted-slate font-mono text-xs">
            No questions remaining in this round.
          </div>
        )}
      </div>

      {/* 3. 4-Column Stadium Arena (Left 2 Team Columns | Center Options + Stage Clock | Right 2 Team Columns) */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto my-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start z-10">
        {/* Left Flank: 2 Columns of Teams (lg:col-span-4 on widescreen) */}
        <div className="lg:col-span-4 flex flex-col justify-center order-2 lg:order-1">
          <TeamFlank teams={leftFlankTeams} activeTeamIndex={activeTeamIndex} />
        </div>

        {/* Center Bay: Massive Projector Timer & 2x2 Option Cards (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 order-1 lg:order-2">
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
              isTeamA={activeTeamIndex % 2 === 0}
            />
          ) : isQuestionRevealed && currentQuestion ? (
            <div className="w-full space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Massive Projector Stage Clock (30-Foot Visibility with Huge Digits) */}
              {config.timeLimitSeconds > 0 && (
                <TimerBar
                  timeLimitSeconds={config.timeLimitSeconds}
                  timerStartedAt={timerStartedAt}
                  isPaused={isTimerPaused}
                  isAnswerSubmitted={isAnswerSubmitted}
                  isExpired={isTimeExpired}
                  variant="hero"
                  onExpire={expireTimer}
                  onTogglePause={() => {
                    if (isTimerPaused) {
                      resumeTimer();
                    } else {
                      pauseTimer();
                    }
                  }}
                />
              )}

              {/* 4 Options Grid (2x2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      teamColor={activeTeamColor}
                      points={config.pointsPerMcq || 10}
                      onSelect={() => selectOption(idx)}
                      disabled={isAnswerSubmitted || isTimeExpired}
                    />
                  );
                })}
              </div>

              {/* Confirm Answer Button */}
              {!isAnswerSubmitted && selectedOptionIndex !== null && (
                <div className="flex justify-center pt-1">
                  <Button
                    variant="team-a"
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
                    style={{
                      backgroundColor: activeTeamColor,
                      color: '#FFFFFF',
                    }}
                    className="font-bold text-base px-10 shadow-sm hover:brightness-110 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    CONFIRM VERBAL RESPONSE
                  </Button>
                </div>
              )}

              {/* Proceed to Next Turn Button */}
              {isAnswerSubmitted && (
                <div className="flex justify-center pt-1 animate-in fade-in zoom-in-95 duration-200">
                  <Button
                    variant="team-a"
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
            /* Awaiting Reveal Center State */
            <div className="w-full h-44 rounded-2xl bg-surface-carbon/50 border border-dashed border-border-subtle flex items-center justify-center p-6 text-center text-text-muted-slate font-mono text-xs">
              Options and stage clock will activate when the question is revealed.
            </div>
          )}
        </div>

        {/* Right Flank: 2 Columns of Teams (lg:col-span-4 on widescreen) */}
        <div className="lg:col-span-4 flex flex-col justify-center order-3">
          <TeamFlank teams={rightFlankTeams} activeTeamIndex={activeTeamIndex} />
        </div>
      </div>

      {/* 4. Floating Unobtrusive Operator Control Bar */}
      <div className="w-full max-w-[1720px] mx-auto flex items-center justify-between pt-3 border-t border-border-subtle z-20">
        <div className="flex items-center gap-2.5">
          {/* Undo Action Button */}
          <Button
            variant="console"
            size="sm"
            onClick={undoLastAction}
            disabled={historyStack.length === 0}
            className="text-xs font-mono"
            title="Revert last option click or score allocation"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>UNDO ({historyStack.length})</span>
          </Button>

          {/* Dedicated Postpone Match Button */}
          <Button
            variant="console"
            size="sm"
            onClick={() => setPostponeModalOpen(true)}
            className="text-xs font-mono"
            title="Safely pause and postpone tournament to resume later"
          >
            <PauseCircle className="w-3.5 h-3.5 mr-1 text-team-b-cyan" />
            <span>POSTPONE MATCH</span>
          </Button>

          {/* Quick Proceed button in control bar */}
          {isAnswerSubmitted && (
            <Button
              variant="team-a"
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
              variant="team-a"
              size="sm"
              onClick={() => {
                soundFX.playReveal();
                revealQuestion();
              }}
              className="text-xs font-mono"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>REVEAL</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
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
          teamAName={teams[0]?.name || 'Team 1'}
          teamBName={teams[1]?.name || 'Team 2'}
          teamAScore={teams[0]?.score || 0}
          teamBScore={teams[1]?.score || 0}
          teams={teams}
          revealedQuestionIds={revealedQuestionIds}
          onPlayAgain={() => {
            resetMatch();
            router.push('/match-setup');
          }}
        />
      )}

      {/* Postpone Match Modal */}
      <Modal
        isOpen={postponeModalOpen}
        onClose={() => setPostponeModalOpen(false)}
        title="Postpone Live Match?"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted-slate font-sans leading-relaxed">
            Current match scores, round progress, and team standings will be securely saved in local storage.
            You can safely resume this exact match at any time from the Match Setup console or Dashboard.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="console" size="sm" onClick={() => setPostponeModalOpen(false)}>
              Continue Match
            </Button>
            <Button variant="team-a" size="sm" onClick={handlePostponeMatch} className="font-bold">
              Postpone &amp; Save
            </Button>
          </div>
        </div>
      </Modal>

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
