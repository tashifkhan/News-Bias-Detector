"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getCachedData } from "@/hooks/hookNewsArticles";
import axios from "axios";
import Link from "next/link";

const ITEMS_PER_PAGE = 9;
const LOADING_DELAY = 550;

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

export interface NewsArticle {
	link: string;
	title: string;
	text: string;
	author: string[];
	publish_date: string | null;
	keywords: string[];
	tags: any[];
	bias?: string;
	thumbnail?: string;
}

const predictBias = async (article: {
	title: string;
	text: string;
}): Promise<string> => {
	try {
		const { data } = await axios.post("http://127.0.0.1:5000/predict", {
			title: article.title,
			text: article.text,
		});
		return data.bias[0] === 0 ? "left" : "right";
	} catch (error) {
		console.error("Error predicting bias:", error);
		return "unknown";
	}
};

const Home = () => {
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [displayedArticles, setDisplayedArticles] = useState<NewsArticle[]>([]);
	const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const loader = useRef(null);

	const getBiasColor = (bias: string): string => {
		switch (bias) {
			case "left":
				return "bg-blue-100 text-blue-800";
			case "right":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	// infinite scroll

	const loadMoreArticles = useCallback(async () => {
		setLoading(true);

		setTimeout(async () => {
			try {
				const startIndex = (page - 1) * ITEMS_PER_PAGE;
				const endIndex = startIndex + ITEMS_PER_PAGE;
				const loadedData = await getCachedData();
				const articlesSlice = loadedData.slice(startIndex, endIndex);

				// Predict bias for each article
				const articlesWithBias = await Promise.all(
					articlesSlice.map(async (article: NewsArticle) => {
						const predictedBias = await predictBias({
							title: article.title,
							text: article.text,
						});
						return {
							...article,
							bias: predictedBias,
						};
					})
				);

				if (articlesWithBias.length > 0) {
					const filteredArticles = articlesWithBias.filter(
						(article) =>
							!article.link.includes("https://gadgetsnow.indiatimes.com/") &&
							!article.link.includes("https://www.gadgets360.com/")
					);
					setDisplayedArticles((prev) => [...prev, ...filteredArticles]);
					setPage((prev) => prev + 1);
				}

				if (endIndex >= loadedData.length) {
					setHasMore(false);
				}
			} catch (error) {
				console.error("Error loading articles:", error);
			} finally {
				setLoading(false);
			}
		}, LOADING_DELAY);
	}, [page]);

	useEffect(() => {
		const options = {
			root: null,
			rootMargin: "20px",
			threshold: 1.0,
		};

		const observer = new IntersectionObserver((entries) => {
			const target = entries[0];
			if (target.isIntersecting && hasMore && !loading) {
				loadMoreArticles();
			}
		}, options);

		if (loader.current) {
			observer.observe(loader.current);
		}

		return () => {
			if (loader.current) {
				observer.unobserve(loader.current);
			}
		};
	}, [loadMoreArticles, hasMore, loading]);

	// end scroll

	useEffect(() => {
		loadMoreArticles();
	}, []);

	const handleArticleClick = (article: NewsArticle) => {
		setSelectedArticle(article);
		setIsDialogOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto px-4 py-8">
				{/* Tabs */}
				{/* <div className="flex space-x-4 mb-8">
					{["trending", "latest", "analyzed"].map((tab) => (
						<button
							key={tab}
							onClick={() => {
								setActiveTab(tab);
								setPage(1);
								setDisplayedArticles([]);
								setHasMore(true);
								loadMoreArticles();
							}}
							className={`px-4 py-2 rounded-lg font-medium ${
								activeTab === tab
									? "bg-blue-800 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							{tab.charAt(0).toUpperCase() + tab.slice(1)}
						</button>
					))}
				</div> */}

				{/* News Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{displayedArticles.map((article: NewsArticle, index: number) => (
						<Card
							key={`${article.title}-${index}`}
							className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
							onClick={() => handleArticleClick(article)}
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
											article.bias || "unknown"
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
								<div className="flex justify-between items-center text-sm text-gray-500">
									<span>By {article.author?.join(", ") || "Unknown"}</span>
								</div>
							</CardContent>
						</Card>
					))}

					{loading && (
						<>
							<ArticleSkeleton />
							<ArticleSkeleton />
							<ArticleSkeleton />
						</>
					)}
				</div>

				{/* Loading indicator and end message */}
				<div ref={loader} className="flex justify-center mt-8">
					{loading && (
						<div className="flex items-center space-x-2">
							<div
								className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"
								style={{ animationDelay: "0ms" }}
							></div>
							<div
								className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"
								style={{ animationDelay: "150ms" }}
							></div>
							<div
								className="w-2 h-2 bg-blue-900 rounded-full animate-bounce"
								style={{ animationDelay: "300ms" }}
							></div>
						</div>
					)}
					{!hasMore && displayedArticles.length > 0 && (
						<div className="text-gray-500 font-medium">
							No more articles to load
						</div>
					)}
				</div>

				{/* Article Dialog */}
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
									<div className="flex justify-between items-start gap-">
										<DialogTitle className="text-xl font-bold">
											{selectedArticle.title}
										</DialogTitle>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${getBiasColor(
												selectedArticle.bias || "unknown"
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
									<div>
										{selectedArticle.keywords?.length > 0 && (
											<div className="pt-4 border-t">
												<h3 className="text-sm font-semibold mb-2">Keywords</h3>
												<div className="flex flex-wrap gap-2">
													{selectedArticle.keywords.map(
														(keyword: string, index: number) => (
															<span
																key={index}
																className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
															>
																{keyword}
															</span>
														)
													)}
												</div>
											</div>
										)}
										<div className="pt-4">
											<Link
												href={selectedArticle.link}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg 
												hover:from-blue-700 hover:to-blue-900 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
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
								</div>
							</>
						)}
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
};

export default Home;
