// components/tabs/KnowledgeTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { KnowledgeItem } from '@/types';

export default function KnowledgeTab() {
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([
    {
      id: '1',
      title: 'Attention Is All You Need (Transformer解説)',
      url: 'https://arxiv.org/abs/1706.03762',
      category: 'AI/ML/Data',
      summary: 'リカレントニューラルネットを使わず、Self-Attentionメカニズムのみで並列計算を可能にした深層学習の歴史的論文。'
    },
    {
      id: '2',
      title: '米ドル円（USD/JPY）相場動向とマクロ経済分析',
      url: 'https://www.bloomberg.co.jp',
      category: 'Finance',
      summary: '日銀の金融政策正常化プロセスと米国の利下げ局面が重なる中での為替ボラティリティのメカニズム解説。'
    }
  ]);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<KnowledgeItem['category']>('AI/ML/Data');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('openclaw_knowledge');
    if (saved) {
      try {
        setKnowledgeList(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToStorage = (updated: KnowledgeItem[]) => {
    setKnowledgeList(updated);
    localStorage.setItem('openclaw_knowledge', JSON.stringify(updated));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title,
      url,
      category,
      summary: summary.trim() || '（要約が設定されていません。URLの内容を基にAIが要約します）'
    };
    saveToStorage([newItem, ...knowledgeList]);
    setTitle('');
    setUrl('');
    setSummary('');
  };

  const categories: KnowledgeItem['category'][] = ['AI/ML/Data', 'Finance', 'Business', 'Art/Design', 'Trivia'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">📚 インプット & ナレッジハブ</h2>

      <form onSubmit={handleAdd} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md space-y-4">
        <h3 className="text-md font-semibold text-blue-400">新しい記事・動画の追加</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text" 
            placeholder="タイトル / 動画名" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <input 
            type="url" 
            placeholder="https://..." 
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value as KnowledgeItem['category'])}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <textarea 
          placeholder="要約コメント（ホバー時に表示されます）" 
          value={summary} 
          onChange={(e) => setSummary(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
        />
        <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm text-white font-medium transition shadow">ナレッジを追加</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledgeList.map((item) => (
          <div key={item.id} className="relative group bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md h-36 flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded">{item.category}</span>
                <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">リンクを開く ↗</a>
              </div>
              <h4 className="font-bold text-white text-md line-clamp-2">{item.title}</h4>
            </div>

            <p className="text-xs text-slate-400 truncate">💡 ホバーして要約を確認</p>

            <div className="absolute inset-0 bg-slate-950/95 p-5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center border border-blue-500/40 shadow-2xl pointer-events-none">
              <span className="text-xs font-bold text-blue-400 mb-1.5 flex items-center gap-1.5">💡 AI 要約</span>
              <p className="text-xs text-slate-200 leading-relaxed">{item.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}