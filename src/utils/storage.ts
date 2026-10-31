import {
  ScheduleBlock,
  Category,
  InboxTask,
  DayTemplate,
  Preferences,
  AppDataExport,
  DailyMission,
} from '../types';
import { getTodayDateString } from './time';

export const STORAGE_KEYS = {
  BLOCKS: 'codewave_blocks_v1',
  CATEGORIES: 'codewave_categories_v1',
  INBOX: 'codewave_inbox_v1',
  TEMPLATES: 'codewave_templates_v1',
  PREFERENCES: 'codewave_preferences_v1',
  THEME: 'codewave_theme',
};

const OLD_STORAGE_KEYS = {
  BLOCKS: 'chronoflow_blocks_v1',
  CATEGORIES: 'chronoflow_categories_v1',
  INBOX: 'chronoflow_inbox_v1',
  TEMPLATES: 'chronoflow_templates_v1',
  PREFERENCES: 'chronoflow_preferences_v1',
  THEME: 'chronoflow_theme',
  THEME_V1: 'chronoflow_theme_v1',
};

/**
 * Migration helper: seamlessly moves any existing chronoflow_* localStorage items to codewave_* keys
 */
export function migrateOldStorageKeys(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    if (localStorage.getItem(OLD_STORAGE_KEYS.BLOCKS) && !localStorage.getItem(STORAGE_KEYS.BLOCKS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, localStorage.getItem(OLD_STORAGE_KEYS.BLOCKS)!);
    }
    if (localStorage.getItem(OLD_STORAGE_KEYS.CATEGORIES) && !localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, localStorage.getItem(OLD_STORAGE_KEYS.CATEGORIES)!);
    }
    if (localStorage.getItem(OLD_STORAGE_KEYS.INBOX) && !localStorage.getItem(STORAGE_KEYS.INBOX)) {
      localStorage.setItem(STORAGE_KEYS.INBOX, localStorage.getItem(OLD_STORAGE_KEYS.INBOX)!);
    }
    if (localStorage.getItem(OLD_STORAGE_KEYS.TEMPLATES) && !localStorage.getItem(STORAGE_KEYS.TEMPLATES)) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, localStorage.getItem(OLD_STORAGE_KEYS.TEMPLATES)!);
    }
    if (localStorage.getItem(OLD_STORAGE_KEYS.PREFERENCES) && !localStorage.getItem(STORAGE_KEYS.PREFERENCES)) {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, localStorage.getItem(OLD_STORAGE_KEYS.PREFERENCES)!);
    }
    const oldTheme = localStorage.getItem(OLD_STORAGE_KEYS.THEME) || localStorage.getItem(OLD_STORAGE_KEYS.THEME_V1);
    if (oldTheme && !localStorage.getItem(STORAGE_KEYS.THEME)) {
      localStorage.setItem(STORAGE_KEYS.THEME, oldTheme);
    }
  } catch (err) {
    console.warn('Storage key migration note:', err);
  }
}

// Run migration immediately
migrateOldStorageKeys();

// 3. Student Routine Categories: Study, Coding, Basketball, CODM, Meals, Rest, Lectures
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-study', name: 'Study', color: '#6366f1', icon: '📚', reminderMinutes: 10 },
  { id: 'cat-coding', name: 'Coding', color: '#38bdf8', icon: '💻', reminderMinutes: 10 },
  { id: 'cat-basketball', name: 'Basketball', color: '#f97316', icon: '🏀', reminderMinutes: 15 },
  { id: 'cat-codm', name: 'CODM', color: '#ef4444', icon: '🎮', reminderMinutes: 5 },
  { id: 'cat-meals', name: 'Meals', color: '#10b981', icon: '🥪', reminderMinutes: 10 },
  { id: 'cat-rest', name: 'Rest', color: '#a855f7', icon: '🛌', reminderMinutes: 15 },
  { id: 'cat-lectures', name: 'Lectures', color: '#eab308', icon: '🏛️', reminderMinutes: 15 },
];

// 3. Student Daily Missions: "Study one topic", "Make progress on one coding task", "Move / train"
export const INITIAL_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'm-1',
    title: 'Study one topic',
    targetCount: 1,
    categoryId: 'cat-study',
    icon: '📚',
    manualCompletedDates: [],
  },
  {
    id: 'm-2',
    title: 'Make progress on one coding task',
    targetCount: 1,
    categoryId: 'cat-coding',
    icon: '💻',
    manualCompletedDates: [],
  },
  {
    id: 'm-3',
    title: 'Move / train',
    targetCount: 1,
    categoryId: 'cat-basketball',
    icon: '🏀',
    manualCompletedDates: [],
  },
];

