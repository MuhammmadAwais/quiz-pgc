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
  onExpire: () => void;
  onTogglePause?: () => void;
}

export function TimerBar({
  timeLimitSeconds,
  timerStartedAt,
  isPaused,
  isAnswerSubmitted,
  isExpired,
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
  let glowStyle: React.CSSProperties = { boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)' };

  if (isExpired || remainingSeconds === 0) {
    phaseColorClass = 'text-state-warning-rose';
    barBgClass = 'bg-state-warning-rose';
    glowStyle = { boxShadow: '0 0 20px rgba(225, 29, 72, 0.6)' };
  } else if (progressPercent <= 25) {
    // Phase 3: Critical Rose (<25% time)
    phaseColorClass = 'text-state-warning-rose';
    barBgClass = 'bg-state-warning-rose';
    glowStyle = { boxShadow: '0 0 20px rgba(225, 29, 72, 0.6)' };
  } else if (progressPercent <= 50) {
    // Phase 2: Warning Amber (25-50% time)
    phaseColorClass = 'text-amber-400';
    barBgClass = 'bg-amber-400';
    glowStyle = { boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)' };
  }

  return (
    <div className="w-full bg-surface-carbon border border-border-medium rounded-xl p-3.5 shadow-sm space-y-2 select-none">
      <div className="flex items-center justify-between">
        {/* Telemetry Icon & Label */}
        <div className="flex items-center gap-2">
          <Clock
            className={`w-4 h-4 ${phaseColorClass} ${
              progressPercent <= 25 && !isExpired ? 'animate-pulse' : ''
            }`}
          />
          <span className="font-mono text-xs uppercase tracking-wider font-bold text-text-bright-slate">
            {isExpired
              ? 'TIME EXPIRED'
              : isPaused
              ? 'TIMER PAUSED'
              : 'STAGE CLOCK'}
          </span>
          {isExpired && (
            <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-state-warning-rose animate-bounce">
              <AlertTriangle className="w-3 h-3" />
              TIME&apos;S UP!
            </span>
          )}
        </div>

        {/* Numeric Telemetry & Pause Override */}
        <div className="flex items-center gap-3">
          {onTogglePause && !isExpired && !isAnswerSubmitted && (
            <button
              type="button"
              onClick={onTogglePause}
              className="p-1 rounded bg-surface-onyx border border-border-subtle text-text-muted-slate hover:text-optic-white hover:bg-surface-interactive transition-colors cursor-pointer"
              title={isPaused ? 'Resume countdown' : 'Pause countdown'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          )}

          <div
            className={`font-mono font-black text-xl md:text-2xl tabular-nums tracking-tight ${phaseColorClass} ${
              progressPercent <= 25 && !isExpired ? 'animate-pulse scale-105 transition-transform' : ''
            }`}
          >
            {String(remainingSeconds).padStart(2, '0')}s
          </div>
        </div>
      </div>

      {/* High-Candela Progress Rail */}
      <div className="w-full h-2 rounded-full bg-surface-recessed overflow-hidden">
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
