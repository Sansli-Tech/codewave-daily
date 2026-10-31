import React, { useState } from 'react';
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  Repeat,
  Target,
  ArrowRight,
  Lock,
  Unlock,
  Play,
  Gamepad2,
  FastForward,
  Check,
} from 'lucide-react';
import { ScheduleBlock, Category, Preferences, DailyMission } from '../types';
import {
  formatDisplayTime,
  calculateDuration,
  timeToMinutes,
  minutesToTime,
  OverlapPair,
} from '../utils/time';

interface TimelineViewProps {
  currentDate: string;
  blocks: ScheduleBlock[];
  categories: Category[];
  preferences: Preferences;
  timeFormat: '12h' | '24h';
  overlaps: OverlapPair[];
  onOpenAddModal: () => void;
  onOpenBlockDetail: (block: ScheduleBlock) => void;
  onQuickEditBlock: (block: ScheduleBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onReorderBlocks: (fromIndex: number, toIndex: number) => void;
  onOpenCarryOverModal: () => void;
  hasUnfinishedTasks: boolean;
  onOpenTemplates: () => void;
  onStartLate: () => void;
  onStartCODMTimer: (block: ScheduleBlock) => void;
  onToggleManualMission: (missionId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  currentDate,
  blocks,
  categories,
  preferences,
  timeFormat,
  overlaps,
  onOpenAddModal,
  onOpenBlockDetail,
  onQuickEditBlock,
  onDeleteBlock,
  onReorderBlocks,
  onOpenCarryOverModal,
  hasUnfinishedTasks,
  onOpenTemplates,
  onStartLate,
  onStartCODMTimer,
  onToggleManualMission,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  // Total scheduled minutes
  const totalScheduledMinutes = sortedBlocks.reduce(
    (acc, b) => acc + (b.durationMinutes || calculateDuration(b.startTime, b.endTime)),
    0
  );
  const totalHours = (totalScheduledMinutes / 60).toFixed(1);

  // Calculate Daily 3 mission completions (manual tick OR matching block completed)
  const missionStatus = preferences.dailyMissions.map((mission) => {
    const isManuallyTicked = mission.manualCompletedDates?.includes(currentDate);

    const matchingBlocks = sortedBlocks.filter(
      (b) =>
        (mission.categoryId && b.categoryId === mission.categoryId) ||
        b.title.toLowerCase().includes(mission.title.toLowerCase())
    );
    const hasCompletedTasks = matchingBlocks.some(
      (b) => b.tasks.length > 0 && b.tasks.every((t) => t.completed)
    );
    const hasCompletedBlock = matchingBlocks.some((b) => b.completed);

    const isDone = Boolean(isManuallyTicked || hasCompletedTasks || hasCompletedBlock);
    return { ...mission, isDone, isManuallyTicked };
  });

  const missionsCompletedCount = missionStatus.filter((m) => m.isDone).length;

  // Study & Coding check for CODM unlock
  const studyMission = missionStatus.find(
    (m) => m.categoryId === 'cat-study' || m.title.toLowerCase().includes('study')
  );
  const codingMission = missionStatus.find(
    (m) => m.categoryId === 'cat-coding' || m.title.toLowerCase().includes('coding')
  );

  const isStudyDone = Boolean(studyMission?.isDone);
  const isCodingDone = Boolean(codingMission?.isDone);
  const isCODMUnlocked = !preferences.codmLock || (isStudyDone && isCodingDone);

  const isBlockOverlapping = (blockId: string) => {
    return overlaps.some((o) => o.blockA.id === blockId || o.blockB.id === blockId);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Scheduled Time Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Planned Focus Time
            </span>
            <span className="font-mono text-[#38BDF8] font-bold">
              {totalHours} hrs
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {sortedBlocks.length}
            </span>
            <span className="text-xs text-slate-500">
              {sortedBlocks.length === 1 ? 'block scheduled' : 'blocks scheduled'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target Bedtime:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {formatDisplayTime(preferences.targetBedtime, timeFormat)}
            </span>
          </div>
        </div>

        {/* Daily 3 Missions Card with Manual Ticking */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              <span>Daily Missions</span>
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {missionsCompletedCount}/{preferences.dailyMissions.length}
            </span>
          </div>

          {/* Interactive Manual Checkboxes */}
          <div className="space-y-1.5 pt-1">
            {preferences.dailyMissions.map((m, i) => {
              const status = missionStatus[i];
              return (
                <button
                  key={m.id}
                  onClick={() => onToggleManualMission(m.id)}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg border text-left text-xs transition-colors ${
                    status?.isDone
                      ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                  title="Click to toggle mission completion manually"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm">{m.icon}</span>
                    <span className={`truncate text-[11px] ${status?.isDone ? 'font-bold' : 'font-medium'}`}>
                      {m.title}
                    </span>
                  </div>
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                      status?.isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {status?.isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Actions & "I'm Starting Late" */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Day Status & Actions
            </span>
            {hasUnfinishedTasks && (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Pending tasks" />
            )}
          </div>

          <div className="space-y-2">
            {/* I'm Starting Late button */}
            <button
              onClick={onStartLate}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-amber-950 dark:text-amber-100 bg-amber-400 hover:bg-amber-300 dark:bg-amber-500 dark:hover:bg-amber-400 rounded-xl transition-all shadow-xs"
              title="Rebuild today from current time, keeping bedtime fixed"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>I'm starting late</span>
            </button>

            <div className="flex items-center gap-2">
              {hasUnfinishedTasks ? (
                <button
                  onClick={onOpenCarryOverModal}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-xl transition-colors truncate"
                >
                  Carry Over Tasks
                </button>
              ) : (
                <span className="text-xs text-slate-400 truncate">Tasks up to date</span>
              )}
              <button
                onClick={onOpenTemplates}
                className="py-1.5 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors whitespace-nowrap"
              >
                Templates
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Blocks Timeline List */}
      <div className="space-y-3">
        {sortedBlocks.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/10 text-[#38BDF8] mx-auto flex items-center justify-center text-xl mb-3">
              📅
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No blocks scheduled for this day
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Apply student templates (Lecture day or Home day) or add custom focus blocks.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Schedule Block</span>
              </button>
              <button
                onClick={onOpenTemplates}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Apply Template
              </button>
            </div>
          </div>
        ) : (
          sortedBlocks.map((block, index) => {
            const category = categories.find((c) => c.id === block.categoryId);
            const isOverlap = isBlockOverlapping(block.id);
            const totalTasks = block.tasks.length;
            const completedTasks = block.tasks.filter((t) => t.completed).length;

            const isCODMBlock =
              block.categoryId === 'cat-codm' || block.title.toLowerCase().includes('codm');
            const isLocked = isCODMBlock && !isCODMUnlocked;

            return (
              <div
                key={block.id}
                className={`group relative flex items-stretch rounded-2xl border transition-all duration-150 ${
                  isLocked
                    ? 'border-slate-300 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40 opacity-80'
                    : isOverlap
                    ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Category colored indicator bar */}
                <div
                  className="w-1.5 rounded-l-2xl shrink-0"
                  style={{ backgroundColor: category?.color || '#38BDF8' }}
                />

                {/* Main Card Content */}
                <div
                  onClick={() => !isLocked && onOpenBlockDetail(block)}
                  className={`flex-1 p-4 min-w-0 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0 p-1 bg-slate-50 dark:bg-slate-700/60 rounded-lg">
                        {block.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {block.title}
                          </h4>
                          {isLocked && (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 rounded-md flex items-center gap-1 border border-rose-200 dark:border-rose-900">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          )}
                          {!isLocked && isCODMBlock && (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 rounded-md flex items-center gap-1 border border-emerald-200 dark:border-emerald-900">
                              <Unlock className="w-3 h-3" />
                              <span>Unlocked</span>
                            </span>
                          )}
                          {isOverlap && !isLocked && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/80 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Overlap</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: category?.color || '#38BDF8' }}
                          />
                          <span className="font-medium">{category?.name || 'Category'}</span>
                          <span>·</span>
                          <span className="capitalize text-[11px] font-semibold text-slate-400">
                            {block.priority} priority
                          </span>
                          {block.repeatRule !== 'today' && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-[11px] text-[#38BDF8]">
                                <Repeat className="w-3 h-3" />
                                <span className="capitalize">{block.repeatRule}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Time, Duration & CODM Timer button */}
                    <div className="flex items-center gap-2 self-start sm:self-center font-mono">
                      {isCODMBlock && !isLocked && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartCODMTimer(block);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors"
                          title="Open CODM countdown timer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>CODM Timer</span>
                        </button>
                      )}

                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700/70 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {formatDisplayTime(block.startTime, timeFormat)} -{' '}
                          {formatDisplayTime(block.endTime, timeFormat)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {block.durationMinutes || calculateDuration(block.startTime, block.endTime)}m
                      </span>
                    </div>
                  </div>

                  {/* CODM Locked explanation banner */}
                  {isLocked && (
                    <div className="mt-2 p-2 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>
                        CODM is locked until your <strong>Study</strong> and <strong>Coding</strong> missions are checked off for today!
                      </span>
                    </div>
                  )}

                  {/* Note or Checklist Summary */}
                  {!isLocked && block.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">
                      {block.note}
                    </p>
                  )}

                  {!isLocked && totalTasks > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>
                          {completedTasks}/{totalTasks} tasks
                        </span>
                      </div>
                      <div className="flex-1 max-w-[120px] bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Reorder & Quick Action Column */}
                <div className="flex flex-col items-center justify-center p-2 border-l border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/40 gap-1 rounded-r-2xl shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => onReorderBlocks(index, index - 1)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Move earlier"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === sortedBlocks.length - 1}
                    onClick={() => onReorderBlocks(index, index + 1)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Move later"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onQuickEditBlock(block)}
                    className="p-1.5 text-slate-400 hover:text-[#38BDF8] rounded hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
                    title="Edit block settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmId === block.id) {
                        onDeleteBlock(block.id);
                        setDeleteConfirmId(null);
                      } else {
                        setDeleteConfirmId(block.id);
                        setTimeout(() => setDeleteConfirmId(null), 3500);
                      }
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      deleteConfirmId === block.id
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                    title={deleteConfirmId === block.id ? 'Click to confirm delete' : 'Delete block'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Add Block Action Button */}
      <div className="fixed bottom-6 right-6 z-20">
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#38BDF8] to-indigo-600 hover:opacity-95 text-slate-950 font-bold text-sm shadow-xl hover:shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          <span>Add Block</span>
        </button>
      </div>
    </div>
  );
};
