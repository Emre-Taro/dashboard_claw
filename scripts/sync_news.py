import os
from datetime import datetime
import feedparser
from supabase import create_client, Client

# --- 1. 各種設定 ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Gemini APIキー（環境変数、または直接文字列で設定）
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# SupabaseとGeminiクライアントの初期化
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# --- 2. メディア定義（Bloombergを最優先に分離） ---
BLOOMBERG_FEED = "https://news.google.com/rss/search?q=when:24h+site:bloomberg.com&hl=en-US&gl=US&ceid=US:en"

OTHER_FEEDS = {
    "Reuters": "https://news.google.com/rss/search?q=when:24h+site:reuters.com&hl=en-US&gl=US&ceid=US:en",
    "Financial Times": "https://www.ft.com/?format=rss",
    "Nikkei": "https://www.nikkei.com/rss/",
    "X (Macro/Finance Trends)": "https://news.google.com/rss/search?q=site:x.com+OR+site:twitter.com+金融+マクロ+FRB&hl=ja&gl=JP&ceid=JP:ja"
}

def fetch_rss_articles():
    """Bloombergをメインに、他メディアの情報を収集する"""
    collected_articles = []
    
    # 🌟 1. まずBloombergの情報を最優先・多めに取得する
    print("📥 【メイン】Bloomberg から最新ニュースを収集中...")
    try:
        feed = feedparser.parse(BLOOMBERG_FEED)
        for entry in feed.entries[:5]: # Bloombergは上位5件
            collected_articles.append({
                "source": "Bloomberg (Main)",
                "title": entry.title,
                "url": entry.link
            })
    except Exception as e:
        print(f"⚠️ Bloomberg の取得に失敗しました: {e}")

    # 🌟 2. その他のメディアから補助的に情報を収集する
    for source_name, url in OTHER_FEEDS.items():
        print(f"📥 【サブ】{source_name} から記事を収集中...")
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:2]: # 他メディアは上位2件ずつ
                collected_articles.append({
                    "source": source_name,
                    "title": entry.title,
                    "url": entry.link
                })
        except Exception as e:
            print(f"⚠️ {source_name} の取得に失敗しました: {e}")
            
    return collected_articles

def generate_ai_summary(articles):
    """取得した複数記事をLLMに要約させ、構造化された詳細データを生成する"""
    print("🤖 AI（LLM）による詳細マクロ要約の生成中...")
    
    articles_text = "\n".join([f"- [{item['source']}] {item['title']} ({item['url']})" for item in articles])
    
    prompt = f"""
    あなたはプロの金融アナリストです。以下の最新ニュースヘッドライン群（特にBloombergの情報を軸にして）を分析し、以下の7つの観点を網羅した総合要約（総計500字以上）を作成してください。
    1. 最新ニュースヘッドライン群を要約
    2. マクロ情勢、金利状況、為替、重要指標の発表、金融政策の発表
    3. 日米欧3つの株式市場と債券市場の動向
    4. 地政学の情勢
    5. M&AやIPOなどのニュース
    6. ETFやインデックスの動向
    7. それ以外の普段見ないようなニュース
    の7つの観点を軸に、投資家向けに具体的かつ深い内容（総計400字以上）で総合要約を作成してください。
    また、それぞれのトピックに該当する個別記事をJSONの配列形式（details用）で整理してください。

    【ニュース一覧】
    {articles_text}
    """

    # Gemini APIによる要約生成
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    return response.choices[0].message.content

def main():
    print("🚀 Bloombergをメインにした高度なニュース収集・要約パイプラインを開始します...")
    
    # 1. 記事収集
    articles = fetch_rss_articles()
    if not articles:
        print("❌ 記事が取得できませんでした。")
        return

    # 2. AI要約
    summary_text = generate_ai_summary(articles)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
    timestamp_id = datetime.now().strftime("%Y%m%d-%H%M")
    
    # 3. トピック別詳細データの構築
    details_list = []
    for art in articles[:4]: # 最大4件をdetailsにセット
        details_list.append({
            "topic": "市場動向・速報",
            "source": art["source"],
            "title": art["title"],
            "url": art["url"]
        })

    # 4. Supabase送信用ペイロード
    news_item = {
        "id": f"news-{timestamp_id}",
        "title": f"【AIマクロ分析】グローバル金融市場・トレンド ({datetime.now().strftime('%m/%d %H:%M')})",
        "source": "OpenClaw Multi-Feed & LLM Pipeline",
        "summary": summary_text,
        "url": articles[0]["url"] if articles else "https://www.bloomberg.co.jp",
        "details": details_list
    }

    # 5. Supabaseへ upsert
    response = supabase.table("daily_news").upsert(news_item).execute()
    print("✅ Supabaseへの高度なデータ同期が完了しました！")

if __name__ == "__main__":
    main()