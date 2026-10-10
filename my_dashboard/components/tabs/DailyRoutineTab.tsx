// components/tabs/DailyRoutineTab.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface WikiData {
  title: string;
  extract: string;
  content_urls: { desktop: { page: string } };
}

export default function DailyRoutineTab() {
  const [wiki, setWiki] = useState<WikiData | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(true);

  const fetchRandomWiki = async () => {
    setLoadingWiki(true);
    try {
      const res = await fetch('https://ja.wikipedia.org/api/rest_v1/page/random/summary');
      const data = await res.json();
      setWiki(data);
    } catch (err) {
      console.error('Wikipedia fetch error:', err);
    } finally {
      setLoadingWiki(false);
    }
  };

  useEffect(() => {
    fetchRandomWiki();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">☀️ 毎日のルーティン & ニュース</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ニュース要約セクション */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">📈 金融・主要マクロニュース要約</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="font-bold text-white">FOMC金利見通し:</span> 市場の利下げ期待と米雇用統計の動向による為替(USD/JPY)への影響要約...
            </li>
            <li className="p-3 bg-slate-950 rounded border border-slate-800">
              <span className="font-bold text-white">テクノロジー動向:</span> 最新のLLMオープンソースモデルとRAGアーキテクチャのトレンド解説...
            </li>
          </ul>
        </div>

        {/* LeetCode セクション */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
          <h3 className="text-lg font-semibold text-emerald-400 mb-3">💻 LeetCode 今日の課題</h3>
          <div className="p-4 bg-slate-950 rounded border border-slate-800 flex flex-col justify-between h-[130px]">
            <div>
              <span className="text-xs bg-amber-600/30 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded mr-2">Medium</span>
              <span className="font-bold text-white">#200. Number of Islands</span>
            </div>
            <p className="text-xs text-slate-400">グラフ構造の走破とDFS/BFSアルゴリズムの実装課題。</p>
            <a 
              href="https://leetcode.com/problems/number-of-islands/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline inline-block"
            >
              LeetCodeで挑戦する →
            </a>
          </div>
        </div>
      </div>

      {/* Wikipedia ランダム記事セクション */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-purple-400">📖 ランダム Wikipedia 記事</h3>
          <button 
            onClick={fetchRandomWiki}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-xs text-white rounded transition shadow"
          >
            別の記事を引く
          </button>
        </div>
        {loadingWiki ? (
          <p className="text-slate-400 text-sm py-4">読み込み中...</p>
        ) : wiki ? (
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <h4 className="font-bold text-white text-md mb-1">{wiki.title}</h4>
            <p className="text-sm text-slate-300 mb-3">{wiki.extract}</p>
            {wiki.content_urls && (
              <a 
                href={wiki.content_urls.desktop.page} 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline"
              >
                Wikipediaで続きを読む →
              </a>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}