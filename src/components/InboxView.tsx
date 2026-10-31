import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  Tag,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react';
import { InboxTask, Category, Priority, ScheduleBlock } from '../types';
import {
  getTodayDateString,
  addMinutesToTime,
  formatFriendlyDate,
  formatDisplayTime,
} from '../utils/time';

interface InboxViewProps {
  inbox: InboxTask[];
  categories: Category[];
  blocks: ScheduleBlock[];
  timeFormat: '12h' | '24h';
  currentDate: string;
  onAddInboxTask: (task: Omit<InboxTask, 'id' | 'createdAt'>) => void;
  onDeleteInboxTask: (taskId: string) => void;
  onScheduleTaskAsNewBlock: (
    task: InboxTask,
    targetDate: string,
    startTime: string,
    durationMinutes: number
  ) => void;
  onAttachTaskToBlock: (task: InboxTask, targetBlockId: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  inbox,
  categories,
  blocks,
  timeFormat,
  currentDate,
  onAddInboxTask,
  onDeleteInboxTask,
  onScheduleTaskAsNewBlock,
  onAttachTaskToBlock,
}) => {
  // New task form state
  const [title, setTitle] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<Priority>('medium');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');

  // Scheduling modal state
  const [schedulingTask, setSchedulingTask] = useState<InboxTask | null>(null);
  const [scheduleMode, setScheduleMode] = useState<'new_block' | 'attach_block'>('new_block');
  const [targetDate, setTargetDate] = useState(currentDate || getTodayDateString());
  const [targetStartTime, setTargetStartTime] = useState('09:00');
  const [targetBlockId, setTargetBlockId] = useState('');

  // Blocks on target date
  const blocksOnTargetDate = blocks.filter((b) => b.date === targetDate);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddInboxTask({
      title: title.trim(),
      estimatedMinutes,
      priority,
      categoryId: categoryId || undefined,
      note: note.trim() || undefined,
    });

    setTitle('');
    setNote('');
  };

  const handleStartSchedule = (task: InboxTask) => {
    setSchedulingTask(task);
    setTargetDate(currentDate);
    setTargetStartTime('10:00');
    setTargetBlockId(blocksOnTargetDate[0]?.id || '');
  };

  const handleConfirmSchedule = () => {
    if (!schedulingTask) return;

    if (scheduleMode === 'new_block') {
      onScheduleTaskAsNewBlock(
        schedulingTask,
        targetDate,
        targetStartTime,
        schedulingTask.estimatedMinutes || 30
      );
    } else {
      if (!targetBlockId) return;
      onAttachTaskToBlock(schedulingTask, targetBlockId);
    }

    setSchedulingTask(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Task Inbox
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capture tasks without scheduling friction. Drag or schedule into blocks whenever ready.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg">
            {inbox.length} {inbox.length === 1 ? 'task unassigned' : 'tasks unassigned'}
          </span>
        </div>
      </div>

      {/* Quick Add Form */}
      <form
        onSubmit={handleCreateTask}
        className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
      >
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
          Quick Capture to Inbox
        </span>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="What needs to get done? (e.g. Call accountant, Read design system doc)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Estimated duration */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>Est. duration:</span>
            <select
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono"
            >
              <option value={15}>15 mins</option>
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Priority:</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 capitalize font-medium"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Category:</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Task Cards List */}
      <div className="space-y-2.5">
        {inbox.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Inbox is empty! Tasks you don't have time to schedule immediately can be kept here.
          </div>
        ) : (
          inbox.map((task) => {
            const cat = categories.find((c) => c.id === task.categoryId);
            return (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: cat?.color || '#94a3b8' }}
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {task.title}
                    </h4>
                    {task.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {task.note}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-mono">{task.estimatedMinutes} min</span>
                      <span>·</span>
                      <span className="capitalize font-medium">{task.priority}</span>
                      {cat && (
                        <>
                          <span>·</span>
                          <span>{cat.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleStartSchedule(task)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule</span>
                  </button>
                  <button
                    onClick={() => onDeleteInboxTask(task.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Scheduling Modal */}
      {schedulingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Schedule Task
                </h3>
              </div>
              <button
                onClick={() => setSchedulingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Task:</span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {schedulingTask.title}
                </p>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mt-1 block">
                  Est. duration: {schedulingTask.estimatedMinutes}m
                </span>
              </div>

              {/* Mode Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  How would you like to schedule this?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('new_block')}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      scheduleMode === 'new_block'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Create New Block
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('attach_block');
                      if (blocksOnTargetDate.length > 0 && !targetBlockId) {
                        setTargetBlockId(blocksOnTargetDate[0].id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      scheduleMode === 'attach_block'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Add to Existing Block
                  </button>
                </div>
              </div>

              {/* Target Date Picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* If New Block: pick Start Time */}
              {scheduleMode === 'new_block' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Block Start Time
                  </label>
                  <input
                    type="time"
                    value={targetStartTime}
                    onChange={(e) => setTargetStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will end at{' '}
                    <span className="font-mono font-medium">
                      {formatDisplayTime(
                        addMinutesToTime(targetStartTime, schedulingTask.estimatedMinutes),
                        timeFormat
                      )}
                    </span>
                  </p>
                </div>
              )}

              {/* If Attach to Block: dropdown of blocks on that date */}
              {scheduleMode === 'attach_block' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Block on {formatFriendlyDate(targetDate)}
                  </label>
                  {blocksOnTargetDate.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40">
                      No blocks found on this date. Switch to "Create New Block".
                    </p>
                  ) : (
                    <select
                      value={targetBlockId}
                      onChange={(e) => setTargetBlockId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {blocksOnTargetDate.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.icon} {b.title} ({formatDisplayTime(b.startTime, timeFormat)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSchedulingTask(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={scheduleMode === 'attach_block' && !targetBlockId}
                  onClick={handleConfirmSchedule}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-40"
                >
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
