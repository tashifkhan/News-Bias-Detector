"use client";
import React from "react";

export type StageDef = {
	key: string;
	label: string;
	detail?: string;
};

type StageProgressProps = {
	stages: StageDef[];
	currentKey: string;
	done: boolean;
	accent?: "blue" | "green";
};

const accentStyles = {
	blue: {
		active: "bg-blue-600",
		done: "bg-blue-500",
		ring: "ring-blue-200",
		pulse: "bg-blue-400",
		badgeDone: "bg-blue-500 text-white ring-blue-300",
		badgeActive: "bg-white text-blue-700 ring-blue-400",
	},
	green: {
		active: "bg-green-600",
		done: "bg-green-500",
		ring: "ring-green-200",
		pulse: "bg-green-400",
		badgeDone: "bg-green-500 text-white ring-green-300",
		badgeActive: "bg-white text-green-700 ring-green-400",
	},
};

export default function StageProgress({
	stages,
	currentKey,
	done,
	accent = "blue",
}: StageProgressProps) {
	const a = accentStyles[accent];
	const currentIdx = stages.findIndex((s) => s.key === currentKey);

	return (
		<div className="w-full">
			{/* overall progress bar */}
			<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-5">
				<div
					className={`h-full rounded-full transition-all duration-500 ease-out ${a.done}`}
					style={{
						width: done
							? "100%"
							: `${((currentIdx + 1) / stages.length) * 100}%`,
					}}
				/>
			</div>

			<ol className="space-y-3">
				{stages.map((s, i) => {
					const isActive = s.key === currentKey && !done;
					const isDone = i < currentIdx || (done && i <= currentIdx);
					return (
						<li key={s.key} className="flex items-start gap-3">
							<span
								className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 transition-colors ${
									isDone
										? a.badgeDone
										: isActive
										? a.badgeActive
										: "bg-gray-100 text-gray-400 ring-gray-200"
								}`}
							>
								{isDone ? "✓" : i + 1}
							</span>
							<div className="min-w-0">
								<p
									className={`text-sm font-medium ${
										isActive || isDone ? "text-gray-900" : "text-gray-400"
									}`}
								>
									{s.label}
								</p>
								{s.detail && (
									<p className="text-xs text-gray-500">{s.detail}</p>
								)}
							</div>
							{isActive && (
								<span className={`ml-auto ${a.pulse} h-2 w-2 rounded-full animate-pulse`} />
							)}
						</li>
					);
				})}
			</ol>
		</div>
	);
}
