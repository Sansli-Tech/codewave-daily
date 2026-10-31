import React, { useState } from 'react';
import {
  Bookmark,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Calendar,
  Check,
  Clock,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DayTemplate, ScheduleBlock, Category, Preferences } from '../types';
import {
  getTodayDateString,
  formatFriendlyDate,
  formatDisplayTime,
} from '../utils/time';

interface TemplatesViewProps {
  templates: DayTemplate[];
  currentDateBlocks: ScheduleBlock[];
  categories: Category[];
  preferences: Preferences;
  timeFormat: '12h' | '24h';
  currentDate: string;
  onSaveCurrentDayAsTemplate: (name: string, description?: string) => void;
  onApplyTemplate: (templateId: string, targetDate: string, mode: 'replace' | 'merge') => void;
  onDuplicateTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, newName: string, newDescription?: string) => void;
  onDeleteTemplate: (templateId: string) => void;
  onUpdateWeekdayDefaults: (weekdayDefaults: Record<number, string>) => void;
}

const WEEKDAYS = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
];

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  currentDateBlocks,
  categories,
  preferences,
  timeFormat,
  currentDate,
  onSaveCurrentDayAsTemplate,
  onApplyTemplate,
  onDuplicateTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onUpdateWeekdayDefaults,
}) => {
  // Save today state
  const [isSavingDay, setIsSavingDay] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  // Apply template state
  const [applyingTemplate, setApplyingTemplate] = useState<DayTemplate | null>(null);
  const [targetApplyDate, setTargetApplyDate] = useState(currentDate || getTodayDateString());
  const [applyMode, setApplyMode] = useState<'replace' | 'merge'>('replace');

  // Edit/Rename state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Expanded blocks preview
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  const handleSaveDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    onSaveCurrentDayAsTemplate(templateName.trim(), templateDesc.trim() || undefined);
    setIsSavingDay(false);
    setTemplateName('');
    setTemplateDesc('');
  };

  const handleConfirmApply = () => {
    if (!applyingTemplate || !targetApplyDate) return;
    onApplyTemplate(applyingTemplate.id, targetApplyDate, applyMode);
    setApplyingTemplate(null);
  };

  const handleStartRename = (tpl: DayTemplate) => {
    setEditingTemplateId(tpl.id);
    setEditName(tpl.name);
    setEditDesc(tpl.description || '');
  };

  const handleSaveRename = (templateId: string) => {
    if (!editName.trim()) return;
    onRenameTemplate(templateId, editName.trim(), editDesc.trim() || undefined);
    setEditingTemplateId(null);
  };

  const handleWeekdayDefaultChange = (dayNum: number, tplId: string) => {
    const updated = {
      ...(preferences.weekdayDefaultTemplates || {}),
      [dayNum]: tplId,
    };
    onUpdateWeekdayDefaults(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Routine Day Templates
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save repeatable routines (e.g. Lecture day, Home day, Exam week, Weekend) and apply to any date.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSavingDay(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs whitespace-nowrap self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Save Today as Template</span>
        </button>
      </div>

      {/* Save Today Modal */}
      {isSavingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Save Current Day as Template
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This will capture the {currentDateBlocks.length} blocks scheduled on{' '}
              {formatFriendlyDate(currentDate)} into a reusable template.
            </p>

            <form onSubmit={handleSaveDay} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lecture Day, Exam Week, Weekend Refresh"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High intensity campus days with evening workout"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingDay(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekday Default Templates Mapping */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Weekday Default Templates
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Set which template automatically represents each day of the week.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {WEEKDAYS.map(({ day, name }) => {
            const currentDefault = preferences.weekdayDefaultTemplates?.[day] || '';
            return (
              <div
                key={day}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  {name}
                </span>
                <select
                  value={currentDefault}
                  onChange={(e) => handleWeekdayDefaultChange(day, e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="">None (Empty Day)</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Templates List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Saved Templates ({templates.length})
        </h3>

        {templates.map((tpl) => {
          const isExpanded = expandedTemplateId === tpl.id;
          const isEditing = editingTemplateId === tpl.id;

          const totalMins = tpl.blocks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
          const totalHours = (totalMins / 60).toFixed(1);

          return (
            <div
              key={tpl.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition-all space-y-3"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    placeholder="Description..."
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingTemplateId(null)}
                      className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveRename(tpl.id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {tpl.name}
                      </h4>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold">
                        {tpl.blocks.length} {tpl.blocks.length === 1 ? 'block' : 'blocks'} · {totalHours}h
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {tpl.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => {
                        setApplyingTemplate(tpl);
                        setTargetApplyDate(currentDate);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Apply to Date</span>
                    </button>

                    <button
                      onClick={() => onDuplicateTemplate(tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Duplicate template"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleStartRename(tpl)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Rename template"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      disabled={templates.length <= 1}
                      onClick={() => {
                        if (confirm(`Delete template "${tpl.name}"?`)) {
                          onDeleteTemplate(tpl.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Toggle blocks preview"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Collapsed blocks quick preview */}
              {!isExpanded && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tpl.blocks.map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      <span>{b.icon}</span>
                      <span>{b.title}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded detailed blocks preview */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Template Routine Sequence:
                  </span>
                  <div className="space-y-1">
                    {tpl.blocks.map((b, i) => {
                      const cat = categories.find((c) => c.id === b.categoryId);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span>{b.icon}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {b.title}
                            </span>
                            <span className="text-slate-400 text-[11px]">({cat?.name})</span>
                          </div>
                          <div className="font-mono text-slate-500 text-[11px]">
                            {formatDisplayTime(b.startTime, timeFormat)} -{' '}
                            {formatDisplayTime(b.endTime, timeFormat)} ({b.durationMinutes}m)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Template Modal */}
      {applyingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Apply Template: {applyingTemplate.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instantiate {applyingTemplate.blocks.length} blocks onto the selected date.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetApplyDate}
                  onChange={(e) => setTargetApplyDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Schedule Application Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                      applyMode === 'replace'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applyMode"
                      checked={applyMode === 'replace'}
                      onChange={() => setApplyMode('replace')}
                      className="text-indigo-600"
                    />
                    <span>Replace Existing</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer ${
                      applyMode === 'merge'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applyMode"
                      checked={applyMode === 'merge'}
                      onChange={() => setApplyMode('merge')}
                      className="text-indigo-600"
                    />
                    <span>Merge with Existing</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApplyingTemplate(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
