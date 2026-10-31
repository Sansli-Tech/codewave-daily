import React, { useState, useEffect, useMemo } from 'react';
import {
  ScheduleBlock,
  Category,
  InboxTask,
  DayTemplate,
  Preferences,
  UndoRecord,
  AICoachProposal,
  TaskItem,
} from './types';
import {
  StorageService,
  INITIAL_CATEGORIES,
  INITIAL_PREFERENCES,
} from './utils/storage';
import {
  getTodayDateString,
  isBlockActiveOnDate,
  detectOverlaps,
  autoFixOverlaps,
  pushFollowingBlocksLater,
  calculateDuration,
  timeToMinutes,
  minutesToTime,
  parseDateString,
  formatFriendlyDate,
} from './utils/time';

// UI Components
import { Header } from './components/Header';
import { TimelineView } from './components/TimelineView';
import { BlockModal } from './components/BlockModal';
import { BlockDetailDrawer } from './components/BlockDetailDrawer';
import { OverlapBanner } from './components/OverlapBanner';
import { CarryOverModal } from './components/CarryOverModal';
import { InboxView } from './components/InboxView';
import { TemplatesView } from './components/TemplatesView';
import { CategoriesModal } from './components/CategoriesModal';
import { PreferencesView } from './components/PreferencesView';
import { AICoachDrawer } from './components/AICoachDrawer';
import { Snackbar } from './components/Snackbar';
import { CodeWaveSplashScreen } from './components/CodeWaveLogo';
import { StatsView } from './components/StatsView';
import { StartLateModal } from './components/StartLateModal';
import { StartLateRebuildResult } from './utils/startLate';
import { CODMTimerModal } from './components/CODMTimer';
import { registerServiceWorker, checkUpcomingBlockReminders } from './utils/reminders';

