"""
News scraper for the bias detector's MongoDB.

Discovery + extraction strategy (replaces the unmaintained newspaper3k):

  * discovery: RSS feeds first (fast, clean links), then sitemap search
    as a fallback for sites without a working feed.
  * extraction: trafilatura, which reliably pulls full article text,
    title, author and date from modern news sites.

Runs as a scheduled GitHub Actions cron (see .github/workflows/scrape_news.yml)
and writes straight to Mongo with dedupe + cleanup, mirroring the old
Flask-era behaviour but without a Python server in the loop.
"""

import os
import time
import json

import trafilatura
from trafilatura.sitemaps import sitemap_search
from trafilatura import extract_with_metadata

# site -> (RSS feed, sitemap/base URL). The feed is tried first.
SITES = [
    # (label, rss_feed_or_None, homepage_or_sitemap_base)
    ("ndtv", "https://feeds.feedburner.com/ndtvnews-top-stories", "https://www.ndtv.com/"),
    ("thequint", None, "https://www.thequint.com/"),
    ("hindustantimes", None, "https://www.hindustantimes.com/"),
    ("opindia", "https://www.opindia.com/feed/", "https://www.opindia.com/"),
    ("timesofindia", "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms", "https://timesofindia.indiatimes.com/"),
    ("republicworld", None, "https://www.republicworld.com/"),
]

PER_SITE_LIMIT = 20  # max articles to fetch+extract per site per run
MAX_SITEMAP_URLS = 60  # how many candidate URLs to pull from a sitemap


def _discover_links(site):
    """Return (title, url) pairs for a site using RSS then sitemap."""
    label, rss_url, base = site
    links = []

    if rss_url:
        try:
            import feedparser

            feed = feedparser.parse(rss_url)
            for e in feed.entries:
                url = e.get("link")
                if url:
                    links.append((e.get("title", ""), url))
            print(f"[{label}] rss: {len(links)} links")
            if links:
                return links
        except Exception as ex:
            print(f"[{label}] rss failed ({type(ex).__name__}), falling back to sitemap")

    try:
        urls = sitemap_search(base, target_lang="en") or []
        print(f"[{label}] sitemap: {len(urls)} links")
        return [("", u) for u in urls[:MAX_SITEMAP_URLS]]
    except Exception as ex:
        print(f"[{label}] sitemap failed ({type(ex).__name__})")
        return []


def scrape(websites: list = None, count: int = 20) -> list:
    """Fetch + extract articles for each site. Returns list of article dicts.

    `websites` is accepted for backwards compatibility with the old signature
    but discovery now uses the SITES table above.
    """
    articles = []
    sites = websites if websites else [s[2] for s in SITES]

    for site in SITES:
        label, _, base = site
        if sites and base not in sites and label not in [str(s) for s in sites]:
            continue

        links = _discover_links(site)
        fetched = 0
        for title_hint, url in links:
            if fetched >= count or fetched >= PER_SITE_LIMIT:
                break
            try:
                html = trafilatura.fetch_url(url)
                if not html:
                    continue
                meta = extract_with_metadata(
                    html,
                    include_comments=False,
                    include_tables=False,
                    favor_precision=True,
                )
                if not meta or not meta.text or len(meta.text) < 200:
                    continue

                title = (meta.title or title_hint or "").strip()
                if not title:
                    continue

                articles.append(
                    {
                        "link": url,
                        "title": title,
                        "text": meta.text,
                        "author": [meta.author] if meta.author else [],
                        "publish_date": meta.date if meta.date else None,
                        "keywords": meta.tags or [],
                        "tags": list(meta.categories or []) if meta.categories else [],
                        "thumbnail": meta.image if meta.image else None,
                    }
                )
                fetched += 1
                print(f"[{label}] extracted {len(meta.text)} chars: {url[:80]}")
                time.sleep(0.3)  # be polite
            except Exception as ex:
                print(f"[{label}] failed {type(ex).__name__}: {url[:70]}")

    print(f"**Finished Parsing**\nTotal Articles - {len(articles)}")
    return articles


def save_to_json(data, output_file):
    """Prepend data to an existing JSON file (legacy helper)."""
    try:
        if os.path.exists(output_file):
            with open(output_file, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        else:
            existing_data = []

        combined_data = data + existing_data
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(combined_data, f, ensure_ascii=False, indent=4)
        print(f"Data saved to {output_file}")
    except Exception as e:
        print(f"Failed to save data to JSON. Error: {e}")


def _insert_and_clean(collection, valid_results):
    """Insert articles with dedupe + cleanup, mirroring the old backend."""
    from pymongo.errors import BulkWriteError

    added_count = 0
    duplicate_count = 0

    try:
        result = collection.insert_many(valid_results, ordered=False)
        added_count = len(result.inserted_ids)
        duplicate_count = len(valid_results) - added_count
    except BulkWriteError as bwe:
        write_errors = bwe.details.get("writeErrors", [])
        added_count = len(valid_results) - len(write_errors)
        duplicate_count = len(write_errors)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return 0, len(valid_results)

    unwanted_texts = [
        "",
        "Get App for Better Experience",
        "Log onto movie.ndtv.com for more celebrity pictures",
        "No description available.",
    ]
    collection.delete_many(
        {"title": {"$exists": True, "$regex": "^(?i)(dell|hp|acer|lenovo)"}}
    )
    collection.delete_many({"text": {"$in": unwanted_texts}})

    total_count = collection.count_documents({})
    if total_count > 1500:
        excess_docs = total_count - 1500
        oldest_docs = (
            collection.find({}, {"_id": 1}).sort("published_date", 1).limit(excess_docs)
        )
        doc_ids = [doc["_id"] for doc in oldest_docs]
        if doc_ids:
            collection.delete_many({"_id": {"$in": doc_ids}})

    return added_count, duplicate_count


def main():
    import dotenv
    from pymongo import MongoClient

    dotenv.load_dotenv()
    mongodb_url = str(os.getenv("MONGO_DB_URI")) + "&ssl_cert_reqs=CERT_NONE"
    client = MongoClient(mongodb_url, serverSelectionTimeoutMS=30000)
    db = client["NewsBiasApp"]
    collection = db["NewsArtciles"]

    # unique index on link so re-runs dedupe instead of duplicating
    try:
        collection.create_index([("link", 1)], unique=True)
    except Exception as e:
        print(f"index note: {e}")

    results = scrape(count=PER_SITE_LIMIT)
    valid_results = [r for r in results if r.get("title") and r.get("text")]

    if not valid_results:
        print("No valid results to insert")
        return

    added, dupes = _insert_and_clean(collection, valid_results)
    print(
        f"Scraping completed! Added articles: {added}, "
        f"Duplicates skipped: {dupes}, Total in DB: {collection.count_documents({})}"
    )


if __name__ == "__main__":
    main()
