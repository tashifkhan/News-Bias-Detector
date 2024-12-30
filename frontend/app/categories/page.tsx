"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { getCachedData } from "@/hooks/hookNewsArticles";
import Link from "next/link";

const ITEMS_PER_PAGE = 9;
const LOADING_DELAY = 550;

const CATEGORY_TERMS = {
	politics: [
		"politics",
		"political",
		"gov",
		"government",
		"election",
		"policy",
		"congress",
		"senate",
	],
	technology: [
		"tech",
		"technology",
		"ai",
		"artificial intelligence",
		"software",
		"digital",
		"cyber",
	],
	economy: [
		"economy",
		"economic",
		"finance",
		"financial",
		"market",
		"trade",
		"gdp",
		"stocks",
	],
	health: [
		"health",
		"healthcare",
		"medical",
		"medicine",
		"wellness",
		"disease",
		"hospital",
	],
};

interface NewsArticle {
	link: string;
	title: string;
	text: string;
	author: string[];
	publish_date: string | null;
	keywords: string[];
	tags: string[];
	bias?: string;
	thumbnail?: string;
}

const ArticleSkeleton = () => (
	<Card className="animate-pulse">
		<CardHeader>
			<div className="flex justify-between items-start">
				<div className="h-6 bg-gray-200 rounded w-3/4"></div>
				<div className="h-6 bg-gray-200 rounded w-16"></div>
			</div>
		</CardHeader>
		<CardContent>
			<div className="space-y-3">
				<div className="h-4 bg-gray-200 rounded w-full"></div>
				<div className="h-4 bg-gray-200 rounded w-full"></div>
				<div className="h-4 bg-gray-200 rounded w-3/4"></div>
			</div>
			<div className="flex justify-between items-center mt-4">
				<div className="h-4 bg-gray-200 rounded w-1/3"></div>
			</div>
		</CardContent>
	</Card>
);