export const INITIAL_PREFERENCES: Preferences = {
  wakeUpTime: '07:00',
  targetBedtime: '23:00',
  minSleepHours: 7.5,
  defaultBlockLengthMinutes: 45,
  codmLock: true,
  codmLockWindow: {
    start: '08:00',
    end: '20:30',
  },
  dailyMissions: INITIAL_DAILY_MISSIONS,
  timeFormat: '12h',
  weekdayDefaultTemplates: {
    1: 'template-lecture',
    2: 'template-home',
    3: 'template-lecture',
    4: 'template-home',
    5: 'template-lecture',
    6: 'template-home',
    0: 'template-home',
  },
  enableNotifications: true,
};

// 3. Empty Inbox by default
export const INITIAL_INBOX: InboxTask[] = [];

// 3. Student Templates: "Lecture day" and "Home day"
export function getInitialTemplates(): DayTemplate[] {
  return [
    {
      id: 'template-lecture',
      name: 'Lecture day',
      description: 'Campus lecture schedule, library study session, basketball, and evening coding',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        {
          title: 'Breakfast & Morning Routine',
          categoryId: 'cat-meals',
          startTime: '07:00',
          endTime: '08:00',
          durationMinutes: 60,
          icon: '🥪',
          priority: 'medium',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Nutritious breakfast' }, { title: 'Pack campus bag & laptop' }],
        },
        {
          title: 'University Lectures',
          categoryId: 'cat-lectures',
          startTime: '08:30',
          endTime: '11:30',
          durationMinutes: 180,
          icon: '🏛️',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Operating Systems Lecture' }, { title: 'Algorithm Analysis' }],
        },
        {
          title: 'Campus Lunch & Walk',
          categoryId: 'cat-meals',
          startTime: '12:00',
          endTime: '13:00',
          durationMinutes: 60,
          icon: '🥪',
          priority: 'medium',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Eat lunch' }, { title: 'Screen-free outdoor reset' }],
        },
        {
          title: 'Library Focused Study',
          categoryId: 'cat-study',
          startTime: '13:30',
          endTime: '15:30',
          durationMinutes: 120,
          icon: '📚',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Read Chapter 4 slides' }, { title: 'Summarize core formulas' }],
        },
        {
          title: 'Basketball / Court Training',
          categoryId: 'cat-basketball',
          startTime: '16:00',
          endTime: '17:30',
          durationMinutes: 90,
          icon: '🏀',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Warmup & shooting drills' }, { title: 'Full court pickup session' }],
        },
        {
          title: 'Dinner & Shower',
          categoryId: 'cat-meals',
          startTime: '17:45',
          endTime: '18:45',
          durationMinutes: 60,
          icon: '🥪',
          priority: 'medium',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Protein dinner' }, { title: 'Stretch' }],
        },
        {
          title: 'Project Coding Sprint',
          categoryId: 'cat-coding',
          startTime: '19:00',
          endTime: '20:30',
          durationMinutes: 90,
          icon: '💻',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Implement API endpoints' }, { title: 'Write unit tests' }],
        },
        {
          title: 'CODM Gaming Session (Post-Mission Reward)',
          categoryId: 'cat-codm',
          startTime: '20:45',
          endTime: '21:45',
          durationMinutes: 60,
          icon: '🎮',
          priority: 'low',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Ranked multiplayer matches' }],
        },
        {
          title: 'Night Rest & Sleep Winddown',
          categoryId: 'cat-rest',
          startTime: '22:00',
          endTime: '23:00',
          durationMinutes: 60,
          icon: '🛌',
          priority: 'high',
          repeatRule: 'daily',
          tasks: [{ title: 'Review tomorrow plan' }, { title: 'Lights out by 23:00' }],
        },
      ],
    },
    {
      id: 'template-home',
      name: 'Home day',
      description: 'High-focus self-study, deep coding build, basketball, and evening gaming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: [
        {
          title: 'Breakfast & Hydration',
          categoryId: 'cat-meals',
          startTime: '07:30',
          endTime: '08:30',
          durationMinutes: 60,
          icon: '🥪',
          priority: 'medium',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Healthy meal' }, { title: 'Daily hydration goal' }],
        },
        {
          title: 'Deep Coding Sprint',
          categoryId: 'cat-coding',
          startTime: '09:00',
          endTime: '11:30',
          durationMinutes: 150,
          icon: '💻',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Build new core feature' }, { title: 'Push commit to Git repo' }],
        },
        {
          title: 'Lunch & Fresh Air',
          categoryId: 'cat-meals',
          startTime: '12:00',
          endTime: '13:00',
          durationMinutes: 60,
          icon: '🥪',
          priority: 'medium',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Wholesome lunch' }, { title: '20m walk' }],
        },
        {
          title: 'Focused Self-Study',
          categoryId: 'cat-study',
          startTime: '13:30',
          endTime: '15:30',
          durationMinutes: 120,
          icon: '📚',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Practice algorithms problem sets' }, { title: 'Take notes on data structures' }],
        },
        {
          title: 'Basketball / Physical Training',
          categoryId: 'cat-basketball',
          startTime: '16:00',
          endTime: '17:30',
          durationMinutes: 90,
          icon: '🏀',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Interval drills' }, { title: 'Free throw practice' }],
        },
        {
          title: 'Evening Coding & Code Review',
          categoryId: 'cat-coding',
          startTime: '18:45',
          endTime: '20:15',
          durationMinutes: 90,
          icon: '💻',
          priority: 'high',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Refactor component code' }, { title: 'Review open pull requests' }],
        },
        {
          title: 'CODM Gaming Session',
          categoryId: 'cat-codm',
          startTime: '20:30',
          endTime: '21:30',
          durationMinutes: 60,
          icon: '🎮',
          priority: 'low',
          repeatRule: 'weekdays',
          tasks: [{ title: 'Play with squad' }],
        },
        {
          title: 'Night Winddown & Rest',
          categoryId: 'cat-rest',
          startTime: '21:45',
          endTime: '23:00',
          durationMinutes: 75,
          icon: '🛌',
          priority: 'high',
          repeatRule: 'daily',
          tasks: [{ title: 'Turn off screens' }, { title: 'Deep sleep prep' }],
        },
      ],
    },
  ];
}

