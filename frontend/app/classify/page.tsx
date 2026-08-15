"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";

type PyodideInterface = {
	loadPackage: (pkgs: string[]) => Promise<void>;
	runPythonAsync: (code: string) => Promise<unknown>;
	globals: {
		get: (name: string) => unknown;
	};
};

declare global {
	interface Window {
		loadPyodide?: (opts?: Record<string, unknown>) => Promise<PyodideInterface>;
	}
}

type LoadStatus =
	| { state: "idle" }
	| { state: "loading"; stage: string }
	| { state: "ready"; runtimeMs: number }
	| { state: "error"; message: string };

let pyodidePromise: Promise<PyodideInterface> | null = null;
let modelCache: {
	preprocess: unknown;
	model: unknown;
} | null = null;
let stageSink: ((s: string) => void) | null = null;

async function initPyodide(): Promise<PyodideInterface> {
	if (typeof window.loadPyodide !== "function") {
		throw new Error(
			"Pyodide not loaded — check the CDN script tag in the page head."
		);
	}
	stage("loading pyodide runtime (CPython → WASM)");
	const pyodide = await window.loadPyodide();

	stage("installing scikit-learn, xgboost, nltk, pandas");
	await pyodide.loadPackage(["scikit-learn", "xgboost", "nltk", "pandas"]);

	await pyodide.runPythonAsync(`
import pickle, io

async def _fetch_bytes(url):
    from pyodide.http import pyfetch
    resp = await pyfetch(url)
    if resp.status != 200:
        raise RuntimeError(f"fetch failed: {resp.status} {url}")
    return (await resp.bytes())
`);

	stage("mounting nltk corpora (wordnet + stopwords)");
	await pyodide.runPythonAsync(`
import nltk, os, zipfile
from pathlib import Path

os.makedirs("/nltk_data/corpora", exist_ok=True)
for name in ["stopwords.zip", "wordnet.zip"]:
    p = Path("/nltk_data/corpora") / name
    if not p.exists():
        p.write_bytes(await _fetch_bytes("/nltk_data/corpora/" + name))
nltk.data.path.insert(0, "/nltk_data")
# force the english stopword list + lemmatizer to resolve now
from nltk.corpus import stopwords
stopwords.words("english")
`);
	return pyodide;
}

async function loadModel() {
	if (modelCache) return modelCache;

	const pyodide = await (pyodidePromise ||= initPyodide());

	stage("registering browser_preprocess module");
	await pyodide.runPythonAsync(`
import sys, os
from pathlib import Path

os.makedirs("/models", exist_ok=True)
if not Path("/models/browser_preprocess.py").exists():
    Path("/models/browser_preprocess.py").write_text(
        (await _fetch_bytes("/models/browser_preprocess.py")).decode("utf-8")
    )
sys.path.insert(0, "/models")
import browser_preprocess
`);

	stage("unpickling preprocess.pkl + model.pkl");
	await pyodide.runPythonAsync(`
import pickle

preprocess = pickle.loads(await _fetch_bytes("/models/preprocess.pkl"))
model = pickle.loads(await _fetch_bytes("/models/model.pkl"))
`);

	modelCache = {
		preprocess: pyodide.globals.get("preprocess"),
		model: pyodide.globals.get("model"),
	};
	return modelCache;
}

function stage(s: string) {
	stageSink?.(s);
}

async function classify(text: string): Promise<string> {
	await loadModel();
	const pyodide = await pyodidePromise!;
	await pyodide.runPythonAsync("import pandas as pd");
	const pred = await pyodide.runPythonAsync(`
features = preprocess.transform(pd.DataFrame({"text": [${JSON.stringify(text)}]}))
int(model.predict(features)[0])
`);
	return Number((pred as { toJs?: () => number }).toJs?.() ?? pred) === 0
		? "left"
		: "right";
}

export default function ClassifyPage() {
	const [text, setText] = useState("");
	const [status, setStatus] = useState<LoadStatus>({ state: "idle" });
	const [result, setResult] = useState<{ label: string; ms: number } | null>(
		null
	);
	const [classifying, setClassifying] = useState(false);
	const mounted = useRef(true);

	useEffect(() => {
		stageSink = (s) => {
			if (mounted.current) setStatus({ state: "loading", stage: s });
		};
		return () => {
			mounted.current = false;
			stageSink = null;
		};
	}, []);

	const handleWarm = useCallback(async () => {
		setStatus({ state: "loading", stage: "loading runtime for the first time" });
		const t0 = performance.now();
		try {
			await loadModel();
			const ms = performance.now() - t0;
			if (mounted.current)
				setStatus({ state: "ready", runtimeMs: ms });
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
					<span className="text-blue-700">(Pyodide)</span>
				</h1>
				<p className="text-gray-600 mb-6">
					The whole XGBoost pipeline runs in your browser via Pyodide
					(CPython in WebAssembly) — your text never leaves the device. This
					is the <em>Pyodide + .pkl</em> path.
				</p>

				<textarea
					className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
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
						Load Runtime
					</button>
					<button
						onClick={handlePredict}
						disabled={classifying || !text.trim()}
						className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium disabled:opacity-50 hover:from-blue-700 hover:to-blue-900"
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
						Runtime ready — cold start took {Math.round(status.runtimeMs)} ms.
						Cached for the rest of this page session.
					</div>
				)}

				{result && (
					<div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
						<p className="text-sm text-gray-500 mb-1">Prediction</p>
						<p className="text-3xl font-bold">
							{result.label === "left" ? "LEFT" : "RIGHT"}
						</p>
						<p className="text-sm text-gray-500 mt-2">
							inference took {result.ms.toFixed(0)} ms (warm runtime)
						</p>
					</div>
				)}
			</main>
		</div>
	);
}
