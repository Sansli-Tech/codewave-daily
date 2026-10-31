import React, { useState } from 'react';
import { CheckSquare, ArrowRight, Trash2, Calendar, Inbox, X } from 'lucide-react';
import { TaskItem, ScheduleBlock } from '../types';
import { getTodayDateString, addMinutesToTime, formatDateString, parseDateString } from '../utils/time';

interface UnfinishedTaskRecord {
  task: TaskItem;
  blockId: string;
  blockTitle: string;
}

interface CarryOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  unfinishedRecords: UnfinishedTaskRecord[];
  onCarryOverToDate: (taskIds: string[], targetDate: string) => void;
  onCarryOverToInbox: (taskIds: string[]) => void;
  onDiscardTasks: (taskIds: string[]) => void;
}

export const CarryOverModal: React.FC<CarryOverModalProps> = ({
  isOpen,
  onClose,
  unfinishedRecords,
  onCarryOverToDate,
  onCarryOverToInbox,
  onDiscardTasks,
}) => {
  if (!isOpen || unfinishedRecords.length === 0) return null;

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    unfinishedRecords.map((r) => r.task.id)
  );

  const tomorrow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateString(d);
  })();

  const [customDate, setCustomDate] = useState<string>(tomorrow);

  const toggleTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedTaskIds.length === unfinishedRecords.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(unfinishedRecords.map((r) => r.task.id));
    }
  };

  const handleTomorrow = () => {
    if (selectedTaskIds.length === 0) return;
    onCarryOverToDate(selectedTaskIds, tomorrow);
    onClose();
  };

  const handleCustomDate = () => {
    if (selectedTaskIds.length === 0 || !customDate) return;
    onCarryOverToDate(selectedTaskIds, customDate);
    onClose();
  };

  const handleInbox = () => {
    if (selectedTaskIds.length === 0) return;
    onCarryOverToInbox(selectedTaskIds);
    onClose();
  };

  const handleDiscard = () => {
    if (selectedTaskIds.length === 0) return;
    onDiscardTasks(selectedTaskIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Carry Over Unfinished Tasks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unfinishedRecords.length} pending {unfinishedRecords.length === 1 ? 'task' : 'tasks'} from today
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

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Select tasks to carry over:</span>
            <button
              onClick={toggleAll}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {selectedTaskIds.length === unfinishedRecords.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-2">
            {unfinishedRecords.map(({ task, blockTitle }) => {
              const isChecked = selectedTaskIds.includes(task.id);
              return (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTask(task.id)}
                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      From block: {blockTitle}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Where would you like to move selected tasks?
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                disabled={selectedTaskIds.length === 0}
                onClick={handleTomorrow}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs disabled:opacity-50 transition-colors shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Move to Tomorrow</span>
              </button>

              <button
                disabled={selectedTaskIds.length === 0}
                onClick={handleInbox}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs disabled:opacity-50 transition-colors"
              >
                <Inbox className="w-4 h-4 text-indigo-500" />
                <span>Move to Inbox</span>
              </button>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="text-xs bg-transparent border-0 text-slate-800 dark:text-slate-200 focus:ring-0 flex-1"
              />
              <button
                disabled={selectedTaskIds.length === 0 || !customDate}
                onClick={handleCustomDate}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Move to Date
              </button>
            </div>

            <button
              disabled={selectedTaskIds.length === 0}
              onClick={handleDiscard}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discard selected tasks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
