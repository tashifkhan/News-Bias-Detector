"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import ClassifyShell from "@/components/client-ml/ClassifyShell";
import StageProgress, { type StageDef } from "@/components/client-ml/StageProgress";
import { Brain, Zap, Cpu, CheckCircle2, Gauge } from "lucide-react";
import { loadOnnxModel, classifyText } from "@/components/client-ml/onnxClassifier";

const STAGES: StageDef[] = [
	{ key: "meta", label: "Downloading model_meta.json", detail: "vocab · idf · lemma table · ~4 MB" },
	{ key: "onnx", label: "Downloading model.onnx", detail: "92 KB dense XGBoost graph" },
	{ key: "wasm", label: "Loading onnxruntime-web WASM", detail: "~13.5 MB runtime" },
	{ key: "session", label: "Compiling inference session", detail: "warm the graph once, cache it" },
];

let stageSink: ((s: string) => void) | null = null;
function stage(s: string) {
	stageSink?.(s);
}

async function loadModel() {
	stage("meta");
	const m = await loadOnnxModel();
	stage("onnx");
	stage("wasm");
	stage("session");
	return m;
}

type LoadStatus =
	| { state: "idle" }
	| { state: "loading"; stage: string }
	| { state: "ready"; runtimeMs: number; accuracy: number }
	| { state: "error"; message: string };

export default function OnnxClassifyPage() {
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
		setStatus({ state: "loading", stage: "meta" });
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
			const label = await classifyText(text.trim());
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
		<ClassifyShell
			title="Client-Side Bias Detection — ONNX"
			badge="ONNX + onnxruntime-web"
			accent="green"
			description="The XGBoost classifier ships as a compact ONNX graph. Text preprocessing runs in JS, inference runs on WASM — no Python in the browser at all."
		>
			<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
				<textarea
					className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 resize-y"
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
						Load Model
					</button>
					<button
						onClick={handlePredict}
						disabled={classifying || !text.trim()}
						className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg font-medium disabled:opacity-50 hover:from-green-700 hover:to-green-900 transition-all"
					>
						<Zap size={16} />
						{classifying ? "Classifying…" : "Detect Bias"}
					</button>
					<span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
						<Gauge size={14} /> ~14 ms per prediction after load
					</span>
				</div>

				{status.state === "loading" && (
					<div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
						<StageProgress
							stages={STAGES}
							currentKey={status.stage}
							done={false}
							accent="green"
						/>
					</div>
				)}
				{status.state === "ready" && (
					<div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg">
						<StageProgress
							stages={STAGES}
							currentKey={STAGES[STAGES.length - 1].key}
							done={true}
							accent="green"
						/>
						<p className="mt-4 flex items-center gap-2 text-sm text-green-800 font-medium">
							<CheckCircle2 size={16} />
							Model ready — load {Math.round(status.runtimeMs)} ms · test
							accuracy {Math.round(status.accuracy * 100)}% · cached.
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
								<Brain size={14} /> ONNX graph · JS preprocessing
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
							inference took <strong>{result.ms.toFixed(0)} ms</strong>
						</p>
					</div>
				)}
			</div>
		</ClassifyShell>
	);
}
