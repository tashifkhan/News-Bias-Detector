"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import ClassifyShell from "@/components/client-ml/ClassifyShell";
import StageProgress, { type StageDef } from "@/components/client-ml/StageProgress";
import { Brain, Zap, Cpu, CheckCircle2 } from "lucide-react";

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

const STAGES: StageDef[] = [
	{ key: "runtime", label: "Booting CPython in WASM", detail: "Pyodide 314 · ~9.6 MB" },
	{ key: "packages", label: "Installing scikit-learn, xgboost, nltk, pandas", detail: "~27 MB of scientific wheels from CDN" },
	{ key: "nltk", label: "Mounting WordNet + stopwords", detail: "~10 MB of NLTK corpora" },
	{ key: "modules", label: "Registering TextPreprocessor", detail: "custom class the pickle references" },
	{ key: "pickle", label: "Unpickling preprocess.pkl + model.pkl", detail: "1.6 MB · exact Pyodide version stack" },
];

async function initPyodide(): Promise<PyodideInterface> {
	if (typeof window.loadPyodide !== "function") {
		throw new Error(
			"Pyodide not loaded — check the CDN script tag in the page head."
		);
	}
	stage("runtime");
	const pyodide = await window.loadPyodide();

	stage("packages");
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

	stage("nltk");
	await pyodide.runPythonAsync(`
import nltk, os, zipfile
from pathlib import Path

os.makedirs("/nltk_data/corpora", exist_ok=True)
for name in ["stopwords.zip", "wordnet.zip"]:
    p = Path("/nltk_data/corpora") / name
    if not p.exists():
        p.write_bytes(await _fetch_bytes("/nltk_data/corpora/" + name))
nltk.data.path.insert(0, "/nltk_data")
from nltk.corpus import stopwords
stopwords.words("english")
`);
	return pyodide;
}

async function loadModel() {
	if (modelCache) return modelCache;

	const pyodide = await (pyodidePromise ||= initPyodide());

	stage("modules");
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

	stage("pickle");
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

export default function PyodideClassifyPage() {
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
		setStatus({ state: "loading", stage: "runtime" });
		const t0 = performance.now();
		try {
			await loadModel();
			const ms = performance.now() - t0;
			if (mounted.current) setStatus({ state: "ready", runtimeMs: ms });
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

	const currentStage = status.state === "loading" ? status.stage : "";
	const loadingDone = status.state === "ready";

	return (
		<ClassifyShell
			title="Client-Side Bias Detection — Pyodide"
			badge="Pyodide + .pkl"
			accent="blue"
			description="The original XGBoost pipeline runs in your browser via CPython-in-WASM. Your text never leaves the device, but it's heavy — the whole scientific stack ships to your tab."
		>
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
				<textarea
					className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
					placeholder="Paste a news headline or article text here…"
					value={text}
					onChange={(e) => setText(e.target.value)}
				/>

				<div className="mt-4 flex flex-wrap items-center gap-3">
					<button
						onClick={handleWarm}
						disabled={classifying || status.state === "loading"}
						className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium disabled:opacity-50 hover:bg-gray-50 transition-colors"
					>
						<Cpu size={16} />
						Load Runtime
					</button>
					<button
						onClick={handlePredict}
						disabled={classifying || !text.trim()}
						className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-medium disabled:opacity-50 hover:from-blue-700 hover:to-blue-900 transition-all"
					>
						<Zap size={16} />
						{classifying ? "Classifying…" : "Detect Bias"}
					</button>
					<span className="text-xs text-gray-400 ml-auto">
						first load is multi-second; cached after
					</span>
				</div>

				{status.state === "loading" && (
					<div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
						<StageProgress
							stages={STAGES}
							currentKey={status.stage}
							done={false}
							accent="blue"
						/>
					</div>
				)}
				{status.state === "ready" && (
					<div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
						<StageProgress
							stages={STAGES}
							currentKey={STAGES[STAGES.length - 1].key}
							done={true}
							accent="blue"
						/>
						<p className="mt-4 flex items-center gap-2 text-sm text-green-800 font-medium">
							<CheckCircle2 size={16} />
							Runtime ready — cold start {Math.round(status.runtimeMs)} ms.
							Cached for this page session.
						</p>
					</div>
				)}
				{status.state === "error" && (
					<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
						<p className="text-red-800">{status.message}</p>
					</div>
				)}

				{result && (
					<div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
						<div className="flex items-center justify-between">
							<p className="text-sm text-gray-500 mb-1">Prediction</p>
							<span className="text-xs text-gray-400 flex items-center gap-1">
								<Brain size={14} /> full Python pipeline
							</span>
						</div>
						<p className="text-3xl font-bold">
							{result.label === "left" ? (
								<span className="text-blue-700">LEFT</span>
							) : (
								<span className="text-red-700">RIGHT</span>
							)}
						</p>
						<p className="text-sm text-gray-500 mt-2">
							inference took{" "}
							<strong>{result.ms.toFixed(0)} ms</strong> (warm runtime)
						</p>
					</div>
				)}
			</div>
		</ClassifyShell>
	);
}
