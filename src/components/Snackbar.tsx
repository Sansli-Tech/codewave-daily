import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { UndoRecord } from '../types';

interface SnackbarProps {
  undoRecord: UndoRecord | null;
  onClear: () => void;
  durationSeconds?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  undoRecord,
  onClear,
  durationSeconds = 5,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undoRecord) return;

    setProgress(100);
    const intervalTime = 50;
    const totalSteps = (durationSeconds * 1000) / intervalTime;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const remainingPercent = Math.max(0, 100 - (step / totalSteps) * 100);
      setProgress(remainingPercent);

      if (step >= totalSteps) {
        clearInterval(interval);
        onClear();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [undoRecord, durationSeconds, onClear]);

  if (!undoRecord) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-slate-900 text-white border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-3.5 animate-in slide-in-from-bottom-5 duration-150">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium truncate">{undoRecord.label}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                undoRecord.undo();
                onClear();
              }}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={onClear}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Countdown progress line */}
        <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
          <div
            className="bg-indigo-500 h-1 transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
