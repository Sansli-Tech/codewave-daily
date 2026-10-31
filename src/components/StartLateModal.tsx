import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
  CheckCircle,
  Moon,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { ScheduleBlock, Preferences } from '../types';
import { rebuildScheduleStartingLate, StartLateRebuildResult } from '../utils/startLate';
import { formatDisplayTime, minutesToTime, timeToMinutes } from '../utils/time';

interface StartLateModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: ScheduleBlock[];
  currentDate: string;
  preferences: Preferences;
  timeFormat: '12h' | '24h';
  onApplyRebuild: (result: StartLateRebuildResult) => void;
}

export const StartLateModal: React.FC<StartLateModalProps> = ({
  isOpen,
  onClose,
  blocks,
  currentDate,
  preferences,
  timeFormat,
  onApplyRebuild,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const rawMins = now.getHours() * 60 + now.getMinutes();
  const defaultStartTime = minutesToTime(Math.ceil(rawMins / 5) * 5);

  const [startTime, setStartTime] = useState(defaultStartTime);

  // Calculate live preview of rebuild
  const preview = rebuildScheduleStartingLate(
    blocks,
    currentDate,
    preferences.targetBedtime,
    startTime
  );

  const handleApply = () => {
    onApplyRebuild(preview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                I'm Starting Late Rebuilder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rescue today's routine without sacrificing target bedtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Controls: Starting time & Target bedtime */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Start Routine From:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Hard Bedtime Limit:
              </label>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-800/40 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{formatDisplayTime(preferences.targetBedtime, timeFormat)}</span>
              </div>
            </div>
          </div>

          {/* Strategy Summary */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs space-y-1">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Smart Adaptation Plan:</span>
            </span>
            <p className="text-indigo-950/80 dark:text-indigo-300 leading-relaxed">
              {preview.summary}
            </p>
          </div>

          {/* Dropped Blocks Alert */}
          {preview.droppedBlocks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs space-y-1.5">
              <span className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Dropped Low-Priority Blocks:</span>
              </span>
              <div className="space-y-1">
                {preview.droppedBlocks.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-rose-800 dark:text-rose-300">
                    <span>
                      {b.icon} {b.title}
                    </span>
                    <span className="font-mono text-[11px]">{b.durationMinutes}m removed</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compressed Blocks Alert */}
          {preview.shrunkBlocks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span>Compressed to Protect Sleep:</span>
              </span>
              <div className="space-y-1">
                {preview.shrunkBlocks.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-amber-800 dark:text-amber-300">
                    <span>{s.title}</span>
                    <span className="font-mono text-[11px]">
                      {s.originalDuration}m → <strong className="text-amber-600">{s.newDuration}m</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Bedtime is strictly locked at {formatDisplayTime(preferences.targetBedtime, timeFormat)}. You can undo this rebuild anytime via the snackbar.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Apply Rebuild</span>
          </button>
        </div>
      </div>
    </div>
  );
};
