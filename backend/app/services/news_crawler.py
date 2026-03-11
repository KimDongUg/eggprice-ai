"""News crawler — fetches egg/poultry-related news via Google News RSS + Naver API fallback."""

import hashlib
import logging
import re
from datetime import datetime
from html import unescape
from typing import Optional
from xml.etree import ElementTree

import httpx
from sqlalchemy.orm import Session

from app.models.news import AnalysisArticle, NewsArticle
from app.services.news_commentary import generate_commentary

logger = logging.getLogger(__name__)

# ── Search keywords → categories ──────────────────────
NEWS_QUERIES = [
    {"query": "계란 가격", "category": "가격"},
    {"query": "달걀 시세 도매", "category": "가격"},
    {"query": "조류독감 계란", "category": "산업"},
    {"query": "조류인플루엔자 양계", "category": "산업"},
    {"query": "양계 농가 산업", "category": "산업"},
    {"query": "사료 가격 옥수수 양계", "category": "사료"},
]

ANALYSIS_QUERIES = [
    {"query": "계란 가격 전망 분석", "category": "주간전망"},
    {"query": "달걀 시세 전망", "category": "주간전망"},
    {"query": "조류독감 영향 분석 계란", "category": "AI분석"},
    {"query": "사료 가격 전망 양계", "category": "사료분석"},
    {"query": "환율 농산물 영향 계란", "category": "환율분석"},
]

GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def _clean_html(text: str) -> str:
    """Remove HTML tags and unescape entities."""
    text = unescape(text or "")
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _make_slug(title: str, pub_date: str) -> str:
    """Generate unique slug from title + date hash."""
    h = hashlib.md5(f"{title}{pub_date}".encode()).hexdigest()[:8]
    slug_base = re.sub(r"[^\w\s-]", "", title)[:50].strip().replace(" ", "-")
    return f"{slug_base}-{h}" if slug_base else h


def _extract_source_name(title_raw: str) -> str:
    """Google News RSS titles end with ' - SourceName'."""
    if " - " in title_raw:
        return title_raw.rsplit(" - ", 1)[-1].strip()
    return ""


def _strip_source_from_title(title_raw: str) -> str:
    """Remove trailing source name from Google News title."""
    if " - " in title_raw:
        return title_raw.rsplit(" - ", 1)[0].strip()
    return title_raw


def _parse_rss_date(date_str: str) -> Optional[datetime]:
    """Parse RSS pubDate format."""
    formats = [
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y %H:%M:%S %z",
        "%Y-%m-%dT%H:%M:%S%z",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except (ValueError, TypeError):
            continue
    return datetime.utcnow()


async def _fetch_google_news_rss(query: str, count: int = 10) -> list[dict]:
    """Fetch news items from Google News RSS for Korean results."""
    params = {"q": query, "hl": "ko", "gl": "KR", "ceid": "KR:ko"}
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(GOOGLE_NEWS_RSS, params=params, headers=HEADERS)
            if resp.status_code != 200:
                logger.warning(f"Google News RSS error {resp.status_code} for '{query}'")
                return []

            root = ElementTree.fromstring(resp.content)
            items = []
            for item in root.findall(".//item")[:count]:
                title_raw = item.findtext("title", "")
                link = item.findtext("link", "")
                pub_date = item.findtext("pubDate", "")
                description = item.findtext("description", "")

                source_name = _extract_source_name(title_raw)
                title = _strip_source_from_title(title_raw)
                title = _clean_html(title)
                description = _clean_html(description)

                if not title:
                    continue

                items.append({
                    "title": title,
                    "description": description,
                    "link": link,
                    "pubDate": pub_date,
                    "source_name": source_name,
                })
            return items
    except Exception as e:
        logger.error(f"Google News RSS error for '{query}': {e}")
        return []


async def crawl_news(db: Session) -> int:
    """Crawl news articles and store in DB. Returns count of new articles."""
    count = 0
    for q in NEWS_QUERIES:
        try:
            items = await _fetch_google_news_rss(q["query"], count=5)
            for item in items:
                title = item["title"]
                description = item["description"]
                link = item["link"]
                pub_date = _parse_rss_date(item["pubDate"])
                source_name = item["source_name"]
                slug = _make_slug(title, str(pub_date))

                # Skip duplicates
                existing = db.query(NewsArticle).filter(NewsArticle.seo_slug == slug).first()
                if existing:
                    continue

                commentary = generate_commentary(
                    title, description or title, q["category"]
                )
                article = NewsArticle(
                    title=title,
                    summary=description or title,
                    content=description or title,
                    category=q["category"],
                    source=link,
                    source_name=source_name,
                    seo_slug=slug,
                    commentary=commentary,
                    published_at=pub_date,
                )
                db.add(article)
                try:
                    db.flush()
                    count += 1
                except Exception:
                    db.rollback()
        except Exception as e:
            logger.error(f"News crawl error for '{q['query']}': {e}")
            continue

    if count > 0:
        db.commit()
    logger.info(f"News crawl complete: {count} new articles")
    return count


async def crawl_analysis(db: Session) -> int:
    """Crawl analysis/forecast articles and store in DB."""
    count = 0
    for q in ANALYSIS_QUERIES:
        try:
            items = await _fetch_google_news_rss(q["query"], count=5)
            for item in items:
                title = item["title"]
                description = item["description"]
                link = item["link"]
                pub_date = _parse_rss_date(item["pubDate"])
                source_name = item["source_name"]
                slug = _make_slug(title, str(pub_date))

                existing = db.query(AnalysisArticle).filter(AnalysisArticle.seo_slug == slug).first()
                if existing:
                    continue

                article = AnalysisArticle(
                    title=title,
                    summary=description or title,
                    content=description or title,
                    category=q["category"],
                    source=link,
                    source_name=source_name,
                    seo_slug=slug,
                    published_at=pub_date,
                )
                db.add(article)
                try:
                    db.flush()
                    count += 1
                except Exception:
                    db.rollback()
        except Exception as e:
            logger.error(f"Analysis crawl error for '{q['query']}': {e}")
            continue

    if count > 0:
        db.commit()
    logger.info(f"Analysis crawl complete: {count} new articles")
    return count


def cleanup_old_articles(db: Session, max_age_days: int = 365) -> dict:
    """Delete news and analysis articles older than max_age_days (default 1 year)."""
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=max_age_days)

    news_deleted = db.query(NewsArticle).filter(NewsArticle.published_at < cutoff).delete()
    analysis_deleted = db.query(AnalysisArticle).filter(AnalysisArticle.published_at < cutoff).delete()
    db.commit()

    logger.info(f"Article cleanup: deleted {news_deleted} news, {analysis_deleted} analysis (older than {max_age_days} days)")
    return {"news_deleted": news_deleted, "analysis_deleted": analysis_deleted}


async def crawl_all(db: Session) -> dict:
    """Run all crawlers. Returns counts."""
    news_count = await crawl_news(db)
    analysis_count = await crawl_analysis(db)
    return {"news": news_count, "analysis": analysis_count}
