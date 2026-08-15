const websites = [
    "https://www.ndtv.com/",
    "https://www.thequint.com/",
    "https://www.hindustantimes.com/",
    "https://www.opindia.com/",
    "https://timesofindia.indiatimes.com/",
    "https://www.republicworld.com/",
]

const nextBackend = "/api/"

const getCachedData = async () => {
    const response = await fetch(
        `${nextBackend}cache`,
    );
    return response.json();
};

/** Paginated, trimmed feed for the home page (bias computed client-side). */
const getFeed = async (page = 1, limit = 9) => {
    const response = await fetch(
        `${nextBackend}feed?page=${page}&limit=${limit}`,
    );
    return response.json();
};

/**
 * No Python/Flask backend anymore — the scraper runs as a scheduled
 * GitHub Actions cron (see .github/workflows/scrape_news.yml). Calling this
 * dispatches the workflow manually so the user can trigger a refresh on
 * demand without a Python server in the loop.
 */
const getNewsArticles = async () => {
    const response = await fetch(`${nextBackend}refresh`, {
        method: "POST",
    });
    return response.json();
};

export { getNewsArticles, getCachedData, getFeed, nextBackend, websites }