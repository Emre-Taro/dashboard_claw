import os
import re
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import feedparser
from google import genai
from google.genai import types
from pydantic import BaseModel
from supabase import create_client, Client

# --- 1. 各種設定 ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

JST = timezone(timedelta(hours=9))

# --- 2. メディア定義（すべて同じ扱い・同じ件数で収集する） ---
ARTICLES_PER_SOURCE = 4


def google_news_feed(site, lang="en"):
    if lang == "ja":
        query = f"when:24h site:{site} (市場 OR 経済 OR 株価 OR 金利)"
        params = {"q": query, "hl": "ja", "gl": "JP", "ceid": "JP:ja"}
    else:
        query = f"when:24h site:{site} (markets OR economy OR stocks OR bonds OR fed OR earnings)"
        params = {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}
    return "https://news.google.com/rss/search?" + urlencode(params)


FEEDS = {
    "Bloomberg": google_news_feed("bloomberg.com"),
    "Reuters": google_news_feed("reuters.com"),
    "Financial Times": google_news_feed("ft.com"),
    "Wall Street Journal": google_news_feed("wsj.com"),
    "CNBC": google_news_feed("cnbc.com"),
    "Nikkei Asia": google_news_feed("asia.nikkei.com"),
    "日本経済新聞": google_news_feed("nikkei.com", lang="ja"),
    "X (Macro/Finance Trends)": "https://news.google.com/rss/search?q=site:x.com+OR+site:twitter.com+金融+マクロ+FRB&hl=ja&gl=JP&ceid=JP:ja",
}


def clean_title(title):
    """Google News が付ける末尾の ' - Media名' を除去する"""
    return re.sub(r"\s+-\s+[^-]+$", "", title).strip()


def fetch_rss_articles():
    """全メディアから同じ件数ずつ記事を収集し、ラウンドロビンで並べる"""
    per_source = {}
    seen_titles = set()

    for source_name, url in FEEDS.items():
        print(f"📥 {source_name} から記事を収集中...")
        try:
            feed = feedparser.parse(url)
        except Exception as e:
            print(f"⚠️ {source_name} の取得に失敗しました: {e}")
            continue

        items = []
        for entry in feed.entries:
            title = clean_title(entry.title)
            if title.lower() in seen_titles:
                continue
            seen_titles.add(title.lower())
            items.append({"source": source_name, "title": title, "url": entry.link})
            if len(items) >= ARTICLES_PER_SOURCE:
                break
        per_source[source_name] = items
        print(f"   → {len(items)} 件")

    # 特定メディアに偏らないよう、各メディアから1件ずつ交互に並べる
    articles = []
    for i in range(ARTICLES_PER_SOURCE):
        for items in per_source.values():
            if i < len(items):
                articles.append(items[i])
    return articles


# --- 3. LLM の出力スキーマ ---
class Section(BaseModel):
    heading: str
    points: list[str]


class ArticleTopic(BaseModel):
    index: int
    topic: str


class Digest(BaseModel):
    headline: str
    sections: list[Section]
    article_topics: list[ArticleTopic]


SECTION_HEADINGS = [
    "マクロ・金融政策",
    "株式・債券市場",
    "為替・コモディティ",
    "地政学",
    "企業・M&A・IPO",
    "注目トピック",
]


def generate_ai_summary(articles):
    """記事群から構造化された要約を生成する"""
    print("🤖 AI による要約を生成中...")

    articles_text = "\n".join(
        f"{i}. [{a['source']}] {a['title']}" for i, a in enumerate(articles)
    )
    headings_text = "、".join(SECTION_HEADINGS)

    prompt = f"""
あなたはプロの金融アナリストです。以下は複数メディアの最新ニュース見出しです。
特定のメディアを優先せず、すべてのメディアの情報を均等に考慮して、投資家向けの要約を日本語で作成してください。

出力ルール:
- headline: 今回の市場全体を1文（60字以内）でまとめる。
- sections: 次の見出しをこの順番で使う: {headings_text}
  - 各セクションは2〜4個の箇条書き（points）。1つの箇条書きは1文・80字以内で、具体的な数値や固有名詞を含める。
  - 該当するニュースがないセクションは省略する。
  - Markdown記号、絵文字、URL、メディア名の括弧書きは書かない。プレーンな文章のみ。
- article_topics: 各記事の番号（index）に、上の見出しのうち最も当てはまるものを topic として1つ割り当てる。金融・経済と無関係な記事は含めない。

【ニュース一覧】
{articles_text}
"""

    response = gemini_client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=Digest,
        ),
    )
    return response.parsed


def format_summary(digest):
    """フロントエンドで表示するシンプルなテキスト形式に変換する

    1行目: ヘッドライン
    '## 見出し' と '- 箇条書き' のみを使う
    """
    lines = [digest.headline.strip()]
    for section in digest.sections:
        if not section.points:
            continue
        lines.append("")
        lines.append(f"## {section.heading.strip()}")
        lines.extend(f"- {p.strip()}" for p in section.points)
    return "\n".join(lines)


def build_details(digest, articles):
    """LLMが割り当てたトピックごとに記事リンクをまとめる（URLは収集データのものを使う）"""
    topic_order = {h: i for i, h in enumerate(SECTION_HEADINGS)}
    details = []
    used = set()
    for item in digest.article_topics:
        if not (0 <= item.index < len(articles)) or item.index in used:
            continue
        used.add(item.index)
        art = articles[item.index]
        details.append({
            "topic": item.topic,
            "source": art["source"],
            "title": art["title"],
            "url": art["url"],
        })
    details.sort(key=lambda d: topic_order.get(d["topic"], len(SECTION_HEADINGS)))
    return details


def main():
    print("🚀 マルチメディア・ニュース収集・要約パイプラインを開始します...")

    articles = fetch_rss_articles()
    if not articles:
        print("❌ 記事が取得できませんでした。")
        return

    digest = generate_ai_summary(articles)
    if digest is None:
        print("❌ AI 要約の生成に失敗しました。")
        return

    now = datetime.now(JST)
    news_item = {
        "id": f"news-{now.strftime('%Y%m%d-%H%M')}",
        "title": f"グローバル金融マーケット要約 ({now.strftime('%m/%d %H:%M')} JST)",
        "source": "Multi-Media Digest",
        "summary": format_summary(digest),
        "url": articles[0]["url"],
        "details": build_details(digest, articles),
    }

    # 新しい要約を保存してから古い要約を削除する（上書き）
    supabase.table("daily_news").upsert(news_item).execute()
    supabase.table("daily_news").delete().neq("id", news_item["id"]).execute()
    print("✅ Supabase のニュースを最新の要約で上書きしました！")


if __name__ == "__main__":
    main()
