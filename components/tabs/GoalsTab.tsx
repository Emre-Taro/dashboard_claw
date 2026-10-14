// components/tabs/GoalsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { GoalsData, GoalItem } from '@/types';

const STORAGE_KEY = 'openclaw_goals';

const DEFAULT_GOALS: GoalsData = {
  longTerm: [
    { id: 'lt-1', text: 'グローバル市場で通用するエンジニア・起業家としての基盤確立', completed: false },
    { id: 'lt-2', text: 'AI/MLアーキテクチャおよび金融市場・マクロ経済の深い専門性の習得', completed: false }
  ],
  weekly: [
    { id: 'w-1', text: 'Next.jsによるフロントエンド開発完了', completed: false },
    { id: 'w-2', text: '主要マクロ経済指標（USD/JPY、金利）の確認', completed: true }
  ],
  daily: []
};

// 旧形式（longTerm が string[]、monthly あり）の保存データを新形式に変換する
function normalizeGoals(saved: Record<string, unknown>): GoalsData {
  const toItems = (value: unknown, prefix: string): GoalItem[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item, idx) =>
      typeof item === 'string' ? { id: `${prefix}-${idx}`, text: item, completed: false } : (item as GoalItem)
    );
  };
  return {
    longTerm: toItems(saved.longTerm, 'lt'),
    weekly: toItems(saved.weekly, 'w'),
    daily: toItems(saved.daily, 'd')
  };
}

interface GoalColumnProps {
  title: string;
  placeholder: string;
  items: GoalItem[];
  showCheckbox: boolean;
  accent: { title: string; button: string; focus: string; checkbox: string };
  onChange: (items: GoalItem[]) => void;
}

function GoalColumn({ title, placeholder, items, showCheckbox, accent, onChange }: GoalColumnProps) {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onChange([...items, { id: Date.now().toString(), text: newText.trim(), completed: false }]);
    setNewText('');
  };

  const startEdit = (item: GoalItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    if (editText.trim()) {
      onChange(items.map(item => item.id === editingId ? { ...item, text: editText.trim() } : item));
    }
    setEditingId(null);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const toggleItem = (id: string) => {
    onChange(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  return (
    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${accent.title}`}>{title}</h3>
        <ul className="space-y-2 mb-4 text-sm text-slate-300">
          {items.map((item) => (
            <li key={item.id} className="group flex items-center gap-2 p-2.5 bg-slate-950 rounded border border-slate-800">
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                  className={`rounded bg-slate-900 border-slate-700 shrink-0 ${accent.checkbox}`}
                />
              )}
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editText}
                  autoFocus
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className={`flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none ${accent.focus}`}
                />
              ) : (
                <span
                  onDoubleClick={() => startEdit(item)}
                  className={`flex-1 ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}
                >
                  {showCheckbox ? item.text : `・${item.text}`}
                </span>
              )}
              {editingId !== item.id && (
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => startEdit(item)} title="編集" className="text-xs text-slate-400 hover:text-white px-1">✏️</button>
                  <button onClick={() => deleteItem(item.id)} title="削除" className="text-xs text-slate-400 hover:text-rose-400 px-1">🗑️</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={addItem} className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none ${accent.focus}`}
        />
        <button type="submit" className={`px-3 py-1.5 rounded text-sm text-white transition ${accent.button}`}>追加</button>
      </form>
    </div>
  );
}

export default function GoalsTab() {
  const [goals, setGoals] = useState<GoalsData>(DEFAULT_GOALS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setGoals(normalizeGoals(JSON.parse(saved)));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const updateGoals = (key: keyof GoalsData, items: GoalItem[]) => {
    const updated = { ...goals, [key]: items };
    setGoals(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">🎯 長期目標 & タスク管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GoalColumn
          title="🚀 長期目標"
          placeholder="新しい長期目標..."
          items={goals.longTerm}
          showCheckbox={false}
          accent={{ title: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-500', focus: 'focus:border-blue-500', checkbox: 'text-blue-500' }}
          onChange={(items) => updateGoals('longTerm', items)}
        />
        <GoalColumn
          title="📅 今週やること"
          placeholder="今週のタスク..."
          items={goals.weekly}
          showCheckbox
          accent={{ title: 'text-emerald-400', button: 'bg-emerald-600 hover:bg-emerald-500', focus: 'focus:border-emerald-500', checkbox: 'text-emerald-500' }}
          onChange={(items) => updateGoals('weekly', items)}
        />
        <GoalColumn
          title="✅ 今日のタスク"
          placeholder="今日のタスク..."
          items={goals.daily}
          showCheckbox
          accent={{ title: 'text-amber-400', button: 'bg-amber-600 hover:bg-amber-500', focus: 'focus:border-amber-500', checkbox: 'text-amber-500' }}
          onChange={(items) => updateGoals('daily', items)}
        />
      </div>
    </div>
  );
}