// Default initial blocks for today
export function getInitialBlocks(): ScheduleBlock[] {
  const today = getTodayDateString();
  return [
    {
      id: 'b-meals-morning',
      title: 'Breakfast & Morning Prep',
      categoryId: 'cat-meals',
      date: today,
      startTime: '07:15',
      endTime: '08:15',
      durationMinutes: 60,
      note: 'Fuel up and get ready for lectures and study',
      icon: '🥪',
      priority: 'medium',
      repeatRule: 'daily',
      tasks: [
        { id: 't-m1', title: 'Healthy breakfast', completed: true, createdAt: today, order: 0 },
        { id: 't-m2', title: 'Review today goals', completed: true, createdAt: today, order: 1 },
      ],
    },
    {
      id: 'b-lectures',
      title: 'Morning Lectures',
      categoryId: 'cat-lectures',
      date: today,
      startTime: '08:30',
      endTime: '11:30',
      durationMinutes: 180,
      note: 'Systems Architecture & Algorithms',
      icon: '🏛️',
      priority: 'high',
      repeatRule: 'weekdays',
      tasks: [
        { id: 't-l1', title: 'Take active lecture notes', completed: false, createdAt: today, order: 0 },
        { id: 't-l2', title: 'Download lecture slides', completed: false, createdAt: today, order: 1 },
      ],
    },
    {
      id: 'b-lunch',
      title: 'Lunch Break & Reset',
      categoryId: 'cat-meals',
      date: today,
      startTime: '11:45',
      endTime: '12:45',
      durationMinutes: 60,
      note: 'Sunlight and screen break',
      icon: '🥪',
      priority: 'medium',
      repeatRule: 'daily',
      tasks: [
        { id: 't-l3', title: 'Eat wholesome lunch', completed: false, createdAt: today, order: 0 },
      ],
    },
    {
      id: 'b-study',
      title: 'Library Focused Study',
      categoryId: 'cat-study',
      date: today,
      startTime: '13:00',
      endTime: '15:00',
      durationMinutes: 120,
      note: 'Core mission: Study one topic thoroughly',
      icon: '📚',
      priority: 'high',
      repeatRule: 'weekdays',
      tasks: [
        { id: 't-s1', title: 'Study topic: Distributed Systems basics', completed: false, createdAt: today, order: 0 },
        { id: 't-s2', title: 'Solve 2 practice questions', completed: false, createdAt: today, order: 1 },
      ],
    },
    {
      id: 'b-basketball',
      title: 'Basketball Training & Workout',
      categoryId: 'cat-basketball',
      date: today,
      startTime: '15:30',
      endTime: '17:00',
      durationMinutes: 90,
      note: 'Core mission: Move / train',
      icon: '🏀',
      priority: 'high',
      repeatRule: 'custom',
      customDays: [1, 2, 3, 4, 5],
      tasks: [
        { id: 't-b1', title: 'Warmup & dynamic stretches', completed: false, createdAt: today, order: 0 },
        { id: 't-b2', title: 'Shooting drills & scrimmage', completed: false, createdAt: today, order: 1 },
      ],
    },
    {
      id: 'b-coding',
      title: 'Project Coding Block',
      categoryId: 'cat-coding',
      date: today,
      startTime: '18:00',
      endTime: '20:00',
      durationMinutes: 120,
      note: 'Core mission: Make progress on one coding task',
      icon: '💻',
      priority: 'high',
      repeatRule: 'weekdays',
      tasks: [
        { id: 't-c1', title: 'Fix API authentication route bug', completed: false, createdAt: today, order: 0 },
        { id: 't-c2', title: 'Push commit to GitHub', completed: false, createdAt: today, order: 1 },
      ],
    },
    {
      id: 'b-codm',
      title: 'CODM Gaming Session',
      categoryId: 'cat-codm',
      date: today,
      startTime: '20:15',
      endTime: '21:15',
      durationMinutes: 60,
      note: 'Reward gaming window (locked until Study and Coding missions are done)',
      icon: '🎮',
      priority: 'low',
      repeatRule: 'daily',
      tasks: [
        { id: 't-g1', title: 'Play squad ranked match', completed: false, createdAt: today, order: 0 },
      ],
    },
    {
      id: 'b-rest',
      title: 'Evening Rest & Sleep Prep',
      categoryId: 'cat-rest',
      date: today,
      startTime: '21:30',
      endTime: '23:00',
      durationMinutes: 90,
      note: 'Wind down, read, sleep at 23:00',
      icon: '🛌',
      priority: 'high',
      repeatRule: 'daily',
      tasks: [
        { id: 't-r1', title: 'Set alarms and plan tomorrow', completed: false, createdAt: today, order: 0 },
        { id: 't-r2', title: 'Lights out by 23:00', completed: false, createdAt: today, order: 1 },
      ],
    },
  ];
}

