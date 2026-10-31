import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { Category, ScheduleBlock } from '../types';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  blocks: ScheduleBlock[];
  onCreateCategory: (cat: Omit<Category, 'id'>) => void;
  onUpdateCategory: (cat: Category) => void;
  onDeleteCategory: (categoryId: string, reassignToCategoryId?: string) => void;
}

const COLOR_PRESETS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#ef4444', // Rose/Red
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

const EMOJI_PRESETS = ['💻', '🏋️', '📚', '⛪', '💼', '🍳', '🏃', '🎨', '🎯', '🧘', '🥪', '☕', '🛌', '💡', '🎵', '🚗'];

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  blocks,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  if (!isOpen) return null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0]);
  const [formIcon, setFormIcon] = useState(EMOJI_PRESETS[0]);
  const [formReminder, setFormReminder] = useState<number>(10);

  // Reassignment deletion state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const countBlocksForCategory = (catId: string) => {
    return blocks.filter((b) => b.categoryId === catId).length;
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormName('');
    setFormColor(COLOR_PRESETS[categories.length % COLOR_PRESETS.length]);
    setFormIcon(EMOJI_PRESETS[categories.length % EMOJI_PRESETS.length]);
    setFormReminder(10);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setIsCreating(false);
    setFormName(cat.name);
    setFormColor(cat.color);
    setFormIcon(cat.icon);
    setFormReminder(cat.reminderMinutes !== undefined ? cat.reminderMinutes : 10);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    onCreateCategory({
      name: formName.trim(),
      color: formColor,
      icon: formIcon,
      reminderMinutes: formReminder,
    });
    setIsCreating(false);
    setFormName('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !editingId) return;
    const existing = categories.find((c) => c.id === editingId);
    if (!existing) return;

    onUpdateCategory({
      ...existing,
      name: formName.trim(),
      color: formColor,
      icon: formIcon,
      reminderMinutes: formReminder,
    });
    setEditingId(null);
  };

  const handleTriggerDelete = (cat: Category) => {
    const blocksUsingCat = countBlocksForCategory(cat.id);
    if (blocksUsingCat > 0) {
      // Find default fallback
      const otherCats = categories.filter((c) => c.id !== cat.id);
      setReassignTargetId(otherCats[0]?.id || '');
      setDeletingCategory(cat);
    } else {
      if (confirm(`Delete category "${cat.name}"?`)) {
        onDeleteCategory(cat.id);
      }
    }
  };

  const handleConfirmReassignDelete = () => {
    if (!deletingCategory || !reassignTargetId) return;
    onDeleteCategory(deletingCategory.id, reassignTargetId);
    setDeletingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Custom Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create, recolor, and organize routine categories
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

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Reassignment Modal Screen if active */}
          {deletingCategory ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    Reassign Blocks Before Deleting
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
                    "{deletingCategory.name}" is used by{' '}
                    <span className="font-bold">{countBlocksForCategory(deletingCategory.id)}</span>{' '}
                    schedule blocks. Please select which category they should move to:
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Replacement Category:
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCategory(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassignDelete}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Reassign & Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Category form (Create or Edit) */}
              {(isCreating || editingId) && (
                <form
                  onSubmit={isCreating ? handleSaveCreate : handleSaveEdit}
                  className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isCreating ? 'Create New Category' : 'Edit Category'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingId(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <span className="text-lg">{formIcon}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Category name (e.g. Gym, Reading, Church)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Emoji selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Select Icon:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJI_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormIcon(emoji)}
                          className={`w-7 h-7 flex items-center justify-center text-sm rounded-lg border transition-all ${
                            formIcon === emoji
                              ? 'border-indigo-500 bg-indigo-100 dark:bg-indigo-900/60 scale-105'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Select Color:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            formColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-6 h-6 rounded-full cursor-pointer border-0 p-0"
                        title="Pick custom hex color"
                      />
                    </div>
                  </div>

                  {/* Reminder minutes selector */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Notification Reminder:</span>
                    <select
                      value={formReminder}
                      onChange={(e) => setFormReminder(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value={0}>At start of block (0 min)</option>
                      <option value={5}>5 minutes before</option>
                      <option value={10}>10 minutes before (recommended)</option>
                      <option value={15}>15 minutes before</option>
                      <option value={30}>30 minutes before</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingId(null);
                      }}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      {isCreating ? 'Create Category' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Add category button if not editing/creating */}
              {!isCreating && !editingId && (
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              )}

              {/* Categories list */}
              <div className="space-y-2">
                {categories.map((cat) => {
                  const usageCount = countBlocksForCategory(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-xs shrink-0 text-white font-semibold"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {usageCount} {usageCount === 1 ? 'block' : 'blocks'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {cat.color}
                            </span>
                            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                              🔔 {cat.reminderMinutes !== undefined ? (cat.reminderMinutes === 0 ? 'at start' : `${cat.reminderMinutes}m before`) : '10m before'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={categories.length <= 1}
                          onClick={() => handleTriggerDelete(cat)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-30"
                          title={categories.length <= 1 ? 'At least one category is required' : 'Delete category'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
