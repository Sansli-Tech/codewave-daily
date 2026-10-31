export type Priority = 'high' | 'medium' | 'low';

export type RepeatRule = 'today' | 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;
}

export interface ScheduleBlock {
  id: string;
  title: string;
  categoryId: string;
  date: string; // ISO date format YYYY-MM-DD
  startTime: string; // "HH:mm" in 24h
  endTime: string; // "HH:mm" in 24h
  durationMinutes: number;
  note?: string;
  icon: string; // Emoji
  priority: Priority;
  repeatRule: RepeatRule;
  customDays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  repeatExceptions?: string[]; // YYYY-MM-DD where block shouldn't appear
  recurringParentId?: string; // If this is an overridden single instance
  tasks: TaskItem[];
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Hex color code or css class
  textColor?: string;
  icon: string;
  reminderMinutes?: number; // Configurable reminder N minutes before block starts (0 = disabled)
}

export interface InboxTask {
  id: string;
  title: string;
  note?: string;
  priority: Priority;
  estimatedMinutes: number;
  categoryId?: string;
  createdAt: string;
}

export interface TemplateBlock {
  title: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note?: string;
  icon: string;
  priority: Priority;
  repeatRule: RepeatRule;
  customDays?: number[];
  tasks: Array<{ title: string; completed?: boolean }>;
}

export interface DayTemplate {
  id: string;
  name: string;
  description?: string;
  blocks: TemplateBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyMission {
  id: string;
  title: string;
  targetCount: number;
  categoryId?: string;
  icon?: string;
  manualCompletedDates?: string[]; // Dates (YYYY-MM-DD) where user manually ticked this mission
}

export interface Preferences {
  wakeUpTime: string; // "07:00"
  targetBedtime: string; // "23:00"
  minSleepHours: number; // e.g. 7.5
  defaultBlockLengthMinutes: number; // e.g. 45
  codmLock: boolean; // Call of Duty / Distraction Lock toggle
  codmLockWindow: {
    start: string; // e.g. "08:00"
    end: string; // e.g. "20:30"
  };
  dailyMissions: DailyMission[];
  timeFormat: '12h' | '24h';
  weekdayDefaultTemplates: Record<number, string>; // 0 (Sun) - 6 (Sat) -> templateId
  enableNotifications?: boolean;
}

export interface AICoachAction {
  type: 'ADD_BLOCK' | 'UPDATE_BLOCK' | 'DELETE_BLOCK' | 'MOVE_BLOCK' | 'ADD_TASK' | 'CREATE_CATEGORY' | 'AUTO_FIX_OVERLAPS';
  targetBlockId?: string;
  blockData?: Partial<ScheduleBlock>;
  categoryData?: {
    name: string;
    color: string;
    icon: string;
  };
  taskData?: {
    title: string;
    blockId?: string;
  };
  explanation: string;
}

export interface AICoachProposal {
  thought: string;
  summary: string;
  actions: AICoachAction[];
}

export interface UndoRecord {
  id: string;
  label: string;
  timestamp: number;
  undo: () => void;
}

export interface AppDataExport {
  version: number;
  exportedAt: string;
  blocks: ScheduleBlock[];
  categories: Category[];
  inbox: InboxTask[];
  templates: DayTemplate[];
  preferences: Preferences;
}