// LocalStorage helpers with fallback
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to read ${key} from localStorage, using fallback:`, e);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export const StorageService = {
  loadBlocks(): ScheduleBlock[] {
    return loadFromStorage(STORAGE_KEYS.BLOCKS, getInitialBlocks());
  },
  saveBlocks(blocks: ScheduleBlock[]) {
    saveToStorage(STORAGE_KEYS.BLOCKS, blocks);
  },

  loadCategories(): Category[] {
    return loadFromStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },
  saveCategories(categories: Category[]) {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  },

  loadInbox(): InboxTask[] {
    return loadFromStorage(STORAGE_KEYS.INBOX, INITIAL_INBOX);
  },
  saveInbox(inbox: InboxTask[]) {
    saveToStorage(STORAGE_KEYS.INBOX, inbox);
  },

  loadTemplates(): DayTemplate[] {
    return loadFromStorage(STORAGE_KEYS.TEMPLATES, getInitialTemplates());
  },
  saveTemplates(templates: DayTemplate[]) {
    saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
  },

  loadPreferences(): Preferences {
    return loadFromStorage(STORAGE_KEYS.PREFERENCES, INITIAL_PREFERENCES);
  },
  savePreferences(prefs: Preferences) {
    saveToStorage(STORAGE_KEYS.PREFERENCES, prefs);
  },

  exportAllData(): AppDataExport {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      blocks: this.loadBlocks(),
      categories: this.loadCategories(),
      inbox: this.loadInbox(),
      templates: this.loadTemplates(),
      preferences: this.loadPreferences(),
    };
  },

  importAllData(data: Partial<AppDataExport>): { success: boolean; message: string } {
    try {
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON structure.');
      }
      if (Array.isArray(data.blocks)) {
        this.saveBlocks(data.blocks);
      }
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (Array.isArray(data.inbox)) {
        this.saveInbox(data.inbox);
      }
      if (Array.isArray(data.templates)) {
        this.saveTemplates(data.templates);
      }
      if (data.preferences && typeof data.preferences === 'object') {
        this.savePreferences(data.preferences as Preferences);
      }
      return { success: true, message: 'CodeWave Daily data imported successfully!' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Failed to import JSON data.' };
    }
  },

  resetToDefaults() {
    this.saveBlocks(getInitialBlocks());
    this.saveCategories(INITIAL_CATEGORIES);
    this.saveInbox(INITIAL_INBOX);
    this.saveTemplates(getInitialTemplates());
    this.savePreferences(INITIAL_PREFERENCES);
  },
};
