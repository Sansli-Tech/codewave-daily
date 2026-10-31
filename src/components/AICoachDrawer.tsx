import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Clock,
  Trash2,
  Edit2,
  Tag,
  RotateCcw,
} from 'lucide-react';
import {
  ScheduleBlock,
  Category,
  InboxTask,
  Preferences,
  AICoachProposal,
  AICoachAction,
} from '../types';
import { formatDisplayTime } from '../utils/time';

interface AICoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  blocks: ScheduleBlock[];
  categories: Category[];
  inbox: InboxTask[];
  preferences: Preferences;
  timeFormat: '12h' | '24h';
  onApplyProposal: (proposal: AICoachProposal) => void;
}

const EXAMPLE_PROMPTS = [
  'Add a 30 min reading block after dinner',
  'Schedule 45 min strength workout at 07:00 AM',
  'Push all afternoon blocks by 30 minutes',
  'Plan deep work tomorrow morning from 9 to 12',
  'Create a new category "Language Study" in emerald',
];

export const AICoachDrawer: React.FC<AICoachDrawerProps> = ({
  isOpen,
  onClose,
  currentDate,
  blocks,
  categories,
  inbox,
  preferences,
  timeFormat,
  onApplyProposal,
}) => {
  if (!isOpen) return null;

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AICoachProposal | null>(null);

  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = promptText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setProposal(null);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          context: {
            date: currentDate,
            blocks,
            categories,
            inbox,
            preferences,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${response.status}`);
      }

      const data: AICoachProposal = await response.json();
      if (!data.actions || !Array.isArray(data.actions)) {
        throw new Error('AI Coach response did not contain executable schedule actions.');
      }

      setProposal(data);
      if (!promptText) {
        setInputPrompt('');
      }
    } catch (err: any) {
      console.error('Coach request error:', err);
      setErrorMsg(err.message || 'Failed to process AI schedule command.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!proposal) return;
    onApplyProposal(proposal);
    setProposal(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/40 backdrop-blur-xs p-4 sm:p-0">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-lg h-full max-h-[95vh] sm:max-h-full sm:h-screen flex flex-col rounded-2xl sm:rounded-none overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Gemini Routine Coach</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  Gemini 3.8
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Natural language routine adaptation with preview & undo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Quick prompt suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputPrompt(promptText);
                    handleSendPrompt(promptText);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-8 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Gemini is analyzing your day's schedule and drafting optimal changes...
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <span className="font-bold">Error:</span> {errorMsg}
              </div>
            </div>
          )}

          {/* Proposal Preview Card */}
          {proposal && !isLoading && (
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Proposed Schedule Changes
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {proposal.summary}
                  </p>
                </div>
              </div>

              {proposal.thought && (
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-950 text-xs text-slate-700 dark:text-slate-300 italic">
                  "{proposal.thought}"
                </div>
              )}

              {/* Actions Diff List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Actions ({proposal.actions.length}):
                </span>
                {proposal.actions.map((act, i) => {
                  const targetBlock = blocks.find((b) => b.id === act.targetBlockId);
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 uppercase text-[10px] tracking-wider">
                          {act.type.replace('_', ' ')}
                        </span>
                        {act.blockData?.startTime && act.blockData?.endTime && (
                          <span className="font-mono text-[11px] text-slate-500">
                            {formatDisplayTime(act.blockData.startTime, timeFormat)} -{' '}
                            {formatDisplayTime(act.blockData.endTime, timeFormat)}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {act.explanation || act.blockData?.title || 'Schedule modification'}
                      </p>

                      {act.blockData?.tasks && act.blockData.tasks.length > 0 && (
                        <div className="text-[11px] text-slate-500 pl-2 border-l border-indigo-300 dark:border-indigo-700">
                          Tasks: {act.blockData.tasks.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200 dark:border-indigo-900">
                <button
                  type="button"
                  onClick={() => setProposal(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="e.g. Add 30 min reading block after dinner..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-xs"
              title="Send to AI Coach"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
