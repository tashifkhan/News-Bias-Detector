"use client";
import * as ort from "onnxruntime-web";

// Serve the WASM runtime from our own static /ort-wasm/ path.
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

export async function loadOnnxModel(): Promise<LoadedModel> {
	if (modelPromise) return modelPromise;

	modelPromise = (async () => {
		try {
			const [metaRes, onnxRes] = await Promise.all([
				fetch("/models/model_meta.json"),
				fetch("/models/model.onnx"),
			]);
			if (!metaRes.ok) throw new Error("failed to fetch model_meta.json");
			if (!onnxRes.ok) throw new Error("failed to fetch model.onnx");

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
		} catch (err) {
			// Reset so a transient failure (e.g. WASM still warm on first load)
			// doesn't poison the cached promise for every later call.
			modelPromise = null;
			throw err;
		}
	})();

	return modelPromise;
}

/**
 * Reproduce backend/src/utils.py TextPreprocessor + sklearn TfidfVectorizer:
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

	const tokenRe = /[a-zA-Z0-9-]{2,}/g;
	for (const w of cleaned) {
		for (const tok of w.match(tokenRe) || []) {
			const idx = vocabIndex.get(tok);
			if (idx !== undefined) vec[idx] += 1;
		}
	}

	for (let i = 0; i < meta.n_features; i++) vec[i] *= meta.idf[i];

	if (meta.norm === "l2") {
		let sum = 0;
		for (let i = 0; i < meta.n_features; i++) sum += vec[i] * vec[i];
		const n = Math.sqrt(sum);
		if (n > 0) for (let i = 0; i < meta.n_features; i++) vec[i] /= n;
	}

	return vec;
}

/**
 * Classify one (title + text) pair entirely client-side.
 * Returns "left" | "right". label is an int64 tensor (BigInt64Array), so
 * Number() is required before comparing with 0.
 */
export async function classifyText(text: string): Promise<"left" | "right"> {
	const m = await loadOnnxModel();
	const features = buildFeatures(text, m);

	const inputName = m.session.inputNames[0];
	const tensor = new ort.Tensor("float32", features, [1, m.meta.n_features]);
	const results = await m.session.run({ [inputName]: tensor });

	const label = results[m.session.outputNames[0]].data[0];
	return Number(label) === 0 ? "left" : "right";
}

/** Convenience wrapper matching the old predictBias(title, text) signature. */
export async function predictBias(article: {
	title: string;
	text: string;
}): Promise<string> {
	try {
		return await classifyText(`${article.title} ${article.text}`);
	} catch (error) {
		console.error("Error predicting bias:", error);
		return "unknown";
	}
}

export async function preloadOnnxModel(): Promise<void> {
	try {
		await loadOnnxModel();
	} catch {
		// non-fatal: pages will retry on first classify
	}
}
