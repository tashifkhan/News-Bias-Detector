import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/NavBar";
import "./globals.css";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Media Bias Detector",
	description:
		"This website focuses on creating an AI-driven media bias detection platform  and classify news articles and outlets as left-leaning or right-leaning. Designed for the Indian media landscape, the platform integrates advanced text preprocessing techniques, ensuring high-quality data input. By analyzing text features and detecting patterns, the system achieves over 94% classification accuracy, offering real-time, scalable bias insights. This innovative tool promotes transparency, reduces misinformation, and empowers users to critically evaluate news sources, contributing to a healthier democratic discourse.",
	icons: "./icon.png",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				suppressHydrationWarning
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Navbar />
				<main className="">{children}</main>
			</body>
		</html>
	);
}
