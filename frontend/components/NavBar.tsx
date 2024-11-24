"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { usePathname } from "next/navigation";

const Navbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const pathname = usePathname();

	const navigationItems = [
		{ name: "Home", href: "/" },
		{ name: "Categories", href: "/categories" },
		{ name: "Donations", href: "/domations" },
		{ name: "About Us", href: "/about" },
		{ name: "Contant Us", href: "/contact" },
	];

	return (
		<>
			{/* Navigation Bar */}
			<nav className="bg-white shadow-md">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<button
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="md:hidden p-2 text-gray-600 hover:text-gray-800"
							>
								{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
							</button>
							<Link href="/" className="text-xl font-bold text-gray-800">
								BiasDetect
							</Link>
						</div>

						<div className="hidden md:flex space-x-8">
							{navigationItems.map((item) => (
								<Link
									key={item.name}
									href={item.href}
									className={`px-3 py-2 rounded-md transition-colors duration-200 ${
										pathname === item.href
											? "bg-blue-50 text-blue-600"
											: "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
									}`}
								>
									{item.name}
								</Link>
							))}
						</div>

						<div className="flex items-center">
							<div className="relative">
								<input
									type="text"
									placeholder="Search articles..."
									className="w-64 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<Search
									className="absolute right-3 top-2.5 text-gray-400"
									size={20}
								/>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile Menu */}
			{isMenuOpen && (
				<div className="md:hidden bg-white border-b">
					<div className="px-2 pt-2 pb-3 space-y-1">
						{navigationItems.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className={`block px-3 py-2 rounded-md transition-colors duration-200 ${
									pathname === item.href
										? "bg-blue-50 text-blue-600"
										: "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
								}`}
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			)}
		</>
	);
};

export default Navbar;