const CategoriesPage = () => {
	const [articles, setArticles] = useState<NewsArticle[]>([]);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const loader = useRef(null);
	const categories = ["politics", "technology", "economy", "health"];

	const getBiasColor = (bias?: string) => {
		switch (bias) {
			case "left":
				return "bg-blue-100 text-blue-800";
			case "right":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const matchesCategory = useCallback(
		(article: NewsArticle, category: string): boolean => {
			if (category === "all") return true;

			const searchText = [
				article.title,
				article.text?.slice(0, 200),
				...(article.tags || []),
				...(article.keywords || []),
			]
				.join(" ")
				.toLowerCase();

			const terms =
				CATEGORY_TERMS[category as keyof typeof CATEGORY_TERMS] || [];
			return terms.some((term) => searchText.includes(term));
		},
		[]
	);

	const predictBias = async (article: Pick<NewsArticle, "title" | "text">) => {
		try {
			const { data } = await axios.post(
				"http://127.0.0.1:5000/predict",
				article
			);
			return data.bias[0] === 0 ? "left" : "right";
		} catch (error) {
			console.error("Error predicting bias:", error);
			return "unknown";
		}
	};

	const loadArticles = useCallback(async () => {
		if (loading) return;
		setLoading(true);

		try {
			const data = await getCachedData();
			const filteredData = data.filter((article: NewsArticle) =>
				matchesCategory(article, selectedCategory)
			);
			const startIndex = (page - 1) * ITEMS_PER_PAGE;
			const endIndex = startIndex + ITEMS_PER_PAGE;
			const slice = filteredData.slice(startIndex, endIndex);

			if (slice.length === 0) {
				setHasMore(false);
				return;
			}

			const articlesWithBias = await Promise.all(
				slice.map(async (article: Pick<NewsArticle, "title" | "text">) => ({
					...article,
					bias: await predictBias(article),
				}))
			);

			setArticles((prev) => [...prev, ...articlesWithBias]);
			setPage((prev) => prev + 1);
			setHasMore(endIndex < filteredData.length);
		} catch (error) {
			console.error("Error loading articles:", error);
		} finally {
			setLoading(false);
		}
	}, [page, selectedCategory, loading, matchesCategory]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					loadArticles();
				}
			},
			{ rootMargin: "20px", threshold: 1.0 }
		);

		if (loader.current) {
			observer.observe(loader.current);
		}

		return () => {
			if (loader.current) {
				observer.unobserve(loader.current);
			}
		};
	}, [loadArticles, hasMore, loading]);

	const handleCategoryChange = useCallback((category: string) => {
		setSelectedCategory(category);
		setPage(1);
		setArticles([]);
		setHasMore(true);
	}, []);

	useEffect(() => {
		if (articles.length === 0 && hasMore) {
			loadArticles();
		}
	}, [articles.length, hasMore, loadArticles]);

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-blue-900 mb-4 text-center py-4">
					News Categories
				</h1>

				<div className="flex gap-4 mb-8 overflow-x-auto pb-2">
					{categories.map((category) => (
						<button
							key={category}
							onClick={() => handleCategoryChange(category)}
							className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap
                ${
									selectedCategory === category
										? "bg-blue-800 text-white"
										: "bg-white text-gray-600 hover:bg-gray-100"
								}`}
						>
							{category.charAt(0).toUpperCase() + category.slice(1)}
						</button>
					))}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{articles.map((article, index) => (
						<Card
							key={`${article.title}-${index}`}
							className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
							onClick={() => {
								setSelectedArticle(article);
								setIsDialogOpen(true);
							}}
						>
							{article.thumbnail && (
								<div className="w-full h-48 relative">
									<img
										src={article.thumbnail}
										alt={article.title}
										className="w-full h-full object-cover rounded-t-xl"
									/>
								</div>
							)}
							<CardHeader>
								<div className="flex justify-between items-start">
									<CardTitle className="text-lg font-semibold">
										<span className="text-blue-900 hover:underline">
											{article.title}
										</span>
									</CardTitle>
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${getBiasColor(
											article.bias
										)}`}
									>
										{(article.bias || "unknown").toUpperCase()}
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<p className="text-gray-600 text-sm mb-4 line-clamp-3">
									{article.text || "No description available."}
								</p>
								<div className="text-sm text-gray-500">
									By {article.author?.join(", ") || "Unknown"}
								</div>
							</CardContent>
						</Card>
					))}

					{loading && [...Array(3)].map((_, i) => <ArticleSkeleton key={i} />)}
				</div>

				<div ref={loader} className="flex justify-center mt-8">
					{loading && (
						<div className="flex items-center space-x-2">
							{[0, 150, 300].map((delay) => (
								<div
									key={delay}
									className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"
									style={{ animationDelay: `${delay}ms` }}
								/>
							))}
						</div>
					)}
					{!hasMore && articles.length > 0 && (
						<div className="text-gray-500 font-medium">
							No more articles to load
						</div>
					)}
				</div>

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent
						className={`max-w-3xl ${
							(selectedArticle?.text?.length ?? 0) > 1000
								? "h-[80vh]"
								: "h-auto"
						} overflow-y-auto`}
					>
						{selectedArticle && (
							<>
								<DialogHeader>
									<div className="flex justify-between items-start">
										<DialogTitle className="text-xl font-bold">
											{selectedArticle.title}
										</DialogTitle>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${getBiasColor(
												selectedArticle.bias
											)}`}
										>
											{(selectedArticle.bias || "unknown").toUpperCase()}
										</span>
									</div>
								</DialogHeader>
								<div className="space-y-4">
									<div className="flex items-center gap-2 text-sm text-gray-500">
										<span>
											By {selectedArticle.author?.join(", ") || "Unknown"}
										</span>
										{selectedArticle.publish_date && (
											<span>
												•{" "}
												{new Date(
													selectedArticle.publish_date
												).toLocaleDateString()}
											</span>
										)}
									</div>
									<div className="prose max-w-none">
										<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
											{selectedArticle.text}
										</p>
									</div>
									{selectedArticle.keywords?.length > 0 && (
										<div className="pt-4 border-t">
											<h3 className="text-sm font-semibold mb-2">Keywords</h3>
											<div className="flex flex-wrap gap-2">
												{selectedArticle.keywords.map((keyword, index) => (
													<span
														key={index}
														className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
													>
														{keyword}
													</span>
												))}
											</div>
										</div>
									)}
									<div className="pt-4">
										<Link
											href={selectedArticle.link}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 
                        to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 
                        transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
										>
											Read Article from Source
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M14 5l7 7m0 0l-7 7m7-7H3"
												/>
											</svg>
										</Link>
									</div>
								</div>
							</>
						)}
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
};

export default CategoriesPage;
