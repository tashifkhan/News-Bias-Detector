"use client";
import React from "react";

export default function ClassifyShell({
	title,
	badge,
	accent = "blue",
	description,
	children,
}: {
	title: string;
	badge: string;
	accent?: "blue" | "green";
	description: string;
	children: React.ReactNode;
}) {
	const badgeStyles =
		accent === "blue"
			? "bg-blue-100 text-blue-800 border-blue-200"
			: "bg-green-100 text-green-800 border-green-200";

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<main className="max-w-3xl mx-auto px-4 py-10">
				<header className="mb-8">
					<span
						className={`inline-block px-3 py-1 rounded-full border text-xs font-semibold uppercase tracking-wide mb-3 ${badgeStyles}`}
					>
						{badge}
					</span>
					<h1 className="text-3xl font-bold mb-2">{title}</h1>
					<p className="text-gray-600">{description}</p>
				</header>
				{children}
			</main>
		</div>
	);
}
