// app/page.tsx
'use client';

import React, { useState } from 'react';
import DailyRoutineTab from '@/components/tabs/DailyRoutineTab';
import GoalsTab from '@/components/tabs/GoalsTab';
import EmailTab from '@/components/tabs/EmailTab';
import KnowledgeTab from '@/components/tabs/KnowledgeURL';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'daily' | 'goals' | 'email' | 'knowledge'>('daily');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ヘッダータイトル */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              OpenClaw Personal Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">Autonomous Knowledge & Routine Hub</p>
          </div>
        </header>

        {/* タブボタン切り替え */}
        <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
          <button 
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            ☀️ 毎日のルーティン
          </button>
          <button 
            onClick={() => setActiveTab('goals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'goals' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            🎯 目標 & タスク
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'email' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            ✉️ 重要メール
          </button>
          <button 
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'knowledge' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            📚 インプット & ナレッジ
          </button>
        </nav>

        {/* タブごとのコンテンツ表示エリア */}
        <main>
          {activeTab === 'daily' && <DailyRoutineTab />}
          {activeTab === 'goals' && <GoalsTab />}
          {activeTab === 'email' && <EmailTab />}
          {activeTab === 'knowledge' && <KnowledgeTab />}
        </main>
      </div>
    </div>
  );
}