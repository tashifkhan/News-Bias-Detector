import React, { useState } from "react";

const SearchBar = () => {
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		// Implement search functionality here
		console.log("Searching for:", searchQuery);
	};

	return (
		<form onSubmit={handleSearch} className="w-64 mx-2">
			<div className="relative">
				<input
					type="search"
					placeholder="Search..."
					value={searchQuery}
					onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
					className="w-full px-3 py-1 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-950"
				/>
				<button
					type="submit"
					className="absolute right-[-2rem] top-1/2 transform -translate-y-1/2 text-sm px-3 py-1 rounded-md border border-gray-300 bg-gray-400"
					onSubmit={handleSearch}
				>
					🔍
				</button>
			</div>
		</form>
	);
};

export default SearchBar;
