import React from 'react';
import {
  Calendar,
  Sparkles,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { formatFriendlyDate, getTodayDateString, addMinutesToTime, formatDateString, parseDateString } from '../utils/time';
import { CodeWaveLockup } from './CodeWaveLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentDate: string;
  onDateChange: (newDate: string) => void;
  activeTab: 'timeline' | 'inbox' | 'templates' | 'stats' | 'preferences';
  onTabChange: (tab: 'timeline' | 'inbox' | 'templates' | 'stats' | 'preferences') => void;
  onOpenAddModal: () => void;
  onOpenAICoach: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  codmLockActive?: boolean;
  onOpenSplash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenAICoach,
  theme,
  onToggleTheme,
  codmLockActive,
  onOpenSplash,
}) => {
  const isToday = currentDate === getTodayDateString();

  const handlePrevDay = () => {
    const d = parseDateString(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(formatDateString(d));
  };

  const handleNextDay = () => {
    const d = parseDateString(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(formatDateString(d));
  };

  const handleToday = () => {
    onDateChange(getTodayDateString());
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: CodeWave Daily Brand Lockup (icon + name only) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('timeline')}
              className="flex items-center text-left focus:outline-none group transition-opacity hover:opacity-90"
              title="CodeWave Daily — Ride the wave. Win the day."
            >
              <CodeWaveLockup
                layout="horizontal"
                iconSize={32}
                showTagline={false}
                wordmarkSize="md"
              />
            </button>
            {codmLockActive && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 rounded border border-amber-200 dark:border-amber-900">
                CODM Lock Active
              </span>
            )}
          </div>

          {/* Zone 2: Clean single-line navigation tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('timeline')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => onTabChange('inbox')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'inbox'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => onTabChange('templates')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'templates'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => onTabChange('stats')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => onTabChange('preferences')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'preferences'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              Preferences
            </button>
          </nav>

          {/* Zone 3: Actions - Date navigators & AI Coach & Theme */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'timeline' && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
                <button
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleToday}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    isToday
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {formatFriendlyDate(currentDate)}
                </button>
                <button
                  onClick={handleNextDay}
                  title="Next Day"
                  className="p-1 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <PWAInstallButton />

            <button
              onClick={onOpenAICoach}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors whitespace-nowrap shrink-0"
              title="Open Gemini Schedule Coach"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>AI Coach</span>
            </button>

            {activeTab === 'timeline' && (
              <button
                onClick={onOpenAddModal}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Block</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
