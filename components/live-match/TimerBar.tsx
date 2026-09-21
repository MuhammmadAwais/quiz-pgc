'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Pause, Play } from 'lucide-react';
import { soundFX } from '@/lib/utils/audio';

interface TimerBarProps {
  timeLimitSeconds: number;
  timerStartedAt: number | null;
  isPaused: boolean;
  isAnswerSubmitted: boolean;
  isExpired: boolean;
  variant?: 'hero' | 'header';
  onExpire: () => void;
  onTogglePause?: () => void;
}

export function TimerBar({
  timeLimitSeconds,
  timerStartedAt,
  isPaused,
  isAnswerSubmitted,
  isExpired,
  variant = 'hero',
  onExpire,
  onTogglePause,
}: TimerBarProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds);
  const [progressPercent, setProgressPercent] = useState(100);
  const lastSecondRef = useRef<number>(-1);
  const hasExpiredRef = useRef<boolean>(false);

  useEffect(() => {
    hasExpiredRef.current = isExpired;
  }, [isExpired]);

  useEffect(() => {
    // If untimed or no start timestamp, or answer already confirmed, stop loop
    if (timeLimitSeconds <= 0 || !timerStartedAt || isAnswerSubmitted) {
      if (timeLimitSeconds > 0) {
        setRemainingSeconds(timeLimitSeconds);
        setProgressPercent(100);
      }
      return;
    }

    let animationFrameId: number;

    const tick = () => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      // Pure wall-clock difference: immune to CPU lag, tab throttle, or network drops
      const elapsedMs = Date.now() - timerStartedAt;
      const totalMs = timeLimitSeconds * 1000;
      const remainingMs = Math.max(0, totalMs - elapsedMs);
      const remainingSec = Math.ceil(remainingMs / 1000);
      const pct = Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));

      setRemainingSeconds(remainingSec);
      setProgressPercent(pct);

      // Sound triggers on second boundaries
      if (remainingSec !== lastSecondRef.current) {
        lastSecondRef.current = remainingSec;

        if (remainingSec > 5 && remainingSec <= 10) {
          soundFX.playTimerTick();
        } else if (remainingSec > 0 && remainingSec <= 5) {
          soundFX.playTimerUrgent();
        }
      }

      if (remainingMs <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        soundFX.playTimerTimeout();
        soundFX.playIncorrect();
        onExpire();
      }

      if (remainingMs > 0 && !hasExpiredRef.current) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [timeLimitSeconds, timerStartedAt, isPaused, isAnswerSubmitted, onExpire]);

  // Don't render if untimed match
  if (timeLimitSeconds <= 0) {
    return null;
  }

  // Determine Color Phase based on remaining percentage
  let phaseColorClass = 'text-team-b-cyan';
  let barBgClass = 'bg-team-b-cyan shadow-sm';
  let badgeBorderClass = 'border-team-b-cyan/40 bg-team-b-cyan/15';
  let glowStyle: React.CSSProperties = { boxShadow: '0 0 20px rgba(6, 182, 212, 0.45)' };

  if (isExpired || remainingSeconds === 0) {
    phaseColorClass = 'text-state-warning-rose';
    barBgClass = 'bg-state-warning-rose';
    badgeBorderClass = 'border-state-warning-rose bg-state-warning-rose/20';
    glowStyle = { boxShadow: '0 0 24px rgba(225, 29, 72, 0.7)' };
  } else if (progressPercent <= 25) {
    // Phase 3: Critical Rose (<25% time)
    phaseColorClass = 'text-state-warning-rose';
    barBgClass = 'bg-state-warning-rose';
    badgeBorderClass = 'border-state-warning-rose/80 bg-state-warning-rose/20';
    glowStyle = { boxShadow: '0 0 24px rgba(225, 29, 72, 0.7)' };
  } else if (progressPercent <= 50) {
    // Phase 2: Warning Amber (25-50% time)
    phaseColorClass = 'text-amber-400';
    barBgClass = 'bg-amber-400';
    badgeBorderClass = 'border-amber-400/50 bg-amber-400/15';
    glowStyle = { boxShadow: '0 0 18px rgba(245, 158, 11, 0.45)' };
  }

  // Header variant (compact projector badge for top bar)
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all ${badgeBorderClass}`}>
        <Clock className={`w-4 h-4 ${phaseColorClass} ${progressPercent <= 25 && !isExpired ? 'animate-pulse' : ''}`} />
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-text-muted-slate hidden sm:inline">
          {isExpired ? 'TIME UP' : isPaused ? 'PAUSED' : 'CLOCK'}
        </span>
        <span
          className={`font-mono font-black text-xl md:text-2xl tabular-nums ${phaseColorClass} ${
            progressPercent <= 25 && !isExpired ? 'animate-pulse' : ''
          }`}
        >
          {String(remainingSeconds).padStart(2, '0')}s
        </span>
      </div>
    );
  }

  // Hero variant: High-impact projector clock with 30-foot visibility
  return (
    <div className="w-full bg-surface-carbon border border-border-medium rounded-2xl p-4 md:p-5 shadow-modal-dialog space-y-3 select-none">
      <div className="flex items-center justify-between">
        {/* Left: Projector Clock Label & Pulse Status */}
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border flex items-center justify-center ${badgeBorderClass}`}>
            <Clock
              className={`w-5 h-5 md:w-6 md:h-6 ${phaseColorClass} ${
                progressPercent <= 25 && !isExpired ? 'animate-pulse' : ''
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider font-bold text-text-bright-slate">
                {isExpired ? 'TIME EXPIRED' : isPaused ? 'TIMER PAUSED' : 'STAGE COUNTDOWN'}
              </span>
              {isExpired && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-state-warning-rose animate-bounce">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  0 PTS DECLARED
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-text-muted-slate">
              {isPaused ? 'Match clock paused by stage operator' : 'Active turn per-MCQ limit'}
            </p>
          </div>
        </div>

        {/* Right: Massive Projector Digits (30-Foot Visibility) & Pause Trigger */}
        <div className="flex items-center gap-4">
          {onTogglePause && !isExpired && !isAnswerSubmitted && (
            <button
              type="button"
              onClick={onTogglePause}
              className="p-2 rounded-xl bg-surface-onyx border border-border-medium text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive transition-colors cursor-pointer"
              title={isPaused ? 'Resume countdown' : 'Pause countdown'}
            >
              {isPaused ? <Play className="w-4 h-4 text-state-success" /> : <Pause className="w-4 h-4" />}
            </button>
          )}

          {/* Huge digits for auditorium & classroom projectors */}
          <div
            className={`font-mono font-black text-4xl md:text-6xl tabular-nums tracking-tight transition-all duration-150 ${phaseColorClass} ${
              progressPercent <= 25 && !isExpired ? 'animate-pulse scale-105' : ''
            }`}
          >
            {String(remainingSeconds).padStart(2, '0')}
            <span className="text-xl md:text-2xl font-bold ml-1 opacity-75">s</span>
          </div>
        </div>
      </div>

      {/* Full-width High-Candela Progress Rail */}
      <div className="w-full h-3 rounded-full bg-surface-recessed overflow-hidden p-0.5 border border-border-subtle">
        <div
          style={{
            width: `${isExpired ? 0 : progressPercent}%`,
            ...glowStyle,
          }}
          className={`h-full rounded-full transition-all duration-75 ease-linear ${barBgClass}`}
        />
      </div>
    </div>
  );
}
