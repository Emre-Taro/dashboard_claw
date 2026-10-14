// app/api/email/route.ts
import { connection } from 'next/server';
import type { EmailItem, JobEmailStatus } from '@/types';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_EMAILS = 30;

// Gmailの検索構文で就職・応募関連のメールを探す
const JOB_QUERY = [
  'newer_than:60d',
  '-category:promotions',
  '(',
  'subject:(application OR applying OR applied OR interview OR "next steps" OR offer OR candidacy OR assessment OR "coding challenge")',
  'OR subject:(応募 OR 選考 OR 面接 OR 内定 OR エントリー OR 書類 OR 適性検査 OR 採用)',
  'OR from:(greenhouse.io OR lever.co OR myworkday.com OR workday.com OR smartrecruiters.com OR ashbyhq.com OR icims.com OR jobvite.com OR hackerrank.com OR codesignal.com OR linkedin.com)',
  ')',
].join(' ');

// 件名・本文から選考ステータスを推定する（上から順に優先）
const STATUS_RULES: { status: JobEmailStatus; pattern: RegExp }[] = [
  { status: 'offer', pattern: /offer letter|pleased to offer|内定/i },
  { status: 'rejected', pattern: /unfortunately|not (to )?move forward|other candidates|regret to inform|not been selected|お見送り|残念ながら|ご希望に添え/i },
  { status: 'interview', pattern: /interview|schedule a (call|time)|availability|面接|面談|日程/i },
  { status: 'assessment', pattern: /assessment|coding challenge|hackerrank|codesignal|online test|適性検査|テスト|課題/i },
  { status: 'applied', pattern: /thank you for (applying|your application|your interest)|application (received|submitted)|we('ve| have) received your|応募(を)?受け付け|ご応募ありがとう|エントリーありがとう/i },
];

function detectStatus(text: string): JobEmailStatus {
  return STATUS_RULES.find((rule) => rule.pattern.test(text))?.status ?? 'other';
}

// Gmail API の snippet は HTML エンティティを含むのでデコードする
function decodeEntities(text: string) {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// "Name <address@example.com>" から表示名を取り出す
function senderName(from: string) {
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<.*>\s*$/);
  return match && match[1] ? match[1] : from;
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: { headers: { name: string; value: string }[] };
}

export async function GET(request: Request) {
  await connection();

  // ブラウザで Google ログインしたユーザー本人のアクセストークン
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return Response.json({ error: 'not_connected' }, { status: 401 });
  }

  // Gmail リンクを正しいアカウントで開くためのメールアドレス
  const authuser = new URL(request.url).searchParams.get('authuser') ?? '0';

  const gmail = (path: string) =>
    fetch(`${GMAIL_API}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });

  const listRes = await gmail(`/messages?${new URLSearchParams({ q: JOB_QUERY, maxResults: String(MAX_EMAILS) })}`);
  if (listRes.status === 401 || listRes.status === 403) {
    return Response.json({ error: 'not_connected' }, { status: 401 });
  }
  if (!listRes.ok) {
    console.error('Gmail API error:', listRes.status, await listRes.text());
    return Response.json({ error: 'Gmail からメールを取得できませんでした。' }, { status: 502 });
  }

  const list: { messages?: { id: string }[] } = await listRes.json();
  const ids = (list.messages ?? []).map((m) => m.id);

  const metadataQuery = 'format=metadata&metadataHeaders=Subject&metadataHeaders=From';
  const messages: GmailMessage[] = await Promise.all(
    ids.map(async (id) => (await gmail(`/messages/${id}?${metadataQuery}`)).json())
  );

  const emails: EmailItem[] = messages
    .filter((m) => m.payload)
    .map((m) => {
      const header = (name: string) => m.payload.headers.find((h) => h.name.toLowerCase() === name)?.value ?? '';
      const subject = header('subject') || '(件名なし)';
      const snippet = decodeEntities(m.snippet);
      return {
        id: m.id,
        sender: senderName(header('from')) || '(不明)',
        subject,
        snippet,
        date: new Date(Number(m.internalDate)).toISOString(),
        status: detectStatus(`${subject}\n${snippet}`),
        url: `https://mail.google.com/mail/?authuser=${encodeURIComponent(authuser)}#all/${m.threadId}`,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return Response.json({ emails });
}
