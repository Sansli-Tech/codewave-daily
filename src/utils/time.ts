import { ScheduleBlock, RepeatRule } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(totalMinutes: number): string {
  // Clamp within 0 to 1439 (23:59)
  const normalized = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatDisplayTime(timeStr: string, format: '12h' | '24h' = '24h'): string {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;

  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

export function calculateDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (end < start) {
    // Crosses midnight, treat end as end + 1440
    end += 1440;
  }
  return Math.max(5, end - start);
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const mins = timeToMinutes(timeStr) + minutes;
  return minutesToTime(mins);
}

export function getTodayDateString(): string {
  const now = new Date();
  return formatDateString(now);
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatFriendlyDate(dateStr: string): string {
  const date = parseDateString(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayMonth = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diffDays === 0) return `Today, ${dayMonth}`;
  if (diffDays === 1) return `Tomorrow, ${dayMonth}`;
  if (diffDays === -1) return `Yesterday, ${dayMonth}`;
  return `${weekday}, ${dayMonth}`;
}

/**
 * Check if a block applies to a given target date
 */
export function isBlockActiveOnDate(block: ScheduleBlock, targetDateStr: string): boolean {
  // If target date is listed in repeat exceptions, don't show
  if (block.repeatExceptions?.includes(targetDateStr)) {
    return false;
  }

  const targetDate = parseDateString(targetDateStr);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // If block is anchored to this exact date
  if (block.date === targetDateStr) {
    return true;
  }

  // If created after target date, don't show on past dates
  if (block.date > targetDateStr) {
    return false;
  }

  switch (block.repeatRule) {
    case 'today':
      return block.date === targetDateStr;
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      return Boolean(block.customDays?.includes(dayOfWeek));
    default:
      return block.date === targetDateStr;
  }
}

/**
 * Detect overlaps among blocks active on a given date
 */
export interface OverlapPair {
  blockA: ScheduleBlock;
  blockB: ScheduleBlock;
}

export function detectOverlaps(blocks: ScheduleBlock[]): OverlapPair[] {
  const overlaps: OverlapPair[] = [];
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      if (aStart < bEnd && aEnd > bStart) {
        overlaps.push({ blockA: a, blockB: b });
      }
    }
  }

  return overlaps;
}

/**
 * Auto-fix overlaps by pushing subsequent blocks later sequentially, maintaining their original durations
 */
export function autoFixOverlaps(blocks: ScheduleBlock[]): ScheduleBlock[] {
  if (blocks.length <= 1) return blocks;

  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const result: ScheduleBlock[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = { ...sorted[i] };
    const curDuration = current.durationMinutes || calculateDuration(current.startTime, current.endTime);

    if (i > 0) {
      const prev = result[i - 1];
      const prevEndMin = timeToMinutes(prev.endTime);
      const curStartMin = timeToMinutes(current.startTime);

      if (curStartMin < prevEndMin) {
        // Push this block to start immediately after the previous block
        current.startTime = minutesToTime(prevEndMin);
        current.endTime = minutesToTime(prevEndMin + curDuration);
        current.durationMinutes = curDuration;
      }
    }

    result.push(current);
  }

  return result;
}

/**
 * Push following blocks later when an edited block's end time moves or start time moves
 */
export function pushFollowingBlocksLater(
  allBlocks: ScheduleBlock[],
  editedBlockId: string,
  newEndTime: string,
  previousEndTime: string
): ScheduleBlock[] {
  const deltaMinutes = timeToMinutes(newEndTime) - timeToMinutes(previousEndTime);
  if (deltaMinutes <= 0) return allBlocks;

  const targetEndMin = timeToMinutes(newEndTime);

  return allBlocks.map((b) => {
    if (b.id === editedBlockId) return b;
    const bStartMin = timeToMinutes(b.startTime);

    // If block starts at or after the original edit boundary, push it
    if (bStartMin >= timeToMinutes(previousEndTime)) {
      const duration = b.durationMinutes || calculateDuration(b.startTime, b.endTime);
      const newStart = minutesToTime(Math.max(targetEndMin, bStartMin + deltaMinutes));
      const newEnd = minutesToTime(timeToMinutes(newStart) + duration);
      return {
        ...b,
        startTime: newStart,
        endTime: newEnd,
      };
    }
    return b;
  });
}

/**
 * Calculate planned sleep window
 */
export function calculateSleepStats(bedtime: string, wakeUpTime: string, minRequiredHours: number) {
  const bedMins = timeToMinutes(bedtime);
  let wakeMins = timeToMinutes(wakeUpTime);
  if (wakeMins <= bedMins) {
    wakeMins += 1440; // Sleep crosses midnight
  }
  const totalSleepMinutes = wakeMins - bedMins;
  const totalSleepHours = Number((totalSleepMinutes / 60).toFixed(1));
  const diffHours = Number((totalSleepHours - minRequiredHours).toFixed(1));
  const isSufficient = diffHours >= 0;

  return {
    totalSleepHours,
    diffHours,
    isSufficient,
  };
}
