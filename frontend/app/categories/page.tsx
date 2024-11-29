"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

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

interface NewsArticle {
	id: string;
	title: string;
	category: string;
	content: string;
	date: string;
}

const CategoriesPage = () => {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [loading, setLoading] = useState(false);
	const [articles, setArticles] = useState<NewsArticle[]>([]);
	const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
	const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(
		null
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const categories = ["all", "politics", "technology", "economy", "health"];

	useEffect(() => {
		const fetchArticles = async () => {
			setLoading(true);
			try {
				const response = await axios.get("http://127.0.0.1:5000/cache");
				setArticles(response.data);
				setFilteredArticles(response.data);
			} catch (error) {
				console.error("Error fetching articles:", error);
				// Fallback to mock data
				const mockData: NewsArticle[] = [
					{
						id: "1",
						title: "Mock Article 1",
						category: "politics",
						content: "This is a mock article about politics.",
						date: "2023-01-01",
					},
					{
						id: "2",
						title: "Mock Article 2",
						category: "technology",
						content: "This is a mock article about technology.",
						date: "2023-01-02",
					},
					// Add more mock articles as needed
				];
				setArticles(mockData);
				setFilteredArticles(mockData);
			} finally {
				setLoading(false);
			}
		};

		fetchArticles();
	}, []);

	useEffect(() => {
		setFilteredArticles(
			selectedCategory === "all"
				? articles
				: articles.filter((article) => article.category === selectedCategory)
		);
	}, [selectedCategory, articles]);

	const handleArticleClick = (article: NewsArticle) => {
		setSelectedArticle(article);
		setIsDialogOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-7xl mx-auto px-4 py-8">
				<h1 className="text-3xl font-bold text-blue-900 mb-4 text-center py-4">
					News Categories
				</h1>

				{/* Category Selection */}
				<div className="flex gap-4 mb-8">
					{categories.map((category) => (
						<button
							key={category}
							onClick={() => setSelectedCategory(category)}
							className={`px-4 py-2 rounded-lg font-medium ${
								selectedCategory === category
									? "bg-blue-800 text-white"
									: "bg-white text-gray-600 hover:bg-gray-100"
							}`}
						>
							{category.charAt(0).toUpperCase() + category.slice(1)}
						</button>
					))}
				</div>

				{/* Articles Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{loading ? (
						<>
							<ArticleSkeleton />
							<ArticleSkeleton />
							<ArticleSkeleton />
						</>
					) : (
						filteredArticles.map((article) => (
							<Card
								key={article.id}
								className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
								onClick={() => handleArticleClick(article)}
							>
								<CardHeader>
									<CardTitle className="text-lg font-semibold">
										{article.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-gray-600 text-sm mb-4 line-clamp-3">
										{article.content}
									</p>
									<div className="flex justify-between items-center text-sm text-gray-500">
										<span>{article.date}</span>
									</div>
								</CardContent>
							</Card>
						))
					)}
				</div>

				{/* Article Dialog */}
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogContent className="max-w-3xl h-auto overflow-y-auto">
						{selectedArticle && (
							<>
								<DialogHeader>
									<DialogTitle className="text-xl font-bold">
										{selectedArticle.title}
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4">
									<div className="text-sm text-gray-500">
										<span>{selectedArticle.date}</span>
									</div>
									<div className="prose max-w-none">
										<p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
											{selectedArticle.content}
										</p>
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
