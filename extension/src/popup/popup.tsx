import React, { useState } from "react";
import "./popup.css";
import { Copy, Settings, HelpCircle } from "lucide-react";

const Popup = () => {
	const [extractionMethod, setExtractionMethod] = useState("default");
	const [customSelectors, setCustomSelectors] = useState("");

	const extractionMethods = [
		{ value: "default", label: "Automatic Detection" },
		{ value: "custom", label: "Custom Selectors" },
		{ value: "advanced", label: "Advanced Extraction" },
	];

	const handleExtract = () => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			chrome.scripting.executeScript({
				target: { tabId: tabs[0].id },
				func: (method, selectors) => {
					const strategies = {
						default: () => {
							const selectors = [
								"article",
								".article-body",
								".article__body",
								".content__body",
								"#article-body",
								".post-content",
								"main",
								".main-content",
								".entry-content",
								'[data-cy="article-body"]',
							];

							for (let selector of selectors) {
								const element = document.querySelector(selector);
								if (element) return (element as HTMLElement).innerText;
							}
							return null;
						},
						custom: () => {
							const selectors = customSelectors.split(",").map((s) => s.trim());
							for (let selector of selectors) {
								const element = document.querySelector(selector);
								if (element) return (element as HTMLElement).innerText;
							}
							return null;
						},
						advanced: () => {
							const paragraphs = document.getElementsByTagName("p");
							const textContents = Array.from(paragraphs)
								.map((p) => p.textContent)
								.filter((text) => text.length > 50);

							return textContents.join("\n\n");
						},
					};
					const extractionStrategy = strategies[method] || strategies.default;
					const extractedText = extractionStrategy();

					if (extractedText) {
						navigator.clipboard
							.writeText(extractedText)
							.then(() => {
								alert("Article body copied to clipboard!");
							})
							.catch((err) => {
								console.error("Failed to copy text: ", err);
							});
					} else {
						alert("Could not extract article body.");
					}
				},
				args: [extractionMethod, customSelectors],
			});
		});
	};

	return (
		<div className="w-80 p-4 bg-white shadow-md rounded-lg">
			<h2 className="text-xl font-bold mb-4 flex items-center">
				Article Extractor
				<HelpCircle className="ml-2 text-gray-500" size={16} />
			</h2>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700">
					Extraction Method
				</label>
				<select
					value={extractionMethod}
					onChange={(e) => setExtractionMethod(e.target.value)}
					className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
				>
					{extractionMethods.map((method) => (
						<option key={method.value} value={method.value}>
							{method.label}
						</option>
					))}
				</select>
			</div>

			{extractionMethod === "custom" && (
				<div className="mb-4">
					<label className="block text-sm font-medium text-gray-700">
						Custom CSS Selectors
					</label>
					<input
						type="text"
						value={customSelectors}
						onChange={(e) => setCustomSelectors(e.target.value)}
						placeholder=".article-body, #content"
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
					/>
				</div>
			)}

			<button
				onClick={handleExtract}
				className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 flex items-center justify-center"
			>
				<Copy className="mr-2" size={16} />
				Extract Article
			</button>

			<div className="mt-4 text-xs text-gray-500">
				{extractionMethod === "default" && (
					<p>Uses intelligent detection to find article body.</p>
				)}
				{extractionMethod === "custom" && (
					<p>Specify custom CSS selectors for precise extraction.</p>
				)}
				{extractionMethod === "advanced" && (
					<p>Uses advanced text analysis techniques.</p>
				)}
			</div>
		</div>
	);
};

export default Popup;
