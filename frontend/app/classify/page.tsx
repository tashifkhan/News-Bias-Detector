"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import * as ort from "onnxruntime-web";

// Serve the WASM runtime from our own static /ort-wasm/ path (Next.js copies
// node_modules assets there via next.config). This avoids CDN/CORS surprises.
ort.env.wasm.wasmPaths = "/ort-wasm/";

type Meta = {
	vocab: string[];
	idf: number[];
	norm: string;
	lemma: Record<string, string>;
	n_features: number;
	accuracy: number;
	stopwords: string[];
};

type LoadedModel = {
	meta: Meta;
	session: ort.InferenceSession;
	stopwordSet: Set<string>;
	vocabIndex: Map<string, number>;
};

let modelPromise: Promise<LoadedModel> | null = null;

async function loadModel(): Promise<LoadedModel> {
	if (modelPromise) return modelPromise;

	modelPromise = (async () => {
		const [metaRes, onnxRes] = await Promise.all([
			fetch("/models/model_meta.json"),
			fetch("/models/model.onnx"),
		]);
		if (!metaRes.ok || !onnxRes.ok) {
			throw new Error("failed to fetch model assets");
		}
		const meta: Meta = await metaRes.json();
		const session = await ort.InferenceSession.create(
			await onnxRes.arrayBuffer(),
			{ executionProviders: ["wasm"] }
		);
		return {
			meta,
			session,
			stopwordSet: new Set(meta.stopwords),
			vocabIndex: new Map(meta.vocab.map((w, i) => [w, i])),
		};
	})();

	return modelPromise;
}

/**
 * Reproduce backend/src/utils.py TextPreprocessor + sklearn TfidfVectorizer.
 * 1. lowercase -> strip non [a-zA-Z0-9\s-] -> drop stopwords -> lemmatize
 * 2. tokenize with sklearn's token_pattern (?u)\b\w\w+\b
 * 3. count -> * idf -> L2 normalize
 */
function buildFeatures(text: string, m: LoadedModel): Float32Array {
	const { meta, stopwordSet, vocabIndex } = m;
	const vec = new Float32Array(meta.n_features);

	const cleaned = text
		.toLowerCase()
		.replace(/[^a-zA-Z0-9\s-]/g, "")
		.split(/\s+/)
		.filter((w) => w.length > 0 && !stopwordSet.has(w))
		.map((w) => meta.lemma[w] ?? w);

	// sklearn token_pattern (?u)\b\w\w+\b  (words of 2+ word chars)
	const tokenRe = /[a-zA-Z0-9-]{2,}/g;
	for (const w of cleaned) {
		for (const tok of w.match(tokenRe) || []) {
			const idx = vocabIndex.get(tok);
			if (idx !== undefined) vec[idx] += 1;
		}
	}

	for (let i = 0; i < meta.n_features; i++) {
		vec[i] *= meta.idf[i];
	}

	if (meta.norm === "l2") {
		let sum = 0;
		for (let i = 0; i < meta.n_features; i++) sum += vec[i] * vec[i];
		const n = Math.sqrt(sum);
		if (n > 0) for (let i = 0; i < meta.n_features; i++) vec[i] /= n;
	}

	return vec;
}

async function classify(text: string): Promise<string> {
	const m = await loadModel();
	const features = buildFeatures(text, m);

	const inputName = m.session.inputNames[0];
	const tensor = new ort.Tensor("float32", features, [1, m.meta.n_features]);
	const results = await m.session.run({ [inputName]: tensor });

	const out = results[m.session.outputNames[0]];
	const label = out.data[0];
	return label === 0 ? "left" : "right";
}

type LoadStatus =
	| { state: "idle" }
	| { state: "loading"; stage: string }
	| { state: "ready"; runtimeMs: number; accuracy: number }
	| { state: "error"; message: string };

export default function ClassifyPage() {
	const [text, setText] = useState("");
	const [status, setStatus] = useState<LoadStatus>({ state: "idle" });
	const [result, setResult] = useState<{ label: string; ms: number } | null>(
		null
	);
	const [classifying, setClassifying] = useState(false);
	const mounted = useRef(true);

	useEffect(() => {
		return () => {
			mounted.current = false;
		};
	}, []);

	const handleWarm = useCallback(async () => {
		setStatus({ state: "loading", stage: "downloading model.onnx + vocab" });
		const t0 = performance.now();
		try {
			const m = await loadModel();
			const ms = performance.now() - t0;
			if (mounted.current)
				setStatus({
					state: "ready",
					runtimeMs: ms,
					accuracy: m.meta.accuracy,
				});
		} catch (e: unknown) {
			if (mounted.current)
				setStatus({
					state: "error",
					message: String((e as Error)?.message || e),
				});
		}
	}, []);

	const handlePredict = async () => {
		if (!text.trim() || classifying) return;
		setClassifying(true);
		setResult(null);
		try {
			const t0 = performance.now();
			const label = await classify(text.trim());
			const ms = performance.now() - t0;
			if (mounted.current) setResult({ label, ms });
		} catch (e: unknown) {
			if (mounted.current)
				setStatus({
					state: "error",
					message: String((e as Error)?.message || e),
				});
		} finally {
			setClassifying(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-3xl mx-auto px-4 py-10">
				<h1 className="text-3xl font-bold mb-2">
					Client-Side Bias Detection{" "}
					<span className="text-green-700">(ONNX + onnxruntime-web)</span>
				</h1>
				<p className="text-gray-600 mb-6">
					The XGBoost classifier runs in your browser as a compact ONNX graph
					— text preprocessing happens in JS, inference via onnxruntime-web
					(WASM). This is the <em>ONNX path</em>.
				</p>

				<textarea
					className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
					placeholder="Paste a news headline or article text here…"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>

				<div className="mt-4 flex gap-3">
					<button
						onClick={handleWarm}
						disabled={classifying || status.state === "loading"}
						className="px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-50"
					>
						Load Model
					</button>
					<button
						onClick={handlePredict}
						disabled={classifying || !text.trim()}
						className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg font-medium disabled:opacity-50 hover:from-green-700 hover:to-green-900"
					>
						{classifying ? "Classifying…" : "Detect Bias"}
					</button>
				</div>

				{status.state === "loading" && (
					<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-blue-800 font-medium">{status.stage}…</p>
						<div className="mt-2 h-2 bg-blue-200 rounded overflow-hidden">
							<div className="h-full w-3/4 bg-blue-600 rounded animate-pulse" />
						</div>
					</div>
				)}
				{status.state === "error" && (
					<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-800">{status.message}</p>
					</div>
				)}
				{status.state === "ready" && (
					<div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
						Model ready — load took {Math.round(status.runtimeMs)} ms.
						Test accuracy {Math.round(status.accuracy * 100)}%.
						Cached for this page session.
					</div>
				)}

				{result && (
					<div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 mb-1">Prediction</p>
						<p className="text-3xl font-bold">
							{result.label === "left" ? "LEFT" : "RIGHT"}
						</p>
						<p className="text-sm text-gray-500 mt-2">
							inference took {result.ms.toFixed(0)} ms
						</p>
					</div>
				)}
			</main>
		</div>
	);
}
