import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const AboutUsPage = () => {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header Banner */}
			<div className="max-w-6xl mx-auto px-4 py-16">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-blue-900 mb-4">Who We Are</h2>
					<p className="text-gray-600 max-w-2xl mx-auto">
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
						<Card className="h-full shadow-lg">
							<CardContent className="p-6">
								<h2 className="text-2xl font-bold mb-4 text-blue-900">
									Our Mission
								</h2>
								<p className="mb-4">
									Our mission is to create a platform that promotes informed
									decision-making by:
								</p>
								<ul className="space-y-3">
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Classifying News Bias: Using state-of-the-art algorithms
											like XGBoost, achieving over 85% accuracy
										</span>
									</li>
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Real-Time Insights: Providing up-to-date analysis of media
											bias
										</span>
									</li>
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Promoting Media Accountability: Encouraging journalistic
											integrity
										</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>

					{/* Right Column */}
					<div>
						<Card className="h-full shadow-lg">
							<CardContent className="p-6">
								<h2 className="text-2xl font-bold mb-4 text-blue-900">
									Key Features
								</h2>
								<ul className="space-y-3">
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Advanced AI Algorithms: XGBoost ensures high precision and
											reliability
										</span>
									</li>
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											User-Friendly Design: Intuitive dashboard for easy
											analysis
										</span>
									</li>
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Scalability: Process large datasets in real time
										</span>
									</li>
									<li className="flex items-start">
										<span className="font-semibold mr-2">•</span>
										<span>
											Innovative Data Handling: Advanced preprocessing
											techniques
										</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Team Section */}
				<Card className="shadow-lg mb-12">
					<CardContent className="p-6">
						<h2 className="text-2xl font-bold mb-4 text-blue-900">
							Who We Are
						</h2>
						<p className="text-lg leading-relaxed">
							We are a passionate team of engineering students and researchers
							who believe in the transformative potential of artificial
							intelligence. With a shared vision of promoting unbiased media
							consumption, we have pooled our expertise in machine learning,
							data analysis, and software engineering to create a platform that
							empowers individuals to critically evaluate the news they consume.
						</p>
					</CardContent>
				</Card>

				{/* Call to Action */}
				<Card className="bg-blue-50 shadow-lg mb-20">
					<CardContent className="p-6">
						<h2 className="text-2xl font-bold mb-4 text-blue-900">
							Join Us in Making a Difference
						</h2>
						<p className="text-lg leading-relaxed">
							We believe that technology can be a powerful force for good, and
							our media bias detection platform is a step toward restoring trust
							in journalism. By equipping users with the tools to identify bias,
							we aim to empower individuals and foster a culture of critical
							media literacy.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default AboutUsPage;
