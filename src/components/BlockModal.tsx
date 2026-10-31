import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Tag,
  AlertCircle,
  Repeat,
  Sparkles,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { ScheduleBlock, Category, Priority, RepeatRule } from '../types';
import {
  calculateDuration,
  minutesToTime,
  timeToMinutes,
  addMinutesToTime,
  formatDisplayTime,
} from '../utils/time';

interface BlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block?: ScheduleBlock | null; // Null if creating new
  targetDate: string;
  categories: Category[];
  timeFormat: '12h' | '24h';
  defaultDurationMinutes?: number;
  onSaveBlock: (
    blockData: Partial<ScheduleBlock>,
    options: {
      pushFollowingBlocks?: boolean;
      recurringScope?: 'just_today' | 'all_future';
    }
  ) => void;
  onOpenCategoriesManager: () => void;
}

const COMMON_EMOJIS = ['💻', '🏋️', '📚', '⛪', '💼', '🍳', '🏃', '🎯', '🧘', '🥪', '🎨', '🏛️', '🛒', '🎧', '🛌', '🚗'];
const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
const DAYS_OF_WEEK = [
  { day: 1, label: 'M' },
  { day: 2, label: 'T' },
  { day: 3, label: 'W' },
  { day: 4, label: 'T' },
  { day: 5, label: 'F' },
  { day: 6, label: 'S' },
  { day: 0, label: 'S' },
];

export const BlockModal: React.FC<BlockModalProps> = ({
  isOpen,
  onClose,
  block,
  targetDate,
  categories,
  timeFormat,
  defaultDurationMinutes = 45,
  onSaveBlock,
  onOpenCategoriesManager,
}) => {
  if (!isOpen) return null;

  const isEditMode = Boolean(block);

  const [title, setTitle] = useState(block?.title || '');
  const [categoryId, setCategoryId] = useState(block?.categoryId || categories[0]?.id || '');
  const [startTime, setStartTime] = useState(block?.startTime || '09:00');
  const [endTime, setEndTime] = useState(
    block?.endTime || minutesToTime(timeToMinutes('09:00') + defaultDurationMinutes)
  );
  const [duration, setDuration] = useState<number>(
    block ? calculateDuration(block.startTime, block.endTime) : defaultDurationMinutes
  );
  const [note, setNote] = useState(block?.note || '');
  const [icon, setIcon] = useState(block?.icon || '💻');
  const [priority, setPriority] = useState<Priority>(block?.priority || 'medium');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(block?.repeatRule || 'today');
  const [customDays, setCustomDays] = useState<number[]>(block?.customDays || [1, 2, 3, 4, 5]);

  // Edit specific options
  const [timeShiftOption, setTimeShiftOption] = useState<'push_later' | 'only_this'>('only_this');
  const [recurringChoice, setRecurringChoice] = useState<'just_today' | 'all_future'>('all_future');

  // Sync category icon default if new
  const handleSelectCategory = (newCatId: string) => {
    setCategoryId(newCatId);
    if (!block) {
      const cat = categories.find((c) => c.id === newCatId);
      if (cat) {
        setIcon(cat.icon);
      }
    }
  };

  // Synchronize start time changes
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const newEnd = minutesToTime(timeToMinutes(newStart) + duration);
    setEndTime(newEnd);
  };

  // Synchronize end time changes
  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    const newDur = calculateDuration(startTime, newEnd);
    setDuration(newDur);
  };

  // Synchronize duration presets
  const handleDurationPreset = (mins: number) => {
    setDuration(mins);
    const newEnd = minutesToTime(timeToMinutes(startTime) + mins);
    setEndTime(newEnd);
  };

  const toggleCustomDay = (dayNum: number) => {
    setCustomDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    const blockData: Partial<ScheduleBlock> = {
      ...(block || {}),
      title: title.trim(),
      categoryId,
      date: block ? block.date : targetDate,
      startTime,
      endTime,
      durationMinutes: duration,
      note: note.trim() || undefined,
      icon,
      priority,
      repeatRule,
      customDays: repeatRule === 'custom' ? customDays : undefined,
      tasks: block?.tasks || [],
    };

    onSaveBlock(blockData, {
      pushFollowingBlocks: isEditMode && timeShiftOption === 'push_later',
      recurringScope: isEditMode && block?.repeatRule !== 'today' ? recurringChoice : undefined,
    });

    onClose();
  };

  const isTimeChanged = block && (block.startTime !== startTime || block.endTime !== endTime);
  const isRepeatingBlock = block && block.repeatRule !== 'today';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="text-2xl">{icon}</div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Edit Schedule Block' : 'Add Schedule Block'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Shape your routine block around your priorities
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title & Emoji */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Block Title
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Deep Work Sprint, Gym Workout, Reading Hour"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quick Emoji selection */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Emoji Icon</span>
              <input
                type="text"
                value={icon}
                maxLength={4}
                onChange={(e) => setIcon(e.target.value)}
                className="w-10 text-center text-xs py-0.5 border border-slate-200 dark:border-slate-700 rounded bg-transparent text-slate-800 dark:text-slate-200"
                title="Custom emoji or icon"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-7 h-7 flex items-center justify-center text-sm rounded-lg border transition-all ${
                    icon === emoji
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 scale-105'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={onOpenCategoriesManager}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Custom Categories</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 font-medium'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.icon}
                    </span>
                    <span className="text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Times & Duration */}
          <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Time & Duration</span>
              </div>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {duration} minutes
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Quick duration presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Duration:</span>
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleDurationPreset(mins)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-md border transition-all ${
                    duration === mins
                      ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* If time changed in edit mode: Push following blocks vs only this block */}
            {isEditMode && isTimeChanged && (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Time Adjustment Behavior:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                      timeShiftOption === 'push_later'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeShift"
                      checked={timeShiftOption === 'push_later'}
                      onChange={() => setTimeShiftOption('push_later')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Push following blocks later</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                      timeShiftOption === 'only_this'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeShift"
                      checked={timeShiftOption === 'only_this'}
                      onChange={() => setTimeShiftOption('only_this')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Only change this block</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Priority & Repeat Rule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-medium capitalize rounded-lg border transition-all ${
                      priority === p
                        ? p === 'high'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold'
                          : p === 'medium'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold'
                          : 'border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Repeat Rule
              </label>
              <select
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="today">Today only</option>
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekends">Weekends (Sat-Sun)</option>
                <option value="custom">Custom days...</option>
              </select>
            </div>
          </div>

          {/* Custom days selector if 'custom' */}
          {repeatRule === 'custom' && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-500 block">Select active days:</span>
              <div className="flex items-center gap-1.5">
                {DAYS_OF_WEEK.map(({ day, label }) => {
                  const isActive = customDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleCustomDay(day)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If editing repeating block: ask Just today or All future days */}
          {isRepeatingBlock && (
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                <Repeat className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Repeating Block Edit Scope</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                    recurringChoice === 'just_today'
                      ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 font-semibold shadow-xs'
                      : 'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="recurringChoice"
                    checked={recurringChoice === 'just_today'}
                    onChange={() => setRecurringChoice('just_today')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Just today</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                    recurringChoice === 'all_future'
                      ? 'border-indigo-600 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 font-semibold shadow-xs'
                      : 'border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="recurringChoice"
                    checked={recurringChoice === 'all_future'}
                    onChange={() => setRecurringChoice('all_future')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>All future days</span>
                </label>
              </div>
            </div>
          )}

          {/* Optional Note / Mission */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Note or Mission (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Focus on eliminating blocking bugs; no social media tab"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
            >
              {isEditMode ? 'Update Block' : 'Add Block'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
