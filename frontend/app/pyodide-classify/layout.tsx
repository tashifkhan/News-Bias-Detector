import Script from "next/script";

export default function PyodideClassifyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{children}
			<Script
				src="https://cdn.jsdelivr.net/pyodide/v314.0.4/full/pyodide.js"
				strategy="lazyOnload"
			/>
		</>
	);
}
