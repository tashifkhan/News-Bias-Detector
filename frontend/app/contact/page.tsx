"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const ContactSection = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Handle form submission logic here
		console.log("Form submitted:", formData);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	return (
		<div className="bg-gray-50 py-16">
			<div className="max-w-6xl mx-auto px-4">
				<div className="text-center mb-12">
					<h2 className="text-3xl font-bold text-blue-900 mb-4">Contact Us</h2>
					<p className="text-gray-600 max-w-2xl mx-auto">
						Have questions about our media bias detection platform? We&apos;re
						here to help. Reach out to us for any inquiries or support needs.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{/* Contact Information Card */}
					<div className="md:col-span-1">
						<Card className="h-full shadow-lg">
							<CardHeader>
								<CardTitle className="text-xl font-bold text-blue-900">
									Get in Touch
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-6">
									<div className="flex items-start space-x-3">
										<Mail className="w-5 h-5 text-blue-600 mt-1" />
										<div>
											<h3 className="font-semibold">Email</h3>
											<p className="text-gray-600">Check the footer</p>
										</div>
									</div>

									<div className="flex items-start space-x-3">
										<Phone className="w-5 h-5 text-blue-600 mt-1" />
										<div>
											<h3 className="font-semibold">Phone</h3>
											<p className="text-gray-600">
												+91 (120) 4567-xxxx{" "}
												<span className="text-blue-300">{"~ mail only"}</span>
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-3">
										<MapPin className="w-5 h-5 text-blue-600 mt-1" />
										<div>
											<h3 className="font-semibold">Location</h3>
											<p className="text-gray-600">
												Noida, Uttar Pradesh, India
											</p>
										</div>
									</div>

									<div className="flex items-start space-x-3">
										<Clock className="w-5 h-5 text-blue-600 mt-1" />
										<div>
											<h3 className="font-semibold">Business Hours</h3>
											<p className="text-gray-600">
												Mon - Fri: 9:00 AM - 6:00 PM
											</p>
											<p className="text-gray-600">
												CIN: U72200UP2024PTC123456
											</p>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Contact Form */}
					<div className="md:col-span-2">
						<Card className="shadow-lg">
							<CardHeader>
								<CardTitle className="text-xl font-bold text-blue-900">
									Send us a Message
								</CardTitle>
							</CardHeader>
							<CardContent>
								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid md:grid-cols-2 gap-6">
										<div>
											<label className="block text-sm font-medium mb-2">
												Your Name
											</label>
											<Input
												name="name"
												value={formData.name}
												onChange={handleChange}
												className="w-full"
												placeholder="John Doe"
												required
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-2">
												Email Address
											</label>
											<Input
												type="email"
												name="email"
												value={formData.email}
												onChange={handleChange}
												className="w-full"
												placeholder="johndoe@example.com"
												required
											/>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Subject
										</label>
										<Input
											name="subject"
											value={formData.subject}
											onChange={handleChange}
											className="w-full"
											placeholder="How can we help?"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-medium mb-2">
											Message
										</label>
										<Textarea
											name="message"
											value={formData.message}
											onChange={handleChange}
											className="w-full min-h-[150px]"
											placeholder="Your message here..."
											required
										/>
									</div>

									<Button
										type="submit"
										className="w-full bg-blue-800 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
										onClick={(e) => {
											e.preventDefault();
											const mailtoLink = `mailto:developer@tashif.codes?subject=${encodeURIComponent(
												formData.subject
											)}&body=${encodeURIComponent(
												`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
											)}`;
											window.open(mailtoLink);
										}}
									>
										Send Message
									</Button>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactSection;
