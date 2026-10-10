// components/tabs/GoalsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { GoalsData, GoalItem } from '@/types';

export default function GoalsTab() {
  const [goals, setGoals] = useState<GoalsData>({
    longTerm: [
      'グローバル市場で通用するエンジニア・起業家としての基盤確立',
      'AI/MLアーキテクチャおよび金融市場・マクロ経済の深い専門性の習得'
    ],
    monthly: [
      { id: '1', text: 'ダッシュボードの完全実装と運用開始', completed: true },
      { id: '2', text: '高度なデータ構造とアルゴリズムの演習推進', completed: false }
    ],
    weekly: [
      { id: '1', text: 'Next.jsによるフロントエンド開発完了', completed: false },
      { id: '2', text: '主要マクロ経済指標（USD/JPY、金利）の確認', completed: true }
    ]
  });

  const [newLongTerm, setNewLongTerm] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [newWeekly, setNewWeekly] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('openclaw_goals');
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToStorage = (updated: GoalsData) => {
    setGoals(updated);
    localStorage.setItem('openclaw_goals', JSON.stringify(updated));
  };

  const addLongTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLongTerm.trim()) return;
    saveToStorage({ ...goals, longTerm: [...goals.longTerm, newLongTerm] });
    setNewLongTerm('');
  };

  const addMonthly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthly.trim()) return;
    const newItem: GoalItem = { id: Date.now().toString(), text: newMonthly, completed: false };
    saveToStorage({ ...goals, monthly: [...goals.monthly, newItem] });
    setNewMonthly('');
  };

  const addWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeekly.trim()) return;
    const newItem: GoalItem = { id: Date.now().toString(), text: newWeekly, completed: false };
    saveToStorage({ ...goals, weekly: [...goals.weekly, newItem] });
    setNewWeekly('');
  };

  const toggleMonthly = (id: string) => {
    const updated = goals.monthly.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    saveToStorage({ ...goals, monthly: updated });
  };

  const toggleWeekly = (id: string) => {
    const updated = goals.weekly.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
    saveToStorage({ ...goals, weekly: updated });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">🎯 長期目標 & タスク管理</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">🚀 長期目標</h3>
            <ul className="space-y-2 mb-4 text-sm text-slate-300">
              {goals.longTerm.map((item, idx) => (
                <li key={idx} className="p-2.5 bg-slate-950 rounded border border-slate-800">・{item}</li>
              ))}
            </ul>
          </div>
          <form onSubmit={addLongTerm} className="flex gap-2">
            <input 
              type="text" 
              value={newLongTerm}
              onChange={(e) => setNewLongTerm(e.target.value)}
              placeholder="新しい長期目標..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm text-white transition">追加</button>
          </form>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">📅 今月やること</h3>
            <ul className="space-y-2 mb-4 text-sm text-slate-300">
              {goals.monthly.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer w-full">
                    <input type="checkbox" checked={item.completed} onChange={() => toggleMonthly(item.id)} className="rounded bg-slate-900 border-slate-700 text-emerald-500" />
                    <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-200'}>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={addMonthly} className="flex gap-2">
            <input 
              type="text" 
              value={newMonthly}
              onChange={(e) => setNewMonthly(e.target.value)}
              placeholder="今月のタスク..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-sm text-white transition">追加</button>
          </form>
        </div>

        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-amber-400 mb-3">✅ 今週やること</h3>
            <ul className="space-y-2 mb-4 text-sm text-slate-300">
              {goals.weekly.map((item) => (
                <li key={item.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer w-full">
                    <input type="checkbox" checked={item.completed} onChange={() => toggleWeekly(item.id)} className="rounded bg-slate-900 border-slate-700 text-amber-500" />
                    <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-200'}>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <form onSubmit={addWeekly} className="flex gap-2">
            <input 
              type="text" 
              value={newWeekly}
              onChange={(e) => setNewWeekly(e.target.value)}
              placeholder="今週のタスク..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 px-3 py-1.5 rounded text-sm text-white transition">追加</button>
          </form>
        </div>
      </div>
    </div>
  );
}