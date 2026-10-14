// app/api/leetcode/route.ts
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';

interface LeetCodeQuestion {
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  paidOnly: boolean;
}

const QUERY = `
  query databaseQuestions($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
      data {
        frontendQuestionId: questionFrontendId
        title
        titleSlug
        difficulty
        paidOnly: isPaidOnly
      }
    }
  }
`;

// Databaseカテゴリの無料問題一覧（1日キャッシュ）
async function getDatabaseQuestions(): Promise<LeetCodeQuestion[]> {
  'use cache';
  cacheLife('days');

  const res = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Referer: 'https://leetcode.com/problemset/database/',
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { categorySlug: 'database', limit: 3000, skip: 0, filters: {} },
    }),
  });
  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);

  const json = await res.json();
  const questions: LeetCodeQuestion[] = json.data.questionList.data;
  return questions.filter((q) => !q.paidOnly);
}

// 日付から決まる疑似乱数（同じ日は同じ問題になる）
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export async function GET(request: Request) {
  await connection();

  let questions: LeetCodeQuestion[];
  try {
    questions = await getDatabaseQuestions();
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch LeetCode questions' }, { status: 502 });
  }

  // ?shuffle=1 なら毎回ランダム、それ以外は日本時間の日付ごとに固定
  const shuffle = new URL(request.url).searchParams.get('shuffle') === '1';
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  const random = shuffle ? Math.random : seededRandom(today);

  // Easy / Medium / Hard から1問ずつ選ぶ
  const picked = (['Easy', 'Medium'] as const).flatMap((difficulty) => {
    const pool = questions.filter((q) => q.difficulty === difficulty);
    return pool.length > 0 ? [pool[Math.floor(random() * pool.length)]] : [];
  });

  return Response.json({
    date: today,
    questions: picked.map((q) => ({
      id: q.frontendQuestionId,
      title: q.title,
      difficulty: q.difficulty,
      url: `https://leetcode.com/problems/${q.titleSlug}/`,
    })),
  });
}
