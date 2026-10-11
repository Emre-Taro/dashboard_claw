// components/tabs/DailyRoutineTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DetailArticle {
  topic: string;
  source: string;
  title: string;
  url: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  url: string;
  details?: DetailArticle[];
}

interface WikiData {
  title: string;
  extract: string;
  content_urls: { desktop: { page: string } };
}

export default function DailyRoutineTab() {
  const [wiki, setWiki] = useState<WikiData | null>(null);
  const [loadingWiki, setLoadingWiki] = useState(true);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  
  // モーダル管理用ステート
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [myComment, setMyComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('daily_news')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching news:', error);
    } else if (data) {
      setNewsList(data);
    }
  };

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
    fetchNews();
    fetchRandomWiki();
  }, []);

  // Google Driveにコメントと記事を提出する処理
  const handleSaveToDrive = async () => {
    if (!selectedNews) return;
    setIsSaving(true);
    setSaveMessage('');

    try {
      const res = await fetch('/api/save-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedNews.title,
          comment: myComment,
          links: selectedNews.details || []
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSaveMessage('✨ Google Driveへの保存が完了しました！');
        setMyComment('');
      } else {
        setSaveMessage('❌ 保存に失敗しました。');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage('❌ 通信エラーが発生しました。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">Everyday routine & News</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ニュース要約セクション（クリックで全画面モーダルを開く） */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-400">Finance & Macro news Summary</h3>
            <button onClick={fetchNews} className="text-xs text-slate-400 hover:text-white transition">🔄 Update</button>
          </div>
          
          <ul className="space-y-3 text-sm text-slate-300">
            {newsList.length > 0 ? (
              newsList.map((news) => (
                <li 
                  key={news.id} 
                  onClick={() => setSelectedNews(news)}
                  className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1 cursor-pointer hover:border-blue-500/50 transition group"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-xs group-hover:text-blue-400 transition">{news.title}</span>
                    <span className="text-[10px] bg-blue-600/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">{news.source}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{news.summary}</p>
                  <span className="text-[10px] text-blue-400 inline-block pt-1">See in detail with full screen →</span>
                </li>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Waiting for the information from OpenClaw...</p>
            )}
          </ul>
        </div>

        {/* LeetCode セクション */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
          <h3 className="text-lg font-semibold text-emerald-400 mb-3">💻 LeetCode Todays assignment</h3>
          <div className="p-4 bg-slate-950 rounded border border-slate-800 flex flex-col justify-between h-[155px]">
            <div>
              <span className="text-xs bg-amber-600/30 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded mr-2">Medium</span>
              <span className="font-bold text-white">#200. Number of Islands</span>
            </div>
            <p className="text-xs text-slate-400">グラフ構造の走破とDFS/BFSアルゴリズムの実装課題。</p>
            <a href="https://leetcode.com/problems/number-of-islands/" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline inline-block">
              LeetCodeで挑戦する →
            </a>
          </div>
        </div>
      </div>

      {/* Wikipedia ランダム記事 */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-purple-400">📖 Random Wikipedia Article</h3>
          <button onClick={fetchRandomWiki} className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-xs text-white rounded transition shadow">Pick another article</button>
        </div>
        {loadingWiki ? (
          <p className="text-slate-400 text-sm py-4">Fetching...</p>
        ) : wiki ? (
          <div className="bg-slate-950 p-4 rounded border border-slate-800">
            <h4 className="font-bold text-white text-md mb-1">{wiki.title}</h4>
            <p className="text-sm text-slate-300 mb-3">{wiki.extract}</p>
            {wiki.content_urls && <a href={wiki.content_urls.desktop.page} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">Read whole article with Wikipedia →</a>}
          </div>
        ) : null}
      </div>

      {/* 🌟 全画面詳細表示モーダル */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* 閉じるボタン */}
            <button 
              onClick={() => setSelectedNews(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"
            >
              ✕
            </button>

            {/* ヘッダー */}
            <div>
              <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded mr-2">{selectedNews.source}</span>
              <h2 className="text-2xl font-extrabold text-white mt-2">{selectedNews.title}</h2>
            </div>

            {/* 総合要約 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-blue-400">Overall Summary</h4>
              <p className="text-sm text-slate-200 leading-relaxed">{selectedNews.summary}</p>
            </div>

            {/* トピック別・各メディアの記事リンク */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200">🔗 articles for each topics</h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedNews.details && selectedNews.details.length > 0 ? (
                  selectedNews.details.map((item, idx) => (
                    <a 
                      key={idx} 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-3 bg-slate-950 hover:bg-slate-800/80 rounded-lg border border-slate-800 flex justify-between items-center transition"
                    >
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 block mb-0.5">【{item.topic}】</span>
                        <span className="text-sm text-white font-medium">{item.title}</span>
                      </div>
                      <span className="text-xs text-blue-400 shrink-0 ml-4">{item.source} ↗</span>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 p-3 bg-slate-950 rounded">There is currently not any linked date</p>
                )}
              </div>
            </div>

            {/* 自分のコメント・考察の提出セクション */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-amber-400">📝 Commont & opinion on this news</h4>
              <textarea 
                value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
                placeholder="市場へのインパクトや自身の考えをここに書き出す..."
                className="w-full h-28 bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{saveMessage}</span>
                <button 
                  onClick={handleSaveToDrive}
                  disabled={isSaving || !myComment.trim()}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg"
                >
                  {isSaving ? 'Saving...' : '📁 Save to the Google Drive'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}