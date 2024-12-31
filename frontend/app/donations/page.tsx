"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Shield, Target, BarChart, QrCode } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogTitle,
} from "@/components/ui/dialog";
import QRImage from "@/public/DonationQR.png";
import Image from "next/image";

const DonationSection = () => {
	const [showUPIDialog, setShowUPIDialog] = useState(false);
	const [donationAmount, setDonationAmount] = useState("");
	const [donationType, setDonationType] = useState("one-time");

	const predefinedAmounts = [500, 1000, 2500, 5000];

	const handleAmountSelect = (amount: number) => {
		setDonationAmount(amount.toString());
	};

	return (
		<div className="bg-gray-50 py-16">
			<div className="max-w-6xl mx-auto px-4">
				{/* Header Section */}
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-blue-900 mb-4">
						Support Unbiased Journalism
					</h2>
					<p className="text-gray-600 max-w-2xl mx-auto">
						Your donation helps us maintain and improve our AI-powered media
						bias detection platform, ensuring transparent and unbiased news
						reaches everyone.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{/* Impact Section */}
					<div className="md:col-span-1">
						<Card className="shadow-lg h-full">
							<CardHeader>
								<CardTitle className="text-xl font-bold text-blue-900">
									Your Impact
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="flex items-start space-x-3">
										<Target className="w-5 h-5 text-blue-800 mt-1" />
										<div>
											<h3 className="font-semibold">Mission Support</h3>
											<p className="text-gray-600">
												Help us analyze over 10,000 news articles daily
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-3">
										<BarChart className="w-5 h-5 text-blue-800 mt-1" />
										<div>
											<h3 className="font-semibold">Technology Investment</h3>
											<p className="text-gray-600">
												Improve AI algorithms and infrastructure
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-3">
										<Shield className="w-5 h-5 text-blue-800 mt-1" />
										<div>
											<h3 className="font-semibold">Transparency</h3>
											<p className="text-gray-600">
												Regular updates on how funds are utilized
											</p>
										</div>
									</div>
								</div>

								<div className="mt-6 p-4 bg-blue-50 rounded-lg">
									<h4 className="font-semibold text-blue-900 mb-2">
										80G Tax Benefits
									</h4>
									<p className="text-sm text-gray-600">
										All donations are eligible for tax deduction under section
										80G of the Income Tax Act.
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Donation Form */}
					<div className="md:col-span-2">
						<Card className="shadow-lg">
							<CardHeader>
								<CardTitle className="text-xl font-bold text-blue-900">
									Make a Donation
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									{/* Donation Type Selection */}
									<div className="flex space-x-4">
										<Button
											className={`flex-1 ${
												donationType === "one-time"
													? "bg-blue-800 text-white"
													: "bg-gray-100 text-gray-600"
											}`}
											onClick={() => setDonationType("one-time")}
										>
											One-time
										</Button>
										<Button
											className={`flex-1 ${
												donationType === "monthly"
													? "bg-blue-800 text-white"
													: "bg-gray-100 text-gray-600"
											}`}
											onClick={() => setDonationType("monthly")}
										>
											Monthly
										</Button>
									</div>

									{/* Predefined Amounts */}
									<div>
										<label className="block text-sm font-medium mb-2">
											Select Amount (₹)
										</label>
										<div className="grid grid-cols-4 gap-4">
											{predefinedAmounts.map((amount) => (
												<Button
													key={amount}
													className={`${
														donationAmount === amount.toString()
															? "bg-blue-800 text-white"
															: "bg-gray-100 text-gray-600"
													}`}
													onClick={() => handleAmountSelect(amount)}
												>
													₹{amount}
												</Button>
											))}
										</div>
									</div>

									{/* Custom Amount Input */}
									<div>
										<label className="block text-sm font-medium mb-2">
											Or Enter Custom Amount
										</label>
										<div className="relative">
											<span className="absolute left-3 top-1/2 transform -translate-y-1/2">
												₹
											</span>
											<Input
												type="number"
												className="pl-8"
												value={donationAmount}
												onChange={(e) => setDonationAmount(e.target.value)}
												placeholder="Enter amount"
											/>
										</div>
									</div>

									{/* Payment Buttons */}
									<div className="space-y-4">
										<Button className="w-full bg-blue-800 hover:bg-blue-700 text-white">
											<DollarSign className="w-4 h-4 mr-2" />
											Donate with Card
										</Button>

										<Button
											className="w-full bg-gray-800 hover:bg-gray-900 text-white"
											onClick={() => setShowUPIDialog(true)}
										>
											<QrCode className="w-4 h-4 mr-2" />
											Pay with UPI
										</Button>

										<Dialog
											open={showUPIDialog}
											onOpenChange={() => setShowUPIDialog(false)}
										>
											<DialogOverlay />
											<DialogContent>
												<DialogTitle>Scan to Pay</DialogTitle>
												<div className="text-center">
													<Image
														src={QRImage}
														alt="UPI QR Code"
														className="mx-auto mb-4"
													/>
													<Button
														onClick={() => setShowUPIDialog(false)}
														className="bg-blue-800 hover:bg-blue-700 text-white"
													>
														Close
													</Button>
												</div>
											</DialogContent>
										</Dialog>
									</div>

									{/* Security Note */}
									<div className="text-center text-sm text-gray-600">
										<Shield className="w-4 h-4 inline-block mr-1" />
										Secure payment processing. Your financial information is
										never stored.
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Transparency Section */}
				<div className="mt-12">
					<Card className="shadow-lg">
						<CardContent className="p-6">
							<div className="grid md:grid-cols-3 gap-8 text-center">
								<div>
									<h3 className="text-2xl font-bold text-blue-900 mb-2">80%</h3>
									<p className="text-gray-600">
										Goes to Technology Development
									</p>
								</div>
								<div>
									<h3 className="text-2xl font-bold text-blue-900 mb-2">15%</h3>
									<p className="text-gray-600">Research & Analysis</p>
								</div>
								<div>
									<h3 className="text-2xl font-bold text-blue-900 mb-2">5%</h3>
									<p className="text-gray-600">Administrative Costs</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default DonationSection;
