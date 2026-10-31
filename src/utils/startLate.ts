import { ScheduleBlock } from '../types';
import {
  timeToMinutes,
  minutesToTime,
  calculateDuration,
  getTodayDateString,
} from './time';

export interface StartLateRebuildResult {
  updatedBlocks: ScheduleBlock[];
  droppedBlocks: ScheduleBlock[];
  shrunkBlocks: Array<{ id: string; title: string; originalDuration: number; newDuration: number }>;
  startTimeStr: string;
  targetBedtimeStr: string;
  summary: string;
}

/**
 * Rebuilds the rest of today from current time:
 * - Starts from current time (rounded up to nearest 5 minutes)
 * - Shrinks or drops low-priority blocks first if schedule overflows
 * - Never pushes bedtime past targetBedtime
 */
export function rebuildScheduleStartingLate(
  allBlocks: ScheduleBlock[],
  currentDateStr: string,
  targetBedtime: string,
  customStartTime?: string
): StartLateRebuildResult {
  // Determine start time
  let startMins: number;
  if (customStartTime) {
    startMins = timeToMinutes(customStartTime);
  } else {
    const now = new Date();
    const rawMins = now.getHours() * 60 + now.getMinutes();
    // Round up to nearest 5 minutes
    startMins = Math.ceil(rawMins / 5) * 5;
  }

  const startTimeStr = minutesToTime(startMins);
  const bedMins = timeToMinutes(targetBedtime);

  // If bedtime is before or equal to start time (e.g. past midnight or already late)
  const effectiveBedMins = bedMins <= startMins ? startMins + 120 : bedMins;
  const availableMinutes = Math.max(30, effectiveBedMins - startMins);

  // Separate today's blocks from other dates
  const todayBlocks = allBlocks.filter((b) => b.date === currentDateStr);
  const otherBlocks = allBlocks.filter((b) => b.date !== currentDateStr);

  // Past blocks: blocks that already finished before startMins
  const pastBlocks: ScheduleBlock[] = [];
  // Remaining blocks: blocks currently underway or scheduled later
  const remainingBlocks: ScheduleBlock[] = [];

  todayBlocks.forEach((block) => {
    const bEnd = timeToMinutes(block.endTime);
    if (bEnd <= startMins) {
      pastBlocks.push(block);
    } else {
      remainingBlocks.push({ ...block });
    }
  });

  if (remainingBlocks.length === 0) {
    return {
      updatedBlocks: allBlocks,
      droppedBlocks: [],
      shrunkBlocks: [],
      startTimeStr,
      targetBedtimeStr: targetBedtime,
      summary: 'No remaining blocks to reschedule for today.',
    };
  }

  // Work on a mutable clone of remaining blocks
  let candidates = remainingBlocks.map((b) => ({
    ...b,
    currentDuration: b.durationMinutes || calculateDuration(b.startTime, b.endTime),
    originalDuration: b.durationMinutes || calculateDuration(b.startTime, b.endTime),
  }));

  const droppedBlocks: ScheduleBlock[] = [];
  const shrunkBlocks: Array<{ id: string; title: string; originalDuration: number; newDuration: number }> = [];

  // Step 1: Check total required duration
  let totalNeeded = candidates.reduce((sum, b) => sum + b.currentDuration, 0);

  // If overflowing: Drop low-priority blocks first
  if (totalNeeded > availableMinutes) {
    // Candidates with 'low' priority
    const lowPriority = candidates.filter((b) => b.priority === 'low');
    for (const lowBlock of lowPriority) {
      if (totalNeeded <= availableMinutes) break;
      droppedBlocks.push(lowBlock);
      candidates = candidates.filter((b) => b.id !== lowBlock.id);
      totalNeeded = candidates.reduce((sum, b) => sum + b.currentDuration, 0);
    }
  }

  // Step 2: If still overflowing, shrink medium priority blocks down to min 25 mins
  if (totalNeeded > availableMinutes) {
    for (const b of candidates) {
      if (b.priority === 'medium' && b.currentDuration > 25) {
        const canCut = b.currentDuration - 25;
        const neededCut = totalNeeded - availableMinutes;
        const cut = Math.min(canCut, neededCut);
        if (cut > 0) {
          b.currentDuration -= cut;
          shrunkBlocks.push({
            id: b.id,
            title: b.title,
            originalDuration: b.originalDuration,
            newDuration: b.currentDuration,
          });
          totalNeeded -= cut;
        }
      }
      if (totalNeeded <= availableMinutes) break;
    }
  }

  // Step 3: If still overflowing, shrink high priority blocks down to min 35 mins
  if (totalNeeded > availableMinutes) {
    for (const b of candidates) {
      if (b.priority === 'high' && b.currentDuration > 35) {
        const canCut = b.currentDuration - 35;
        const neededCut = totalNeeded - availableMinutes;
        const cut = Math.min(canCut, neededCut);
        if (cut > 0) {
          b.currentDuration -= cut;
          shrunkBlocks.push({
            id: b.id,
            title: b.title,
            originalDuration: b.originalDuration,
            newDuration: b.currentDuration,
          });
          totalNeeded -= cut;
        }
      }
      if (totalNeeded <= availableMinutes) break;
    }
  }

  // Step 4: If STILL overflowing, drop medium priority blocks
  if (totalNeeded > availableMinutes) {
    const mediumPriority = candidates.filter((b) => b.priority === 'medium');
    for (const medBlock of mediumPriority) {
      if (totalNeeded <= availableMinutes) break;
      droppedBlocks.push(medBlock);
      candidates = candidates.filter((b) => b.id !== medBlock.id);
      totalNeeded = candidates.reduce((sum, b) => sum + b.currentDuration, 0);
    }
  }

  // Step 5: Lay out surviving candidates sequentially starting at startMins
  let runningMins = startMins;
  const rescheduledBlocks: ScheduleBlock[] = candidates.map((c) => {
    const bStart = minutesToTime(runningMins);
    const bEnd = minutesToTime(runningMins + c.currentDuration);
    runningMins += c.currentDuration;
    return {
      ...c,
      startTime: bStart,
      endTime: bEnd,
      durationMinutes: c.currentDuration,
    };
  });

  const updatedTodayBlocks = [...pastBlocks, ...rescheduledBlocks];
  const updatedAllBlocks = [...otherBlocks, ...updatedTodayBlocks];

  // Compose human-readable summary
  let summary = `Rebuilt routine starting at ${startTimeStr}. `;
  if (droppedBlocks.length > 0) {
    summary += `Dropped ${droppedBlocks.length} low-priority ${droppedBlocks.length === 1 ? 'block' : 'blocks'} (${droppedBlocks.map((d) => d.title).join(', ')}). `;
  }
  if (shrunkBlocks.length > 0) {
    summary += `Compressed ${shrunkBlocks.length} ${shrunkBlocks.length === 1 ? 'block' : 'blocks'} to fit before bedtime (${targetBedtime}). `;
  }
  if (droppedBlocks.length === 0 && shrunkBlocks.length === 0) {
    summary += `All remaining blocks shifted sequentially to end comfortably by ${targetBedtime}.`;
  }

  return {
    updatedBlocks: updatedAllBlocks,
    droppedBlocks,
    shrunkBlocks,
    startTimeStr,
    targetBedtimeStr: targetBedtime,
    summary,
  };
}
