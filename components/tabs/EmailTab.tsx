// components/tabs/EmailTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { EmailItem, JobEmailStatus } from '@/types';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const STATUS_LABELS: Record<JobEmailStatus, { label: string; style: string }> = {
  offer: { label: '内定', style: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
  interview: { label: '面接', style: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
  assessment: { label: 'テスト・課題', style: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
  applied: { label: '応募済み', style: 'bg-slate-600/20 text-slate-300 border-slate-500/30' },
  rejected: { label: '不採用', style: 'bg-red-600/20 text-red-400 border-red-500/30' },
  other: { label: 'その他', style: 'bg-amber-600/20 text-amber-400 border-amber-500/30' },
};

const STATUS_ORDER = Object.keys(STATUS_LABELS) as JobEmailStatus[];

export default function EmailTab() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // 期限切れと判明した Google トークン（新しいトークンで接続し直すと自動で解除される）
  const [expiredToken, setExpiredToken] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<JobEmailStatus | 'all'>('all');

  const connectGmail = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: GMAIL_SCOPE,
        redirectTo: window.location.origin,
        queryParams: { prompt: 'consent' },
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmails([]);
  };

  const fetchEmails = async (googleToken: string, userEmail: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/email?authuser=${encodeURIComponent(userEmail)}`, {
        headers: { Authorization: `Bearer ${googleToken}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.status === 401) {
        // Google のトークンが無い・期限切れ（約1時間）→ 再接続してもらう
        setExpiredToken(googleToken);
        setEmails([]);
      } else if (!res.ok) {
        setError(data.error ?? 'メールの取得に失敗しました。');
        setEmails([]);
      } else {
        setEmails(data.emails);
      }
    } catch (err) {
      console.error(err);
      setError('通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  const googleToken = session?.provider_token;
  const userEmail = session?.user.email ?? '';

  const needsConnect = !googleToken || googleToken === expiredToken;

  // Google ログインの状態を監視し、ログイン済みならメールを取得する
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setAuthReady(true);
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && newSession?.provider_token) {
        fetchEmails(newSession.provider_token, newSession.user.email ?? '');
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return <p className="text-sm text-slate-400 py-4">Loading...</p>;
  }

  if (needsConnect) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-100">✉️ 就職・応募関連メール</h2>
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-md text-center space-y-4">
          <p className="text-sm text-slate-300">
            Gmail に接続すると、過去60日間の就職・応募関連メールを自動で探して表示します。
          </p>
          <p className="text-xs text-slate-500">
            メールは読み取り専用で取得され、サーバーには保存されません。
            {session && ' (Google の接続は約1時間で切れるため、再接続してください)'}
          </p>
          <button
            onClick={connectGmail}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-lg"
          >
            {session ? '🔄 Gmail に再接続' : 'Google でログインして Gmail に接続'}
          </button>
        </div>
      </div>
    );
  }

  const visible = filter === 'all' ? emails : emails.filter((e) => e.status === filter);
  const countOf = (status: JobEmailStatus) => emails.filter((e) => e.status === status).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-100">✉️ 就職・応募関連メール</h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">{userEmail}</span>
          <button
            onClick={() => googleToken && fetchEmails(googleToken, userEmail)}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-white disabled:opacity-50 transition"
          >
            🔄 Update
          </button>
          <button onClick={signOut} className="text-xs text-slate-400 hover:text-red-400 transition">ログアウト</button>
        </div>
      </div>

      {/* ステータス別フィルター */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1 rounded-full border transition ${filter === 'all' ? 'bg-slate-200 text-slate-900 border-slate-200' : 'text-slate-300 border-slate-700 hover:border-slate-500'}`}
        >
          すべて ({emails.length})
        </button>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`text-xs px-3 py-1 rounded-full border transition ${filter === status ? 'bg-slate-200 text-slate-900 border-slate-200' : 'text-slate-300 border-slate-700 hover:border-slate-500'}`}
          >
            {STATUS_LABELS[status].label} ({countOf(status)})
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400 py-4">Gmail から取得中...</p>
        ) : error ? (
          <p className="text-sm text-red-400 bg-slate-900 p-4 rounded-xl border border-red-500/30">{error}</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">該当するメールはありません（過去60日間）。</p>
        ) : (
          visible.map((email) => (
            <a
              key={email.id}
              href={email.url}
              target="_blank"
              rel="noreferrer"
              className="block bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md hover:border-slate-700 transition"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <span className={`text-xs border px-2 py-0.5 rounded mr-2 ${STATUS_LABELS[email.status].style}`}>
                    {STATUS_LABELS[email.status].label}
                  </span>
                  <span className="font-bold text-white text-md">{email.subject}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{new Date(email.date).toLocaleDateString('ja-JP')}</span>
              </div>
              <p className="text-xs text-blue-400 mb-2">差出人: {email.sender}</p>
              <p className="text-sm text-slate-300 bg-slate-950 p-3.5 rounded border border-slate-800">{email.snippet}</p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
