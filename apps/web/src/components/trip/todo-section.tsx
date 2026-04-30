'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import type { TripTask, Participant } from '@barry/shared-types';

const AVATAR_COLORS = ['#2563EB', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'];

const QUICK_TASK_SUGGESTIONS = [
  'Bring pillows', 'Buy groceries', 'Book restaurant', 'Pack speakers',
  'Bring snacks', 'Confirm hotel', 'Buy birthday gift', 'Bring board games',
];

interface TodoSectionProps {
  tripId: string;
  participants: Participant[];
  currentUserId?: string;
}

export function TodoSection({ tripId, participants, currentUserId }: TodoSectionProps) {
  const { tasks, addTask, toggleTask, removeTask, reassignTask } = useAppStore();
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  const tripTasks = tasks[tripId] || [];
  const todoCount = tripTasks.filter(t => !t.completed).length;
  const doneCount = tripTasks.filter(t => t.completed).length;

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask(tripId, newTitle.trim(), undefined, newAssignee || null);
    setNewTitle('');
    setNewAssignee('');
    setShowSuggestions(false);
  };

  const handleQuickAdd = (suggestion: string) => {
    addTask(tripId, suggestion, undefined, null);
    setShowSuggestions(false);
  };

  const handleReassign = (task: TripTask, userId: string | null) => {
    const p = participants.find(p => p.userId === userId);
    reassignTask(tripId, task.id, userId, p?.user?.firstName || null);
    setReassigningId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p className="font-display font-bold text-base text-slate-900">To-do</p>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          {todoCount} open · {doneCount} done
        </span>
      </div>

      {/* Add task */}
      <div className="bg-slate-50 rounded-xl p-2.5 mb-2">
        <div className="flex gap-2 mb-1.5">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            onFocus={() => setShowSuggestions(true)}
            placeholder="What needs doing?"
            className="flex-1 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <select
            value={newAssignee}
            onChange={e => setNewAssignee(e.target.value)}
            className="bg-white rounded-lg px-2 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-200 max-w-[100px]"
          >
            <option value="">Anyone</option>
            {participants.map(p => (
              <option key={p.id} value={p.userId}>
                {p.userId === currentUserId ? 'Me' : p.user?.firstName}
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg disabled:opacity-40 active:scale-95 transition-all"
          >
            Add
          </button>
        </div>
        {/* Quick suggestions */}
        {showSuggestions && newTitle.length === 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {QUICK_TASK_SUGGESTIONS.map(s => (
              <button
                key={s}
                onMouseDown={e => { e.preventDefault(); handleQuickAdd(s); }}
                className="text-[10px] bg-white hover:bg-amber-50 border border-slate-200 rounded-full px-2 py-1 text-slate-700 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tasks list */}
      {tripTasks.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No tasks yet. The group can add anything that needs doing — bring pillows, buy food, book a table…</p>
      ) : (
        <div className="space-y-1">
          {tripTasks
            .slice()
            .sort((a, b) => Number(a.completed) - Number(b.completed))
            .map(task => {
              const assignedP = participants.find(p => p.userId === task.assignedTo);
              const colorIdx = participants.findIndex(p => p.userId === task.assignedTo);
              const color = colorIdx >= 0 ? AVATAR_COLORS[colorIdx % AVATAR_COLORS.length] : '#94A3B8';
              const isReassigning = reassigningId === task.id;

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 rounded-xl px-2 py-2 group transition-colors ${
                    task.completed ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(tripId, task.id)}
                    className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-300 hover:border-emerald-400'
                    }`}
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <p className={`flex-1 text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                    {task.title}
                  </p>

                  {/* Assignee */}
                  {isReassigning ? (
                    <select
                      value={task.assignedTo || ''}
                      onChange={e => handleReassign(task, e.target.value || null)}
                      onBlur={() => setReassigningId(null)}
                      autoFocus
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="">Anyone</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.userId}>
                          {p.userId === currentUserId ? 'Me' : p.user?.firstName}
                        </option>
                      ))}
                    </select>
                  ) : task.assignedTo && assignedP ? (
                    <button
                      onClick={() => setReassigningId(task.id)}
                      className="flex items-center gap-1 hover:bg-slate-100 rounded-lg px-1.5 py-0.5 transition-colors"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[9px]"
                        style={{ backgroundColor: color }}
                      >
                        {assignedP.user?.firstName?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[11px] font-medium text-slate-700">
                        {assignedP.userId === currentUserId ? 'Me' : assignedP.user?.firstName}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setReassigningId(task.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full px-2 py-0.5 font-medium"
                    >
                      Assign
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => removeTask(tripId, task.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-rose-100 flex items-center justify-center text-rose-600 transition-all"
                    aria-label="Delete task"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
