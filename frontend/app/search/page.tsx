"use client";

import { NewsArticle } from "@/app/page";
import React, { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

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

const SearchResultsPage: React.FC = () => {
	const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [searchKeyword, setSearchKeyword] = useState<string>("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedResult, setSelectedResult] = useState<NewsArticle | null>(
		null
	);

	useEffect(() => {
		const fetchSearchResults = async () => {
			const urlParams = new URLSearchParams(window.location.search);
			const keyword = urlParams.get("keyword");

			if (!keyword) {
				setError("No search keyword provided");
				setLoading(false);
				return;
			}

			setSearchKeyword(keyword);

			try {
				const response = await fetch("http://127.0.0.1:5000/search", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ keyword }),
				});

				if (!response.ok) {
					throw new Error("Search request failed");
				}

				const data = await response.json();

				// Predict bias for each article
				const articlesWithBias = await Promise.all(
					data.map(async (article: NewsArticle) => {
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

				setSearchResults(articlesWithBias);
				setLoading(false);
			} catch (err) {
				setError("Failed to fetch search results");
				setLoading(false);
				console.error(err);
			}
		};

		fetchSearchResults();
	}, []);

	const handleResultClick = (result: NewsArticle) => {
		setSelectedResult(result);
		setIsDialogOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex items-center mb-4">
					<button
						onClick={() => window.history.back()}
						className="mr-4 text-gray-600 hover:text-gray-900"
					>
						<ChevronLeft size={24} />
					</button>
					<h1 className="text-2xl font-bold">
						Search Results for "{searchKeyword}"
					</h1>
				</div>

				{loading ? (
					<div className="text-center text-gray-600 py-8">Loading...</div>
				) : error ? (
					<div className="text-center text-red-600 py-8">{error}</div>
				) : searchResults.length === 0 ? (
					<div className="text-center text-gray-600 py-8">
						No results found. Try a different search term.
					</div>
				) : (
					<div className="grid gap-6 max-w-5xl mx-auto">
						{searchResults.map((result, index) => (
							<div
								key={`${result.title}-${index}`}
								className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
								onClick={() => handleResultClick(result)}
							>
								<div className="flex justify-between items-start">
									<h2 className="text-xl font-semibold text-blue-800 hover:underline mb-2">
										{result.title}
									</h2>
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${getBiasColor(
											result.bias || "unknown"
										)}`}
									>
										{(result.bias || "unknown").toUpperCase()}
									</span>
								</div>
								<p className="text-gray-600 mb-4 line-clamp-2">{result.text}</p>
								<div className="flex justify-between items-center text-sm text-gray-500">
									{result.author && <span>By {result.author}</span>}
								</div>
								{result.tags && result.tags.length > 0 && (
									<div className="mt-4 flex flex-wrap gap-2">
										{result.tags.map((tag) => (
											<span
												key={tag}
												className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
											>
												{tag}
											</span>
										))}
										{result.keywords.map((keyword) => (
											<span
												key={keyword}
												className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
											>
												{keyword}
											</span>
										))}
									</div>
								)}
							</div>
						))}
					</div>
				)}

				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
						{selectedResult && (
							<>
								<DialogHeader>
									<div className="flex justify-between items-start">
										<DialogTitle className="text-xl font-bold">
											{selectedResult.title}
										</DialogTitle>
										<span
											className={`px-3 py-1 rounded-full text-sm font-medium ${getBiasColor(
												selectedResult.bias || "unknown"
											)}`}
										>
											{(selectedResult.bias || "unknown").toUpperCase()}
										</span>
									</div>
								</DialogHeader>
								<div className="space-y-4">
									<div className="flex items-center gap-2 text-sm text-gray-500">
										<span>
											By {selectedResult.author?.join(", ") || "Unknown"}
										</span>
										{selectedResult.publish_date && (
											<span>
												•{" "}
												{new Date(
													selectedResult.publish_date
												).toLocaleDateString()}
											</span>
										)}
									</div>
									<div className="prose max-w-none">
										<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
											{selectedResult.text}
										</p>
									</div>
									{selectedResult.tags && selectedResult.tags.length > 0 && (
										<div className="pt-4 border-t">
											<h3 className="text-sm font-semibold mb-2">Tags</h3>
											<div className="flex flex-wrap gap-2">
												{selectedResult.tags.map((tag) => (
													<span
														key={tag}
														className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
													>
														{tag}
													</span>
												))}
											</div>
										</div>
									)}
								</div>
							</>
						)}
					</DialogContent>
				</Dialog>
			</main>
		</div>
	);
};

export default SearchResultsPage;
