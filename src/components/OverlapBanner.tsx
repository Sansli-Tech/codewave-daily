import React from 'react';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { OverlapPair, formatDisplayTime } from '../utils/time';

interface OverlapBannerProps {
  overlaps: OverlapPair[];
  timeFormat: '12h' | '24h';
  onAutoFix: () => void;
  onDismiss: () => void;
}

export const OverlapBanner: React.FC<OverlapBannerProps> = ({
  overlaps,
  timeFormat,
  onAutoFix,
  onDismiss,
}) => {
  if (overlaps.length === 0) return null;

  const firstOverlap = overlaps[0];

  return (
    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-2">
              <span>Schedule Overlap Detected</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900/80 font-mono font-medium">
                {overlaps.length} {overlaps.length === 1 ? 'collision' : 'collisions'}
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
              "{firstOverlap.blockA.title}" ({formatDisplayTime(firstOverlap.blockA.startTime, timeFormat)} - {formatDisplayTime(firstOverlap.blockA.endTime, timeFormat)}) overlaps with "{firstOverlap.blockB.title}" ({formatDisplayTime(firstOverlap.blockB.startTime, timeFormat)} - {formatDisplayTime(firstOverlap.blockB.endTime, timeFormat)}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
          >
            Keep Anyway
          </button>
          <button
            onClick={onAutoFix}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 rounded-lg shadow-xs transition-colors"
          >
            <span>Auto-Fix (Push Later)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
