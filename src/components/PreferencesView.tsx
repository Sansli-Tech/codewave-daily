import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Shield,
  ShieldAlert,
  Target,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Tag,
  CheckCircle,
  AlertCircle,
  Lock,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { AboutCard } from './AppFooter';
import { Preferences, Category, DailyMission, AppDataExport } from '../types';
import { calculateSleepStats, formatDisplayTime } from '../utils/time';
import { StorageService } from '../utils/storage';
import { CodeWaveIcon, CodeWaveWordmark, CodeWaveLockup } from './CodeWaveLogo';
import { requestNotificationPermission, triggerTestNotification } from '../utils/reminders';

interface PreferencesViewProps {
  preferences: Preferences;
  categories: Category[];
  onUpdatePreferences: (prefs: Preferences) => void;
  onOpenCategoriesManager: () => void;
  onDataImported: () => void;
  onResetDefaults: () => void;
  onOpenSplash?: () => void;
}

export const PreferencesView: React.FC<PreferencesViewProps> = ({
  preferences,
  categories,
  onUpdatePreferences,
  onOpenCategoriesManager,
  onDataImported,
  onResetDefaults,
  onOpenSplash,
}) => {
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonPasteContent, setJsonPasteContent] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [testNotifMessage, setTestNotifMessage] = useState<string | null>(null);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      setTestNotifMessage('Notifications enabled successfully!');
      setTimeout(() => setTestNotifMessage(null), 4000);
    } else if (perm === 'denied') {
      setTestNotifMessage('Notifications are blocked by your browser settings.');
    }
  };

  const handleTestNotification = async () => {
    if (notifPermission !== 'granted') {
      const perm = await requestNotificationPermission();
      setNotifPermission(perm);
      if (perm !== 'granted') {
        setTestNotifMessage('Notification permission is required to send alerts.');
        return;
      }
    }
    const sent = await triggerTestNotification();
    if (sent) {
      setTestNotifMessage('Test notification sent! Check your system banner.');
    } else {
      setTestNotifMessage('Could not trigger notification. Ensure browser permission is allowed.');
    }
    setTimeout(() => setTestNotifMessage(null), 4500);
  };

  // Local state for smooth edits
  const sleepStats = calculateSleepStats(
    preferences.targetBedtime,
    preferences.wakeUpTime,
    preferences.minSleepHours
  );

  const handleTimeChange = (field: 'wakeUpTime' | 'targetBedtime', value: string) => {
    onUpdatePreferences({
      ...preferences,
      [field]: value,
    });
  };

  const handleToggleCODM = () => {
    onUpdatePreferences({
      ...preferences,
      codmLock: !preferences.codmLock,
    });
  };

  const handleTimeFormatChange = (format: '12h' | '24h') => {
    onUpdatePreferences({
      ...preferences,
      timeFormat: format,
    });
  };

  // Daily missions updates
  const handleUpdateMissionTitle = (id: string, newTitle: string) => {
    const updated = preferences.dailyMissions.map((m) =>
      m.id === id ? { ...m, title: newTitle } : m
    );
    onUpdatePreferences({
      ...preferences,
      dailyMissions: updated,
    });
  };

  const handleUpdateMissionCategory = (id: string, catId: string) => {
    const updated = preferences.dailyMissions.map((m) =>
      m.id === id ? { ...m, categoryId: catId || undefined } : m
    );
    onUpdatePreferences({
      ...preferences,
      dailyMissions: updated,
    });
  };

  const handleAddMission = () => {
    const newMission: DailyMission = {
      id: 'mission-' + Date.now(),
      title: 'New Daily Mission',
      targetCount: 1,
      icon: '🎯',
    };
    onUpdatePreferences({
      ...preferences,
      dailyMissions: [...preferences.dailyMissions, newMission],
    });
  };

  const handleDeleteMission = (id: string) => {
    if (preferences.dailyMissions.length <= 1) return;
    const updated = preferences.dailyMissions.filter((m) => m.id !== id);
    onUpdatePreferences({
      ...preferences,
      dailyMissions: updated,
    });
  };

  // Export JSON
  const handleExportJSON = () => {
    const exportData = StorageService.exportAllData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `codewave-daily-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON via file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const result = StorageService.importAllData(parsed);
          setImportFeedback(result);
          if (result.success) {
            onDataImported();
          }
        } catch (err: any) {
          setImportFeedback({ success: false, message: 'Invalid JSON file format: ' + err.message });
        }
      };
    }
  };

  // Import JSON via paste
  const handlePasteImport = () => {
    try {
      const parsed = JSON.parse(jsonPasteContent);
      const result = StorageService.importAllData(parsed);
      setImportFeedback(result);
      if (result.success) {
        onDataImported();
        setIsImportModalOpen(false);
        setJsonPasteContent('');
      }
    } catch (err: any) {
      setImportFeedback({ success: false, message: 'Invalid JSON string: ' + err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Preferences & Guardrails
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure sleep windows, CODM locks, daily 3 missions, time formats, and backup data.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCategoriesManager}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition-colors shadow-xs self-start sm:self-center"
        >
          <Tag className="w-4 h-4" />
          <span>Manage Custom Categories</span>
        </button>
      </div>

      {/* CodeWave Daily Brand & Logo Asset Showcase */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-slate-800 text-white shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                Brand & Logo Kit
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                SVG & PWA
              </span>
            </div>
            <CodeWaveWordmark size="lg" showTagline={true} lightText={true} />
          </div>

          {onOpenSplash && (
            <button
              onClick={onOpenSplash}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-[#38BDF8]/20 to-[#A855F7]/20 border border-[#38BDF8]/30 text-[#38BDF8] hover:text-white hover:border-[#38BDF8] transition-all self-start sm:self-center"
            >
              <span>Preview Splash Screen</span>
            </button>
          )}
        </div>

        {/* Small Size Readability & Adaptive Curve Demonstration */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Adaptive Icon Scalability</span>
              <span className="text-[11px] text-[#94A3B8] font-normal">
                (Thickened strokes & simplified 1-curve wave at ≤ 32px)
              </span>
            </h4>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Tested across standard viewports and micro-affordances:
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {/* 64px Standard */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
              <CodeWaveIcon size={64} />
              <div className="text-center">
                <span className="font-mono text-xs text-white font-bold block">64px</span>
                <span className="text-[10px] text-slate-400">Standard dual wave</span>
              </div>
            </div>

            {/* 40px App Header */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
              <CodeWaveIcon size={40} />
              <div className="text-center">
                <span className="font-mono text-xs text-white font-bold block">40px</span>
                <span className="text-[10px] text-slate-400">Header lockup</span>
              </div>
            </div>

            {/* 32px Micro (Adaptive boundary) */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
              <div className="h-10 flex items-center justify-center">
                <CodeWaveIcon size={32} />
              </div>
              <div className="text-center">
                <span className="font-mono text-xs text-[#38BDF8] font-bold block">32px</span>
                <span className="text-[10px] text-slate-400">Single curve</span>
              </div>
            </div>

            {/* 24px Toolbar */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
              <div className="h-10 flex items-center justify-center">
                <CodeWaveIcon size={24} />
              </div>
              <div className="text-center">
                <span className="font-mono text-xs text-[#38BDF8] font-bold block">24px</span>
                <span className="text-[10px] text-slate-400">Thick stroke</span>
              </div>
            </div>

            {/* 16px Favicon */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center gap-2">
              <div className="h-10 flex items-center justify-center">
                <CodeWaveIcon size={16} />
              </div>
              <div className="text-center">
                <span className="font-mono text-xs text-[#38BDF8] font-bold block">16px</span>
                <span className="text-[10px] text-slate-400">High contrast</span>
              </div>
            </div>
          </div>
        </div>

        {/* PWA & Favicon Manifest Verification Strip */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">192px PNG</span>
              <span className="text-[10px] text-slate-400 font-mono">pwa-192x192.png</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">512px PNG</span>
              <span className="text-[10px] text-slate-400 font-mono">pwa-512x512.png</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Maskable 512px</span>
              <span className="text-[10px] text-slate-400 font-mono">+15% Safe-zone</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <div>
              <span className="font-semibold text-slate-200 block text-[11px]">Apple Touch</span>
              <span className="text-[10px] text-slate-400 font-mono">apple-touch-icon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sleep & Routine Rhythm Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>Circadian Rhythm & Sleep Boundary</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protects recovery hours and informs Gemini coach when scheduling focus blocks.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {sleepStats.totalSleepHours} hrs planned
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Wake-Up Time
            </label>
            <input
              type="time"
              value={preferences.wakeUpTime}
              onChange={(e) => handleTimeChange('wakeUpTime', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Bedtime
            </label>
            <input
              type="time"
              value={preferences.targetBedtime}
              onChange={(e) => handleTimeChange('targetBedtime', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Minimum Sleep Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="5"
              max="11"
              value={preferences.minSleepHours}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  minSleepHours: parseFloat(e.target.value) || 7,
                })
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Sleep feedback visual badge */}
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            sleepStats.isSufficient
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {sleepStats.isSufficient ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>
              {sleepStats.isSufficient
                ? `Optimal sleep window: ${sleepStats.totalSleepHours} hrs available (${sleepStats.diffHours >= 0 ? `+${sleepStats.diffHours}h` : ''} above minimum)`
                : `Warning: Sleep window of ${sleepStats.totalSleepHours} hrs falls short of your ${preferences.minSleepHours} hrs minimum!`}
            </span>
          </div>
        </div>

        {/* Time Format & Default Block Length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Default Block Length
            </label>
            <div className="flex items-center gap-2">
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    onUpdatePreferences({ ...preferences, defaultBlockLengthMinutes: mins })
                  }
                  className={`flex-1 py-1.5 text-xs font-mono rounded-lg border transition-all ${
                    preferences.defaultBlockLengthMinutes === mins
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Time Display Format
            </label>
            <div className="flex items-center gap-2">
              {(['12h', '24h'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleTimeFormatChange(fmt)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    preferences.timeFormat === fmt
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {fmt === '12h' ? '12-Hour (AM/PM)' : '24-Hour (13:00)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CODM Distraction Lock Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                preferences.codmLock
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                CODM & Gaming Distraction Lock
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When enabled, CODM gaming blocks remain <span className="font-semibold text-amber-600 dark:text-amber-400">locked</span> until today's <strong>Study</strong> and <strong>Coding</strong> missions are marked complete. Once unlocked, you can launch a focused session countdown timer with an audio completion chime.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleCODM}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              preferences.codmLock ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                preferences.codmLock ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {preferences.codmLock && (
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-amber-900 dark:text-amber-300 block mb-1">
                Active Lock Window Start
              </label>
              <input
                type="time"
                value={preferences.codmLockWindow?.start || '08:30'}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    codmLockWindow: {
                      ...(preferences.codmLockWindow || { end: '18:00' }),
                      start: e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-amber-900 dark:text-amber-300 block mb-1">
                Active Lock Window End
              </label>
              <input
                type="time"
                value={preferences.codmLockWindow?.end || '18:00'}
                onChange={(e) =>
                  onUpdatePreferences({
                    ...preferences,
                    codmLockWindow: {
                      ...(preferences.codmLockWindow || { start: '08:30' }),
                      end: e.target.value,
                    },
                  })
                }
                className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Block Reminders & Service Worker Notifications Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Block Reminders & Notifications</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                  notifPermission === 'granted'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : notifPermission === 'denied'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {notifPermission}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dispatches system notifications <span className="font-semibold text-slate-700 dark:text-slate-300">N minutes before</span> each scheduled block (customizable per category in Categories manager).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {notifPermission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
              >
                Enable Notifications
              </button>
            )}
            <button
              type="button"
              onClick={handleTestNotification}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Test Notification
            </button>
          </div>
        </div>

        {testNotifMessage && (
          <div className="p-3 rounded-xl text-xs bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
            {testNotifMessage}
          </div>
        )}

        {/* PWA Reliability Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
          <span className="text-indigo-500 text-base">💡</span>
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">
              Service Worker Reliability
            </span>
            <span>
              Reminders are most reliable when CodeWave Daily is installed to your home screen or desktop (PWA mode). Service workers continue checking scheduled blocks while the window is in the background.
            </span>
          </div>
        </div>

        {/* Per-category summary */}
        <div className="pt-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">
            Configured Category Reminder Offsets:
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] bg-white dark:bg-slate-900"
              >
                <span>{c.icon}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {c.reminderMinutes !== undefined
                    ? c.reminderMinutes === 0
                      ? 'at start'
                      : `${c.reminderMinutes}m before`
                    : '10m before'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily 3 Missions Customization */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              <span>Daily 3 Core Missions (User-Configurable)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize which daily accomplishments count toward your core day score.
            </p>
          </div>   
                <AboutCard onBackup={handleExportJSON} />

      /* Paste JSON Modal */
             {/* Paste JSON Modal */}
          <button
            onClick={handleAddMission}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Mission</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {preferences.dailyMissions.map((mission, index) => (
            <div
              key={mission.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
            >
              <span className="font-mono text-xs font-bold text-slate-400 w-5">
                0{index + 1}.
              </span>
              <input
                type="text"
                value={mission.title}
                onChange={(e) => handleUpdateMissionTitle(mission.id, e.target.value)}
                placeholder="Mission title (e.g. Deep Work Sprint 2h+)"
                className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <select
                value={mission.categoryId || ''}
                onChange={(e) => handleUpdateMissionCategory(mission.id, e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">Any Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              <button
                disabled={preferences.dailyMissions.length <= 1}
                onClick={() => handleDeleteMission(mission.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                title="Remove mission"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Persistence, Backup & JSON Import / Export */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Data Storage & JSON Backup
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All routines, blocks, custom categories, and inbox tasks persist locally in your browser.
          </p>
        </div>

        {importFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              importFeedback.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>{importFeedback.message}</span>
            <button
              onClick={() => setImportFeedback(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Export Schedule (JSON)</span>
          </button>

          <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Upload JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <span>Paste JSON Backup</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Need to reset sample data or clear corrupted records?
          </span>
          <button
            onClick={() => {
              if (confirm('Reset entire routine, categories, and preferences to factory defaults?')) {
                onResetDefaults();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Privacy Policy & Data Boundary Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Privacy & Data Policy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your routines, tasks, and personal data stay strictly in your hands.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 font-bold">•</span>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Local-first device storage:</strong> All schedule blocks, subtasks, custom categories, daily scores, and inbox entries are saved exclusively in your browser's local storage (<code className="text-[11px] font-mono text-indigo-500">codewave_*</code>). No central server database holds your schedule.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 font-bold">•</span>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">AI Coach transmission:</strong> When you converse with the Gemini AI Coach, only your message prompt and today's schedule blocks are sent securely to the Google Gemini API to calculate routine optimizations. No other personal data is shared.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 font-bold">•</span>
            <p>
              <strong className="text-slate-800 dark:text-slate-200">Zero trackers or ads:</strong> CodeWave Daily contains zero third-party analytics trackers, cookies, or advertisement beacons.
            </p>
          </div>
        </div>
      </div>

      {/* Paste JSON Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Paste JSON Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste a previously exported CodeWave Daily JSON backup below to restore your full schedule.
            </p>

            <textarea
              rows={8}
              value={jsonPasteContent}
              onChange={(e) => setJsonPasteContent(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!jsonPasteContent.trim()}
                onClick={handlePasteImport}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-40"
              >
                Restore from JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
