import { NextResponse } from "next/server";

const OWNER = "tashifkhan";
const REPO = "News-Bias-Detector";
const WORKFLOW = "scrape_news.yml";

/**
 * Dispatches the GitHub Actions scraper workflow on demand.
 *
 * There is no Python/Flask backend anymore — scraping runs as a scheduled
 * cron in GitHub Actions (see .github/workflows/scrape_news.yml). This route
 * is the "Refresh DB" button's trigger: it fires `workflow_dispatch` so the
 * scraper runs now instead of waiting for the 03:30 UTC cron.
 */
export async function POST() {
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		return NextResponse.json(
			{ error: "GITHUB_TOKEN not configured" },
			{ status: 500 }
		);
	}

	const res = await fetch(
		`https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/vnd.github+json",
				"Content-Type": "application/json",
				"User-Agent": "news-bias-detector",
			},
			body: JSON.stringify({ ref: "main" }),
		}
	);

	if (!res.ok) {
		return NextResponse.json(
			{ error: `GitHub dispatch failed: ${res.status}` },
			{ status: res.status }
		);
	}

	return NextResponse.json({ message: "Scraper workflow dispatched" });
}