export default function App() {
  // Splash screen state (shows on initial visit or preview)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !sessionStorage.getItem('codewave_splash_seen');
  });

  const handleDismissSplash = () => {
    sessionStorage.setItem('codewave_splash_seen', 'true');
    setShowSplash(false);
  };

  // Theme state: reads and writes 'codewave_theme', defaults to 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('codewave_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('codewave_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Main Persistent App State
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(() => StorageService.loadBlocks());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.loadCategories());
  const [inbox, setInbox] = useState<InboxTask[]>(() => StorageService.loadInbox());
  const [templates, setTemplates] = useState<DayTemplate[]>(() => StorageService.loadTemplates());
  const [preferences, setPreferences] = useState<Preferences>(() => StorageService.loadPreferences());

  // Navigation State
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'timeline' | 'inbox' | 'templates' | 'stats' | 'preferences'>('timeline');

  // Dismissed overlap warnings per date
  const [dismissedOverlapDates, setDismissedOverlapDates] = useState<string[]>([]);

  // Modals & Drawers
  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [detailBlock, setDetailBlock] = useState<ScheduleBlock | null>(null);
  const [isCarryOverOpen, setIsCarryOverOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isAICoachOpen, setIsAICoachOpen] = useState(false);
  const [isStartLateOpen, setIsStartLateOpen] = useState(false);
  const [codmTimerBlock, setCodmTimerBlock] = useState<ScheduleBlock | null>(null);

  // Undo System
  const [undoRecord, setUndoRecord] = useState<UndoRecord | null>(null);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Periodic reminder checker for upcoming schedule blocks
  useEffect(() => {
    const activeBlocks = blocks.filter((b) => isBlockActiveOnDate(b, currentDate));
    checkUpcomingBlockReminders(activeBlocks, categories, currentDate);
    const interval = setInterval(() => {
      const currentActive = blocks.filter((b) => isBlockActiveOnDate(b, currentDate));
      checkUpcomingBlockReminders(currentActive, categories, currentDate);
    }, 30000);
    return () => clearInterval(interval);
  }, [blocks, categories, currentDate]);

  // Save to localStorage when state changes
  useEffect(() => {
    StorageService.saveBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    StorageService.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    StorageService.saveInbox(inbox);
  }, [inbox]);

  useEffect(() => {
    StorageService.saveTemplates(templates);
  }, [templates]);

  useEffect(() => {
    StorageService.savePreferences(preferences);
  }, [preferences]);

  // Sync detail block if blocks update in place
  useEffect(() => {
    if (detailBlock) {
      const refreshed = blocks.find((b) => b.id === detailBlock.id);
      if (refreshed) {
        setDetailBlock(refreshed);
      }
    }
  }, [blocks]);

  // Active blocks for currentDate
  const activeDateBlocks = useMemo(() => {
    return blocks.filter((b) => isBlockActiveOnDate(b, currentDate));
  }, [blocks, currentDate]);

  // Detect schedule collisions / overlaps
  const overlaps = useMemo(() => {
    if (dismissedOverlapDates.includes(currentDate)) return [];
    return detectOverlaps(activeDateBlocks);
  }, [activeDateBlocks, currentDate, dismissedOverlapDates]);

  // Check for unfinished tasks on current date
  const unfinishedTaskRecords = useMemo(() => {
    const list: Array<{ task: TaskItem; blockId: string; blockTitle: string }> = [];
    activeDateBlocks.forEach((b) => {
      b.tasks.forEach((t) => {
        if (!t.completed) {
          list.push({ task: t, blockId: b.id, blockTitle: b.title });
        }
      });
    });
    return list;
  }, [activeDateBlocks]);

  // CODM Lock active checker
  const isCodmLockActive = useMemo(() => {
    if (!preferences.codmLock) return false;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const startMins = timeToMinutes(preferences.codmLockWindow?.start || '08:30');
    const endMins = timeToMinutes(preferences.codmLockWindow?.end || '18:00');
    return currentMins >= startMins && currentMins <= endMins;
  }, [preferences.codmLock, preferences.codmLockWindow]);

  // ---------------- Handlers for Blocks ---------------- //

  const handleSaveBlock = (
    blockData: Partial<ScheduleBlock>,
    options: {
      pushFollowingBlocks?: boolean;
      recurringScope?: 'just_today' | 'all_future';
    }
  ) => {
    if (blockData.id) {
      // Editing existing block
      const prevBlock = blocks.find((b) => b.id === blockData.id);
      if (!prevBlock) return;

      if (options.recurringScope === 'just_today') {
        // Exclude current date from recurring master
        const updatedMaster: ScheduleBlock = {
          ...prevBlock,
          repeatExceptions: [...(prevBlock.repeatExceptions || []), currentDate],
        };

        // Create detached one-off instance for today
        const singleInstance: ScheduleBlock = {
          ...(blockData as ScheduleBlock),
          id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          date: currentDate,
          repeatRule: 'today',
          recurringParentId: prevBlock.id,
        };

        let newBlockList = blocks.map((b) => (b.id === prevBlock.id ? updatedMaster : b));
        newBlockList.push(singleInstance);

        if (options.pushFollowingBlocks) {
          newBlockList = pushFollowingBlocksLater(
            newBlockList,
            singleInstance.id,
            singleInstance.endTime,
            prevBlock.endTime
          );
        }

        setBlocks(newBlockList);
      } else {
        // Update block across its scope
        let updatedList = blocks.map((b) =>
          b.id === blockData.id ? ({ ...b, ...blockData } as ScheduleBlock) : b
        );

        if (options.pushFollowingBlocks && blockData.endTime && prevBlock.endTime) {
          updatedList = pushFollowingBlocksLater(
            updatedList,
            blockData.id,
            blockData.endTime,
            prevBlock.endTime
          );
        }

        setBlocks(updatedList);
      }
    } else {
      // Create new block
      const newBlock: ScheduleBlock = {
        id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title: blockData.title || 'Focus Block',
        categoryId: blockData.categoryId || categories[0]?.id || 'cat-deepwork',
        date: blockData.date || currentDate,
        startTime: blockData.startTime || '09:00',
        endTime: blockData.endTime || '10:00',
        durationMinutes: blockData.durationMinutes || 60,
        note: blockData.note,
        icon: blockData.icon || '💻',
        priority: blockData.priority || 'medium',
        repeatRule: blockData.repeatRule || 'today',
        customDays: blockData.customDays,
        tasks: blockData.tasks || [],
      };

      setBlocks((prev) => [...prev, newBlock]);
    }

    setEditingBlock(null);
    setIsAddBlockOpen(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    const blockToDelete = blocks.find((b) => b.id === blockId);
    if (!blockToDelete) return;

    const previousBlocks = [...blocks];
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));

    if (detailBlock?.id === blockId) {
      setDetailBlock(null);
    }

    // Set 5-second undo record
    setUndoRecord({
      id: 'undo-' + Date.now(),
      label: `Deleted "${blockToDelete.title}"`,
      timestamp: Date.now(),
      undo: () => {
        setBlocks(previousBlocks);
      },
    });
  };

  const handleUpdateBlockInPlace = (updated: ScheduleBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleToggleManualMission = (missionId: string) => {
    setPreferences((prev) => {
      const updated = prev.dailyMissions.map((m) => {
        if (m.id === missionId) {
          const completedDates = m.manualCompletedDates || [];
          const isCompleted = completedDates.includes(currentDate);
          return {
            ...m,
            manualCompletedDates: isCompleted
              ? completedDates.filter((d) => d !== currentDate)
              : [...completedDates, currentDate],
          };
        }
        return m;
      });
      return {
        ...prev,
        dailyMissions: updated,
      };
    });
  };

  const handleApplyStartLateRebuild = (result: StartLateRebuildResult) => {
    const previousBlocks = [...blocks];
    const newMap = new Map(result.updatedBlocks.map((b) => [b.id, b]));
    const updatedBlocks = blocks.map((b) => (newMap.has(b.id) ? newMap.get(b.id)! : b));
    setBlocks(updatedBlocks);
    setUndoRecord({
      id: 'undo-start-late-' + Date.now(),
      label: `Rebuilt today: ${result.summary}`,
      timestamp: Date.now(),
      undo: () => setBlocks(previousBlocks),
    });
  };

  // Reordering blocks with automatic duration preservation and sequential time recalculation
  const handleReorderBlocks = (fromIndex: number, toIndex: number) => {
    const sorted = [...activeDateBlocks].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) {
      return;
    }

    // Reorder array
    const item = sorted.splice(fromIndex, 1)[0];
    sorted.splice(toIndex, 0, item);

    // Recalculate start and end times sequentially
    let runningMinutes = timeToMinutes(sorted[0].startTime);
    const updatedSorted: ScheduleBlock[] = sorted.map((block, idx) => {
      const dur = block.durationMinutes || calculateDuration(block.startTime, block.endTime);
      const newStart = idx === 0 ? block.startTime : minutesToTime(runningMinutes);
      const newEnd = minutesToTime(timeToMinutes(newStart) + dur);
      runningMinutes = timeToMinutes(newEnd);
      return {
        ...block,
        startTime: newStart,
        endTime: newEnd,
      };
    });

    // Merge into master block collection
    const updatedSortedMap = new Map(updatedSorted.map((b) => [b.id, b]));
    setBlocks((prev) => prev.map((b) => updatedSortedMap.get(b.id) || b));
  };

  // Overlap auto-fix
  const handleAutoFixOverlaps = () => {
    const prevBlocks = [...blocks];
    const fixedActive = autoFixOverlaps(activeDateBlocks);
    const fixedMap = new Map(fixedActive.map((b) => [b.id, b]));

    setBlocks((prev) => prev.map((b) => fixedMap.get(b.id) || b));

    setUndoRecord({
      id: 'undo-fix-' + Date.now(),
      label: 'Auto-fixed schedule overlaps (blocks pushed sequentially)',
      timestamp: Date.now(),
      undo: () => setBlocks(prevBlocks),
    });
  };

  const handleDismissOverlaps = () => {
    setDismissedOverlapDates((prev) => [...prev, currentDate]);
  };

  // ---------------- Carry Over Handlers ---------------- //

  const handleCarryOverToDate = (taskIds: string[], targetDate: string) => {
    const carriedTasks: TaskItem[] = [];

    // Remove tasks from source blocks
    const updatedBlocks = blocks.map((b) => {
      const remainingTasks: TaskItem[] = [];
      b.tasks.forEach((t) => {
        if (taskIds.includes(t.id)) {
          carriedTasks.push({ ...t, completed: false });
        } else {
          remainingTasks.push(t);
        }
      });
      return { ...b, tasks: remainingTasks };
    });

    if (carriedTasks.length === 0) return;

    // Attach to existing block on target date or create a catch-up block
    const targetBlocks = updatedBlocks.filter((b) => isBlockActiveOnDate(b, targetDate));
    if (targetBlocks.length > 0) {
      // Append to the first block of that day
      targetBlocks[0].tasks.push(...carriedTasks);
    } else {
      // Create new "Carried Tasks Focus" block
      const newBlock: ScheduleBlock = {
        id: 'block-' + Date.now(),
        title: 'Carried Tasks & Follow-ups',
        categoryId: categories[0]?.id || 'cat-deepwork',
        date: targetDate,
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        icon: '📋',
        priority: 'high',
        repeatRule: 'today',
        tasks: carriedTasks,
      };
      updatedBlocks.push(newBlock);
    }

    setBlocks(updatedBlocks);
  };

  const handleCarryOverToInbox = (taskIds: string[]) => {
    const newInboxTasks: InboxTask[] = [];

    const updatedBlocks = blocks.map((b) => {
      const remainingTasks: TaskItem[] = [];
      b.tasks.forEach((t) => {
        if (taskIds.includes(t.id)) {
          newInboxTasks.push({
            id: 'inbox-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            title: t.title,
            priority: 'medium',
            estimatedMinutes: 30,
            categoryId: b.categoryId,
            createdAt: new Date().toISOString(),
          });
        } else {
          remainingTasks.push(t);
        }
      });
      return { ...b, tasks: remainingTasks };
    });

    setBlocks(updatedBlocks);
    setInbox((prev) => [...prev, ...newInboxTasks]);
  };

  const handleDiscardTasks = (taskIds: string[]) => {
    const updatedBlocks = blocks.map((b) => ({
      ...b,
      tasks: b.tasks.filter((t) => !taskIds.includes(t.id)),
    }));
    setBlocks(updatedBlocks);
  };

  // ---------------- Inbox Handlers ---------------- //

  const handleAddInboxTask = (taskData: Omit<InboxTask, 'id' | 'createdAt'>) => {
    const newTask: InboxTask = {
      ...taskData,
      id: 'inbox-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setInbox((prev) => [newTask, ...prev]);
  };

  const handleDeleteInboxTask = (taskId: string) => {
    setInbox((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleScheduleInboxTaskAsNewBlock = (
    task: InboxTask,
    targetDate: string,
    startTime: string,
    durationMinutes: number
  ) => {
    const newBlock: ScheduleBlock = {
      id: 'block-' + Date.now(),
      title: task.title,
      categoryId: task.categoryId || categories[0]?.id || 'cat-deepwork',
      date: targetDate,
      startTime,
      endTime: minutesToTime(timeToMinutes(startTime) + durationMinutes),
      durationMinutes,
      note: task.note,
      icon: '🎯',
      priority: task.priority,
      repeatRule: 'today',
      tasks: [{ id: 'task-1', title: task.title, completed: false, createdAt: targetDate, order: 0 }],
    };

    setBlocks((prev) => [...prev, newBlock]);
    setInbox((prev) => prev.filter((t) => t.id !== task.id));
  };

  const handleAttachInboxTaskToBlock = (task: InboxTask, targetBlockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id === targetBlockId) {
          const newTaskItem: TaskItem = {
            id: 'task-' + Date.now(),
            title: task.title,
            completed: false,
            createdAt: new Date().toISOString(),
            order: b.tasks.length,
          };
          return { ...b, tasks: [...b.tasks, newTaskItem] };
        }
        return b;
      })
    );
    setInbox((prev) => prev.filter((t) => t.id !== task.id));
  };

  // ---------------- Templates Handlers ---------------- //

  const handleSaveCurrentDayAsTemplate = (name: string, description?: string) => {
    const templateBlocks = activeDateBlocks.map((b) => ({
      title: b.title,
      categoryId: b.categoryId,
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: b.durationMinutes,
      note: b.note,
      icon: b.icon,
      priority: b.priority,
      repeatRule: b.repeatRule,
      customDays: b.customDays,
      tasks: b.tasks.map((t) => ({ title: t.title, completed: false })),
    }));

    const newTemplate: DayTemplate = {
      id: 'template-' + Date.now(),
      name,
      description,
      blocks: templateBlocks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTemplates((prev) => [newTemplate, ...prev]);
  };

  const handleApplyTemplate = (
    templateId: string,
    targetDate: string,
    mode: 'replace' | 'merge'
  ) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const previousBlocks = [...blocks];

    let baseBlocks = [...blocks];
    if (mode === 'replace') {
      // Remove blocks specific to targetDate and mark recurring ones as exceptions for targetDate
      baseBlocks = baseBlocks
        .filter((b) => !(b.date === targetDate && b.repeatRule === 'today'))
        .map((b) => {
          if (isBlockActiveOnDate(b, targetDate) && b.repeatRule !== 'today') {
            return {
              ...b,
              repeatExceptions: [...(b.repeatExceptions || []), targetDate],
            };
          }
          return b;
        });
    }

    // Instantiate template blocks
    const instantiated: ScheduleBlock[] = tpl.blocks.map((tb, idx) => ({
      id: 'block-' + Date.now() + '-' + idx,
      title: tb.title,
      categoryId: tb.categoryId,
      date: targetDate,
      startTime: tb.startTime,
      endTime: tb.endTime,
      durationMinutes: tb.durationMinutes,
      note: tb.note,
      icon: tb.icon,
      priority: tb.priority,
      repeatRule: 'today',
      tasks: tb.tasks.map((t, tidx) => ({
        id: 'task-' + Date.now() + '-' + idx + '-' + tidx,
        title: t.title,
        completed: false,
        createdAt: targetDate,
        order: tidx,
      })),
    }));

    setBlocks([...baseBlocks, ...instantiated]);

    setUndoRecord({
      id: 'undo-template-' + Date.now(),
      label: `Applied template "${tpl.name}" to ${formatFriendlyDate(targetDate)}`,
      timestamp: Date.now(),
      undo: () => setBlocks(previousBlocks),
    });
  };

  const handleDuplicateTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const copy: DayTemplate = {
      ...tpl,
      id: 'template-' + Date.now(),
      name: `${tpl.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTemplates((prev) => [copy, ...prev]);
  };

  const handleRenameTemplate = (templateId: string, newName: string, newDescription?: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? { ...t, name: newName, description: newDescription, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleUpdateWeekdayDefaults = (weekdayDefaults: Record<number, string>) => {
    setPreferences((prev) => ({
      ...prev,
      weekdayDefaultTemplates: weekdayDefaults,
    }));
  };

  // ---------------- Categories Handlers ---------------- //

  const handleCreateCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const handleUpdateCategory = (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
  };

  const handleDeleteCategory = (categoryId: string, reassignToCategoryId?: string) => {
    if (reassignToCategoryId) {
      setBlocks((prev) =>
        prev.map((b) => (b.categoryId === categoryId ? { ...b, categoryId: reassignToCategoryId } : b))
      );
      setInbox((prev) =>
        prev.map((i) => (i.categoryId === categoryId ? { ...i, categoryId: reassignToCategoryId } : i))
      );
    }
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  // ---------------- AI Coach Proposal Execution & Undo ---------------- //

  const handleApplyAICoachProposal = (proposal: AICoachProposal) => {
    const previousBlocks = [...blocks];
    const previousCategories = [...categories];

    let currentBlocks = [...blocks];
    let currentCategories = [...categories];

    proposal.actions.forEach((act) => {
      if (act.type === 'CREATE_CATEGORY' && act.categoryData) {
        const newCat: Category = {
          id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: act.categoryData.name,
          color: act.categoryData.color || '#6366f1',
          icon: act.categoryData.icon || '🎯',
        };
        currentCategories.push(newCat);
      } else if (act.type === 'ADD_BLOCK' && act.blockData) {
        const matchingCat =
          currentCategories.find(
            (c) =>
              c.id === act.blockData?.categoryId ||
              c.name.toLowerCase() === act.blockData?.categoryId?.toLowerCase()
          ) || currentCategories[0];

        const newBlock: ScheduleBlock = {
          id: 'block-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          title: act.blockData.title || 'New Scheduled Block',
          categoryId: matchingCat?.id || 'cat-deepwork',
          date: currentDate,
          startTime: act.blockData.startTime || '14:00',
          endTime: act.blockData.endTime || '15:00',
          durationMinutes:
            act.blockData.durationMinutes ||
            calculateDuration(act.blockData.startTime || '14:00', act.blockData.endTime || '15:00'),
          note: act.blockData.note,
          icon: act.blockData.icon || matchingCat?.icon || '💡',
          priority: act.blockData.priority || 'medium',
          repeatRule: act.blockData.repeatRule || 'today',
          tasks: (act.blockData.tasks || []).map((t, idx) => ({
            id: 'task-' + Date.now() + '-' + idx,
            title: typeof t === 'string' ? t : (t as any)?.title || 'Task',
            completed: typeof t === 'object' && t ? Boolean((t as any).completed) : false,
            createdAt: currentDate,
            order: idx,
          })),
        };
        currentBlocks.push(newBlock);
      } else if (act.type === 'UPDATE_BLOCK' || act.type === 'MOVE_BLOCK') {
        if (act.targetBlockId) {
          currentBlocks = currentBlocks.map((b) => {
            if (b.id === act.targetBlockId) {
              return {
                ...b,
                ...(act.blockData || {}),
              };
            }
            return b;
          });
        }
      } else if (act.type === 'DELETE_BLOCK' && act.targetBlockId) {
        currentBlocks = currentBlocks.filter((b) => b.id !== act.targetBlockId);
      } else if (act.type === 'ADD_TASK' && act.taskData && act.targetBlockId) {
        currentBlocks = currentBlocks.map((b) => {
          if (b.id === act.targetBlockId) {
            const newTask: TaskItem = {
              id: 'task-' + Date.now(),
              title: act.taskData!.title,
              completed: false,
              createdAt: currentDate,
              order: b.tasks.length,
            };
            return { ...b, tasks: [...b.tasks, newTask] };
          }
          return b;
        });
      } else if (act.type === 'AUTO_FIX_OVERLAPS') {
        const active = currentBlocks.filter((b) => isBlockActiveOnDate(b, currentDate));
        const fixed = autoFixOverlaps(active);
        const fixedMap = new Map(fixed.map((b) => [b.id, b]));
        currentBlocks = currentBlocks.map((b) => fixedMap.get(b.id) || b);
      }
    });

    setBlocks(currentBlocks);
    setCategories(currentCategories);

    // Provide 10-second Undo option
    setUndoRecord({
      id: 'undo-ai-' + Date.now(),
      label: `Applied AI Changes: ${proposal.summary}`,
      timestamp: Date.now(),
      undo: () => {
        setBlocks(previousBlocks);
        setCategories(previousCategories);
      },
    });
  };

  const handleResetDefaults = () => {
    StorageService.resetToDefaults();
    setBlocks(StorageService.loadBlocks());
    setCategories(StorageService.loadCategories());
    setInbox(StorageService.loadInbox());
    setTemplates(StorageService.loadTemplates());
    setPreferences(StorageService.loadPreferences());
  };

  const handleDataImported = () => {
    setBlocks(StorageService.loadBlocks());
    setCategories(StorageService.loadCategories());
    setInbox(StorageService.loadInbox());
    setTemplates(StorageService.loadTemplates());
    setPreferences(StorageService.loadPreferences());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Universal Top Bar */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => {
          setEditingBlock(null);
          setIsAddBlockOpen(true);
        }}
        onOpenAICoach={() => setIsAICoachOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        codmLockActive={isCodmLockActive}
        onOpenSplash={() => setShowSplash(true)}
      />

      {/* CodeWave Splash / Loading Screen (Full Lockup Centered) */}
      {showSplash && (
        <CodeWaveSplashScreen
          onDismiss={handleDismissSplash}
          autoDismissMs={2200}
        />
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'timeline' && (
          <>
            {/* Overlap Collision Alert */}
            <OverlapBanner
              overlaps={overlaps}
              timeFormat={preferences.timeFormat}
              onAutoFix={handleAutoFixOverlaps}
              onDismiss={handleDismissOverlaps}
            />

            {/* Timeline Schedule View */}
            <TimelineView
              currentDate={currentDate}
              blocks={activeDateBlocks}
              categories={categories}
              preferences={preferences}
              timeFormat={preferences.timeFormat}
              overlaps={overlaps}
              onOpenAddModal={() => {
                setEditingBlock(null);
                setIsAddBlockOpen(true);
              }}
              onOpenBlockDetail={(block) => setDetailBlock(block)}
              onQuickEditBlock={(block) => {
                setEditingBlock(block);
                setIsAddBlockOpen(true);
              }}
              onDeleteBlock={handleDeleteBlock}
              onReorderBlocks={handleReorderBlocks}
              onOpenCarryOverModal={() => setIsCarryOverOpen(true)}
              hasUnfinishedTasks={unfinishedTaskRecords.length > 0}
              onOpenTemplates={() => setActiveTab('templates')}
              onStartLate={() => setIsStartLateOpen(true)}
              onStartCODMTimer={(block) => setCodmTimerBlock(block)}
              onToggleManualMission={handleToggleManualMission}
            />
          </>
        )}

        {activeTab === 'inbox' && (
          <InboxView
            inbox={inbox}
            categories={categories}
            blocks={blocks}
            timeFormat={preferences.timeFormat}
            currentDate={currentDate}
            onAddInboxTask={handleAddInboxTask}
            onDeleteInboxTask={handleDeleteInboxTask}
            onScheduleTaskAsNewBlock={handleScheduleInboxTaskAsNewBlock}
            onAttachTaskToBlock={handleAttachInboxTaskToBlock}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView
            templates={templates}
            currentDateBlocks={activeDateBlocks}
            categories={categories}
            preferences={preferences}
            timeFormat={preferences.timeFormat}
            currentDate={currentDate}
            onSaveCurrentDayAsTemplate={handleSaveCurrentDayAsTemplate}
            onApplyTemplate={handleApplyTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onRenameTemplate={handleRenameTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onUpdateWeekdayDefaults={handleUpdateWeekdayDefaults}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView
            blocks={blocks}
            categories={categories}
            preferences={preferences}
            currentDate={currentDate}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesView
            preferences={preferences}
            categories={categories}
            onUpdatePreferences={setPreferences}
            onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
            onDataImported={handleDataImported}
            onResetDefaults={handleResetDefaults}
            onOpenSplash={() => setShowSplash(true)}
          />
        )}
      </main>

      {/* Add / Edit Block Modal */}
      {isAddBlockOpen && (
        <BlockModal
          isOpen={isAddBlockOpen}
          onClose={() => {
            setIsAddBlockOpen(false);
            setEditingBlock(null);
          }}
          block={editingBlock}
          targetDate={currentDate}
          categories={categories}
          timeFormat={preferences.timeFormat}
          defaultDurationMinutes={preferences.defaultBlockLengthMinutes}
          onSaveBlock={handleSaveBlock}
          onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
        />
      )}

      {/* Block Details & Checklist Drawer */}
      {detailBlock && (
        <BlockDetailDrawer
          block={detailBlock}
          isOpen={Boolean(detailBlock)}
          onClose={() => setDetailBlock(null)}
          categories={categories}
          timeFormat={preferences.timeFormat}
          onUpdateBlock={handleUpdateBlockInPlace}
          onEditBlockSettings={(b) => {
            setDetailBlock(null);
            setEditingBlock(b);
            setIsAddBlockOpen(true);
          }}
          onDeleteBlock={handleDeleteBlock}
        />
      )}

      {/* Carry Over Modal */}
      {isCarryOverOpen && (
        <CarryOverModal
          isOpen={isCarryOverOpen}
          onClose={() => setIsCarryOverOpen(false)}
          unfinishedRecords={unfinishedTaskRecords}
          onCarryOverToDate={handleCarryOverToDate}
          onCarryOverToInbox={handleCarryOverToInbox}
          onDiscardTasks={handleDiscardTasks}
        />
      )}

      {/* Custom Categories Manager Modal */}
      {isCategoriesModalOpen && (
        <CategoriesModal
          isOpen={isCategoriesModalOpen}
          onClose={() => setIsCategoriesModalOpen(false)}
          categories={categories}
          blocks={blocks}
          onCreateCategory={handleCreateCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Gemini AI Coach Drawer */}
      {isAICoachOpen && (
        <AICoachDrawer
          isOpen={isAICoachOpen}
          onClose={() => setIsAICoachOpen(false)}
          currentDate={currentDate}
          blocks={activeDateBlocks}
          categories={categories}
          inbox={inbox}
          preferences={preferences}
          timeFormat={preferences.timeFormat}
          onApplyProposal={handleApplyAICoachProposal}
        />
      )}

      {/* Start Late Schedule Rebuilder Modal */}
      {isStartLateOpen && (
        <StartLateModal
          isOpen={isStartLateOpen}
          onClose={() => setIsStartLateOpen(false)}
          blocks={activeDateBlocks}
          currentDate={currentDate}
          preferences={preferences}
          timeFormat={preferences.timeFormat}
          onApplyRebuild={handleApplyStartLateRebuild}
        />
      )}

      {/* CODM Reward Session Timer */}
      {codmTimerBlock && (
        <CODMTimerModal
          isOpen={Boolean(codmTimerBlock)}
          onClose={() => setCodmTimerBlock(null)}
          block={codmTimerBlock}
        />
      )}

      {/* 5-second / 10-second Undo Snackbar */}
      <Snackbar
        undoRecord={undoRecord}
        onClear={() => setUndoRecord(null)}
        durationSeconds={undoRecord?.id.startsWith('undo-ai') || undoRecord?.id.startsWith('undo-start-late') ? 10 : 5}
      />
    </div>
  );
}
