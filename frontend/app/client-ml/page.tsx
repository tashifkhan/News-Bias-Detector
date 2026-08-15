import Link from "next/link";
import { ArrowRight, Cpu, Zap, Lock, Gauge, AlertTriangle } from "lucide-react";

export const metadata = {
	title: "Client-Side ML | BiasDetector",
	description:
		"Run the bias model entirely in your browser two ways — Pyodide + .pkl, or ONNX + onnxruntime-web.",
};

export default function ClientMlPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
			<main className="max-w-4xl mx-auto px-4 py-12">
				<header className="text-center mb-12">
					<span className="inline-block px-3 py-1 rounded-full border border-purple-200 bg-purple-100 text-purple-800 text-xs font-semibold uppercase tracking-wide mb-3">
						Client-Side Machine Learning
					</span>
					<h1 className="text-4xl font-bold mb-3">
						Bias detection, <em>in your tab</em>
					</h1>
					<p className="text-gray-600 max-w-2xl mx-auto">
						Two ways to run the same XGBoost model with zero server
						round-trips. Your text never leaves this device. Pick a path —
						the tradeoff is load time vs inference speed.
					</p>
				</header>

				<div className="grid md:grid-cols-2 gap-6">
					{/* Pyodide card */}
					<Link
						href="/pyodide-classify"
						className="group bg-white border-2 border-blue-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-400 transition-all overflow-hidden flex flex-col"
					>
						<div className="p-6 pb-4">
							<div className="flex items-center gap-2 mb-3">
								<Cpu className="text-blue-600" size={20} />
								<span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
									Pyodide + .pkl
								</span>
							</div>
							<h2 className="text-xl font-bold mb-2">Run the original pickle</h2>
							<p className="text-sm text-gray-600 mb-4">
								CPython in WebAssembly, unpickles your exact{" "}
								<code className="text-xs bg-gray-100 px-1 rounded">
									model.pkl
								</code>{" "}
								and runs the untouched sklearn pipeline — NLTK lemmatizer,
								TF-IDF, everything.
							</p>
						</div>
						<div className="mt-auto px-6 py-4 bg-blue-50 border-t border-blue-100">
							<div className="flex flex-wrap gap-2 text-xs mb-3">
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-blue-700">
									<Lock size={12} /> 100% client-side
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-blue-700">
									<Cpu size={12} /> 7.3 s cold start
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-blue-700">
									<Gauge size={12} /> ~1300 ms / prediction
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-blue-700">
									<AlertTriangle size={12} /> ~49 MB transfer
								</span>
							</div>
							<span className="inline-flex items-center gap-1 text-blue-700 font-medium text-sm group-hover:gap-2 transition-all">
								Open the Pyodide demo <ArrowRight size={16} />
							</span>
						</div>
					</Link>

					{/* ONNX card */}
					<Link
						href="/onnx-classify"
						className="group bg-white border-2 border-green-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-green-400 transition-all overflow-hidden flex flex-col"
					>
						<div className="p-6 pb-4">
							<div className="flex items-center gap-2 mb-3">
								<Zap className="text-green-600" size={20} />
								<span className="inline-block px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
									ONNX + onnxruntime-web
								</span>
							</div>
							<h2 className="text-xl font-bold mb-2">Ship a compact graph</h2>
							<p className="text-sm text-gray-600 mb-4">
								XGBoost exported to a 92 KB{" "}
								<code className="text-xs bg-gray-100 px-1 rounded">
									model.onnx
								</code>{" "}
								graph. Preprocessing in JS, inference on WASM — no Python
								stack at all.
							</p>
						</div>
						<div className="mt-auto px-6 py-4 bg-green-50 border-t border-green-100">
							<div className="flex flex-wrap gap-2 text-xs mb-3">
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-green-700">
									<Lock size={12} /> 100% client-side
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-green-700">
									<Cpu size={12} /> 16 s first load*
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-green-700">
									<Gauge size={12} /> ~14 ms / prediction
								</span>
								<span className="flex items-center gap-1 px-2 py-1 rounded bg-white text-green-700">
									<Zap size={12} /> ~18 MB transfer
								</span>
							</div>
							<span className="inline-flex items-center gap-1 text-green-700 font-medium text-sm group-hover:gap-2 transition-all">
								Open the ONNX demo <ArrowRight size={16} />
							</span>
						</div>
					</Link>
				</div>

				<p className="text-center text-xs text-gray-400 mt-6">
					*ONNX first load includes a ~13.5 MB WASM runtime download + compile;
					subsequent loads are fast and cached. Measured on desktop Chrome.
				</p>
			</main>
		</div>
	);
}
