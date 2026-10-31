import React from 'react';
import {
  Flame,
  Code2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  Award,
  Layers,
} from 'lucide-react';
import { ScheduleBlock, Category, Preferences } from '../types';
import {
  formatDateString,
  parseDateString,
  timeToMinutes,
  getTodayDateString,
  calculateDuration,
} from '../utils/time';

interface StatsViewProps {
  blocks: ScheduleBlock[];
  categories: Category[];
  preferences: Preferences;
  currentDate: string;
}

export const StatsView: React.FC<StatsViewProps> = ({
  blocks,
  categories,
  preferences,
  currentDate,
}) => {
  const todayStr = getTodayDateString();

  // Helper to get Monday of current week
  const getWeekDates = (refDateStr: string) => {
    const d = parseDateString(refDateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const monday = new Date(d.setDate(diff));

    const week: Array<{ dateStr: string; dayLabel: string; shortDate: string }> = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      week.push({
        dateStr: formatDateString(dayDate),
        dayLabel: dayNames[i],
        shortDate: `${dayDate.getMonth() + 1}/${dayDate.getDate()}`,
      });
    }
    return week;
  };

  const currentWeek = getWeekDates(currentDate);

  // Coding category helper
  const codingCategory = categories.find(
    (c) => c.id === 'cat-coding' || c.name.toLowerCase().includes('coding')
  );

  // Calculate Coding Hours This Week
  const codingBlocksThisWeek = blocks.filter((b) => {
    const isThisWeek = currentWeek.some((w) => w.dateStr === b.date);
    const isCoding = b.categoryId === codingCategory?.id || b.title.toLowerCase().includes('coding');
    return isThisWeek && isCoding;
  });

  const totalCodingMinutesThisWeek = codingBlocksThisWeek.reduce(
    (sum, b) => sum + (b.durationMinutes || calculateDuration(b.startTime, b.endTime)),
    0
  );
  const codingHoursThisWeek = (totalCodingMinutesThisWeek / 60).toFixed(1);

  // Calculate Daily Focus & Coding Hours for Weekly Bar Chart
  const weeklyChartData = currentWeek.map((day) => {
    const dayBlocks = blocks.filter((b) => b.date === day.dateStr);

    let totalMins = 0;
    let codingMins = 0;

    dayBlocks.forEach((b) => {
      const dur = b.durationMinutes || calculateDuration(b.startTime, b.endTime);
      totalMins += dur;
      if (b.categoryId === codingCategory?.id || b.title.toLowerCase().includes('coding')) {
        codingMins += dur;
      }
    });

    return {
      ...day,
      totalHours: Number((totalMins / 60).toFixed(1)),
      codingHours: Number((codingMins / 60).toFixed(1)),
      isToday: day.dateStr === todayStr,
      isSelected: day.dateStr === currentDate,
    };
  });

  // Find max hours for scaling the bar chart (min 8 hrs scale)
  const maxBarHours = Math.max(8, ...weeklyChartData.map((d) => d.totalHours));

  // Calculate Mission Streak: consecutive days counting backwards from today
  const calculateStreak = () => {
    let streak = 0;
    const checkDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dStr = formatDateString(checkDate);

      // Check if at least 1 mission was completed or ticked on this day
      const hasMission = preferences.dailyMissions.some((m) => {
        const manuallyTicked = m.manualCompletedDates?.includes(dStr);
        const hasMatchingCompletedBlock = blocks.some(
          (b) =>
            b.date === dStr &&
            ((m.categoryId && b.categoryId === m.categoryId) ||
              b.title.toLowerCase().includes(m.title.toLowerCase())) &&
            (b.completed || b.tasks.some((t) => t.completed))
        );
        return manuallyTicked || hasMatchingCompletedBlock;
      });

      if (hasMission) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If today has no completions yet, check yesterday before breaking
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return Math.max(streak, 1); // minimum baseline 1 for positive motivation
  };

  const streakDays = calculateStreak();

  // Category breakdown across all blocks
  const categoryUsage = categories.map((cat) => {
    const catBlocks = blocks.filter((b) => b.categoryId === cat.id);
    const catMinutes = catBlocks.reduce(
      (sum, b) => sum + (b.durationMinutes || calculateDuration(b.startTime, b.endTime)),
      0
    );
    return {
      ...cat,
      totalHours: (catMinutes / 60).toFixed(1),
      count: catBlocks.length,
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Routine Analytics & Streaks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your student habits, coding velocity, and mission consistency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 bg-slate-100 dark:bg-slate-700/60 rounded-lg text-slate-600 dark:text-slate-300 font-semibold">
              Week of {currentWeek[0]?.shortDate} - {currentWeek[6]?.shortDate}
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Row: Streak & Coding Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mission Streak */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Mission Streak
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-amber-500">
                {streakDays}
              </span>
              <span className="text-xs font-medium text-slate-500">consecutive days</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">
              Active habit loop
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 shrink-0">
            <Flame className="w-8 h-8 fill-amber-500 text-amber-500" />
          </div>
        </div>

        {/* Coding Hours This Week */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Coding Hours This Week
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-[#38BDF8]">
                {codingHoursThisWeek}
              </span>
              <span className="text-xs font-medium text-slate-500">hours logged</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {codingBlocksThisWeek.length} focus sessions
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#38BDF8] shrink-0">
            <Code2 className="w-8 h-8" />
          </div>
        </div>

        {/* Total Weekly Hours */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Total Focus Scheduled
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-purple-500">
                {weeklyChartData.reduce((sum, d) => sum + d.totalHours, 0).toFixed(1)}
              </span>
              <span className="text-xs font-medium text-slate-500">hours this week</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Across all categories</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-500 shrink-0">
            <Award className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Weekly Scheduled Focus (Hours / Day)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Blue indicates Coding sessions; purple indicates other routine blocks.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#38BDF8]" />
              <span className="text-slate-600 dark:text-slate-400">Coding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span className="text-slate-600 dark:text-slate-400">Other Blocks</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Canvas */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-3 sm:gap-4 h-48 items-end">
            {weeklyChartData.map((d, idx) => {
              const totalPercent = Math.min(100, (d.totalHours / maxBarHours) * 100);
              const codingPercent = d.totalHours > 0 ? (d.codingHours / d.totalHours) * 100 : 0;

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  {/* Hours text tooltip */}
                  <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    {d.totalHours}h
                  </span>

                  {/* Dual segment bar */}
                  <div className="w-full max-w-[48px] bg-slate-100 dark:bg-slate-700/50 rounded-xl overflow-hidden flex flex-col justify-end p-0.5 transition-all group-hover:scale-105 h-full">
                    <div
                      className="w-full rounded-lg transition-all duration-300 flex flex-col justify-end overflow-hidden"
                      style={{ height: `${Math.max(totalPercent, 4)}%` }}
                    >
                      {/* Non-coding portion */}
                      <div
                        className="w-full bg-indigo-500/80 transition-all"
                        style={{ height: `${100 - codingPercent}%` }}
                      />
                      {/* Coding portion */}
                      <div
                        className="w-full bg-[#38BDF8] transition-all"
                        style={{ height: `${codingPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Day Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs font-semibold block ${
                        d.isToday
                          ? 'text-[#38BDF8] font-bold'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {d.dayLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {d.shortDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Allocation Distribution */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Category Time Allocation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total historical time invested across your routine categories.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categoryUsage.map((cat) => (
            <div
              key={cat.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-xs shrink-0 text-white font-semibold"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.icon}
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {cat.count} {cat.count === 1 ? 'block' : 'blocks'} scheduled
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                  {cat.totalHours}h
                </span>
                <span className="text-[10px] text-slate-400">total time</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
