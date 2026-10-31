import React, { useState } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Clock,
  Sparkles,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { ScheduleBlock, Category, TaskItem } from '../types';
import { formatDisplayTime, calculateDuration } from '../utils/time';

interface BlockDetailDrawerProps {
  block: ScheduleBlock | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  timeFormat: '12h' | '24h';
  onUpdateBlock: (updated: ScheduleBlock) => void;
  onEditBlockSettings: (block: ScheduleBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const BlockDetailDrawer: React.FC<BlockDetailDrawerProps> = ({
  block,
  isOpen,
  onClose,
  categories,
  timeFormat,
  onUpdateBlock,
  onEditBlockSettings,
  onDeleteBlock,
}) => {
  if (!isOpen || !block) return null;

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const category = categories.find((c) => c.id === block.categoryId);

  const completedCount = block.tasks.filter((t) => t.completed).length;
  const totalCount = block.tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: newTaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      order: block.tasks.length,
    };

    onUpdateBlock({
      ...block,
      tasks: [...block.tasks, newTask],
    });
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string) => {
    const updatedTasks = block.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateBlock({
      ...block,
      tasks: updatedTasks,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = block.tasks.filter((t) => t.id !== taskId);
    onUpdateBlock({
      ...block,
      tasks: updatedTasks,
    });
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= block.tasks.length) return;

    const newTasks = [...block.tasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;

    onUpdateBlock({
      ...block,
      tasks: newTasks,
    });
  };

  const handleStartEditTask = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEditTask = (taskId: string) => {
    if (!editingTitle.trim()) return;
    const updated = block.tasks.map((t) =>
      t.id === taskId ? { ...t, title: editingTitle.trim() } : t
    );
    onUpdateBlock({
      ...block,
      tasks: updated,
    });
    setEditingTaskId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/40 backdrop-blur-xs p-4 sm:p-0">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl w-full sm:max-w-md h-full max-h-[95vh] sm:max-h-full sm:h-screen flex flex-col rounded-2xl sm:rounded-none overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: category?.color || '#6366f1' }}
              />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {category?.name || 'General'}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-3xl p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">{block.icon}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {block.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {formatDisplayTime(block.startTime, timeFormat)} - {formatDisplayTime(block.endTime, timeFormat)}
                </span>
                <span>·</span>
                <span>{block.durationMinutes || calculateDuration(block.startTime, block.endTime)} min</span>
              </div>
            </div>
          </div>

          {block.note && (
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-0.5">
                Mission / Note:
              </span>
              <p>{block.note}</p>
            </div>
          )}
        </div>

        {/* Task Checklist Section */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Action Checklist
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                {completedCount}/{totalCount}
              </span>
            </div>
            {totalCount > 0 && (
              <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {progressPercent}%
              </span>
            )}
          </div>

          {totalCount > 0 && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Quick add task form */}
          <form onSubmit={handleAddTask} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add specific task (e.g. Fix login bug)..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-2">
            {block.tasks.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No tasks yet inside this block. Add actionable checkpoints above!
              </div>
            ) : (
              block.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                    task.completed
                      ? 'border-slate-200 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-800/20 opacity-75'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingTaskId === task.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEditTask(task.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEditTask(task.id)}
                        autoFocus
                        className="w-full px-2 py-0.5 text-xs rounded border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <p
                        onDoubleClick={() => handleStartEditTask(task)}
                        className={`text-xs text-slate-800 dark:text-slate-200 cursor-pointer ${
                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveTask(index, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move task up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={index === block.tasks.length - 1}
                      onClick={() => handleMoveTask(index, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-20"
                      title="Move task down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
          <button
            onClick={() => onDeleteBlock(block.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Block</span>
          </button>

          <button
            onClick={() => onEditBlockSettings(block)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit Block</span>
          </button>
        </div>
      </div>
    </div>
  );
};
