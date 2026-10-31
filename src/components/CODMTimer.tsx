import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, Gamepad2, AlertCircle } from 'lucide-react';
import { ScheduleBlock } from '../types';

interface CODMTimerProps {
  block: ScheduleBlock | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CODMTimer: React.FC<CODMTimerProps> = ({ block, isOpen, onClose }) => {
  if (!isOpen || !block) return null;

  const totalSeconds = (block.durationMinutes || 60) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlerting, setIsAlerting] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Reset when block changes
  useEffect(() => {
    setSecondsLeft(totalSeconds);
    setIsRunning(false);
    setIsAlerting(false);
  }, [block.id, totalSeconds]);

  // Audio chime using Web Audio API
  const playAlertChime = () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      // Arpeggio chime
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.setValueAtTime(554.37, now + 0.15); // C#5
      osc.frequency.setValueAtTime(659.25, now + 0.3); // E5
      osc.frequency.setValueAtTime(880, now + 0.45); // A5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsAlerting(true);
            playAlertChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const handleToggle = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
      setIsRunning(true);
      setIsAlerting(false);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    setIsAlerting(false);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progressPercent = Math.max(0, (secondsLeft / totalSeconds) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#0B1220] border border-slate-800 text-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Gamepad2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">CODM Session Countdown</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {block.title} ({block.durationMinutes}m limit)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert banner if time is up */}
        {isAlerting && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">Time's Up! Limit reached.</span>
            </div>
            <button
              onClick={() => playAlertChime()}
              className="p-1 text-rose-300 hover:text-white"
              title="Replay alert chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Big Timer Display */}
        <div className="flex flex-col items-center justify-center py-4 space-y-2">
          <div className="relative w-44 h-44 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center">
            {/* Circular active ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="88"
                cy="88"
                r="82"
                stroke={isAlerting ? '#ef4444' : '#38bdf8'}
                strokeWidth="5"
                fill="none"
                strokeDasharray="515"
                strokeDashoffset={515 - (515 * progressPercent) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <span className="text-4xl font-extrabold font-mono text-white tracking-wider">
              {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-1">
              {isRunning ? 'Active Gaming' : secondsLeft === 0 ? 'Session Ended' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggle}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-slate-950 font-extrabold'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{secondsLeft === 0 ? 'Start Over' : 'Start Session'}</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-500 font-medium">
          Keeps gaming contained so you win the day and hit your target bedtime!
        </p>
      </div>
    </div>
  );
};

export const CODMTimerModal = CODMTimer;
