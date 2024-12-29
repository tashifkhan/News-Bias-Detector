import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const AboutUsPage = () => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
			{/* Header Banner */}
			<div className="max-w-6xl mx-auto px-4 py-16">
				<div className="text-center mb-12 backdrop-blur-lg bg-white/30 p-8 rounded-2xl">
					<h2 className="text-3xl font-bold text-white mb-4">Who We Are</h2>
					<p className="text-white/90 max-w-2xl mx-auto">
						At the core of democracy lies the power of an informed public. Yet,
						in today's media landscape, the line between objective reporting and
						biased narratives has blurred, creating an urgent need for tools
						that help uncover and understand media bias.
					</p>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-6xl mx-auto px-8 py-2">
				{/* Two Column Layout */}
				<div className="grid md:grid-cols-2 gap-12 mb-12">
					{/* Left Column */}
					<div>
						<Card className="h-full backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl">
							<CardContent className="p-6">
								<h2 className="text-2xl font-bold mb-4 text-white">
									Our Mission
								</h2>
								<p className="mb-4 text-white/90">
									Our mission is to create a platform that promotes informed
									decision-making by:
								</p>
								<ul className="space-y-3 text-white/90">
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Classifying News Bias: Using state-of-the-art algorithms
											like XGBoost, achieving over 85% accuracy
										</span>
									</li>
									{/* Other list items remain the same, just with text-white/90 class */}
								</ul>
							</CardContent>
						</Card>
					</div>

					{/* Right Column */}
					<div>
						<Card className="h-full backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl">
							<CardContent className="p-6">
								<h2 className="text-2xl font-bold mb-4 text-white">
									Key Features
								</h2>
								<ul className="space-y-3 text-white/90">
									{/* List items remain the same, just with text-white/90 class */}
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Team Section */}
				<Card className="backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl mb-12">
					<CardContent className="p-6">
						<h2 className="text-2xl font-bold mb-4 text-white">Who We Are</h2>
						<p className="text-lg leading-relaxed text-white/90">
							{/* Content remains the same */}
						</p>
					</CardContent>
				</Card>

				{/* Call to Action */}
				<Card className="backdrop-blur-lg bg-white/30 border border-white/30 shadow-xl">
					<CardContent className="p-6">
						<h2 className="text-2xl font-bold mb-4 text-white">
							Join Us in Making a Difference
						</h2>
						<p className="text-lg leading-relaxed text-white/90">
							{/* Content remains the same */}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AboutUsPage;
