// components/tabs/EmailTab.tsx
'use client';

import React from 'react';
import { EmailItem } from '@/types';

export default function EmailTab() {
  const emails: EmailItem[] = [
    {
      id: '1',
      sender: 'Recruiting Team (Fintech / Tech)',
      subject: '【選考結果のご案内】面接日程について',
      snippet: '次回の選考ステップとしてケーススタディおよび技術面接を実施いたします。希望日時をご返信ください。',
      date: '2026-10-09'
    },
    {
      id: '2',
      sender: 'University Exchange Office',
      subject: '【重要】留学プログラムに関する重要なお知らせ',
      snippet: '次学期の履修登録およびビザ・滞在要件に関するアップデートをご確認ください。',
      date: '2026-10-08'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-100">✉️ 重要メール一覧</h2>
      <div className="space-y-4">
        {emails.map((email) => (
          <div key={email.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-md hover:border-slate-700 transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded mr-2">重要</span>
                <span className="font-bold text-white text-md">{email.subject}</span>
              </div>
              <span className="text-xs text-slate-400">{email.date}</span>
            </div>
            <p className="text-xs text-blue-400 mb-2">差出人: {email.sender}</p>
            <p className="text-sm text-slate-300 bg-slate-950 p-3.5 rounded border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">AI要約:</span>
              {email.snippet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}