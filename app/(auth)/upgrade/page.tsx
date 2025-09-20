"use client"
import useSupabaseUser from "@/hooks/useSupabaseUser";
import Link from "next/link"
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle, Star, Crown, Zap, Shield, Users, Calculator, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';
import Header from "@/components/header";
import Footer from "@/components/footer";

const premiumFeatures = [
	{
		icon: Users,
		title: "Unlimited Groups",
		description: "Create as many expense groups as you need"
	},
	{
		icon: Calculator,
		title: "Advanced Splitting",
		description: "Custom ratios, percentages, and complex splits"
	},
	{
		icon: DollarSign,
		title: "Multi-Currency",
		description: "Support for 150+ currencies with live rates"
	},
	{
		icon: TrendingUp,
		title: "Detailed Reports",
		description: "Analytics and insights on your spending patterns"
	},
	{
		icon: Shield,
		title: "Priority Support",
		description: "Get help when you need it most"
	},
	{
		icon: Zap,
		title: "Enhanced Collaboration",
		description: "Advanced tools for team expense management"
	}
];

const benefits = [
	"14-day free trial",
	"Cancel anytime",
	"No setup fees",
	"Instant activation"
];

export default function UpgradePage() {
	// Import toast, router, and user
	const { toast } = require('react-toastify');
	const { useRouter } = require('next/navigation');

	const router = useRouter();
	const { user, loading } = useSupabaseUser();

	const handleUpgrade = async () => {
	
		if (loading) return;
		if (!user) {
			toast.error("You must be logged in to upgrade.");
			return;
		}
		try {
			toast.info("Redirecting to checkout...");
			const res = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: user.email })
			});
			const data = await res.json();
			if (!data.id) {
				toast.error(data.error || "Unable to create Stripe session.");
				return;
			}
			const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
			await stripe?.redirectToCheckout({ sessionId: data.id });
		} catch (error) {
			console.error("Error initiating checkout:", error);
		}
	};

	return (
		<div className="min-h-screen bg-white">
			<Header />

			{/* Hero Section */}
			<section className="pt-24 pb-20 px-4 bg-gradient-to-t from-green-50 to-base-300">
				<div className="max-w-4xl mx-auto text-center">
					<div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
						<Crown className="w-4 h-4" />
						Premium Features
					</div>

					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
						Unlock the Full
						<br />
						<span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
							SplitIt Experience
						</span>
					</h1>

					<p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
						Take your expense management to the next level with advanced features designed for power users
					</p>
				</div>
			</section>

			{/* Pricing Card */}
			<section className="py-10 px-4 bg-gradient-to-b from-green-50 to-gray-50">
				<div className="max-w-md mx-auto">
					<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
						{/* Premium Badge */}
						<div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-bl-2xl">
							<div className="flex items-center gap-1 text-sm font-medium">
								<Star className="w-4 h-4 fill-current" />
								Premium
							</div>
						</div>

						<div className="text-center mb-6">
							<h3 className="text-2xl font-bold text-gray-900 mb-4">Splittra Premium</h3>

							<div className="mb-4">
								<div className="flex items-baseline justify-center gap-1">
									<span className="text-4xl font-bold text-gray-900">SEK 39</span>
									<span className="text-lg text-gray-600">/month</span>
								</div>
								<p className="text-sm text-gray-500 mt-1">Billed monthly, cancel anytime</p>
							</div>
						</div>

						<button
							onClick={handleUpgrade}
							className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg mb-6"
						>
							Start Free Trial
							<ArrowRight className="inline ml-2 w-5 h-5" />
						</button>

						<div className="space-y-3 mb-8">
							{benefits.map((benefit, index) => (
								<div key={index} className="flex items-center gap-3">
									<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
									<span className="text-gray-700">{benefit}</span>
								</div>
							))}
						</div>

						<Link href="/dashboard" className="block text-center text-green-600 hover:text-green-700 font-medium transition-colors">
							Back to Dashboard
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 bg-gradient-to-b from-gray-50 to-white">
				<div className="max-w-6xl mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Everything you need for advanced expense management
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Premium features designed to handle complex scenarios and provide deeper insights
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{premiumFeatures.map((feature, index) => {
							const Icon = feature.icon;
							return (
								<div
									key={index}
									className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
								>
									<div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mb-4">
										<Icon className="w-6 h-6 text-white" />
									</div>
									<h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
									<p className="text-gray-600 leading-relaxed">{feature.description}</p>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Comparison Section */}
			<section className="py-16 px-4">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Free vs Premium
						</h2>
						<p className="text-lg text-gray-600">
							See what you get with SplitIt Premium
						</p>
					</div>

					<div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
						<div className="grid md:grid-cols-2">
							{/* Free Column */}
							<div className="p-8 border-r border-gray-100">
								<div className="text-center mb-6">
									<h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
									<div className="text-2xl font-bold text-gray-900">SEK 0</div>
									<p className="text-sm text-gray-500">Forever</p>
								</div>

								<ul className="space-y-3">
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Up to 3 expense groups</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Basic expense splitting</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Standard support</span>
									</li>
								</ul>
							</div>

							{/* Premium Column */}
							<div className="p-8 bg-gradient-to-b from-green-50 to-emerald-50 relative">
								<div className="absolute top-4 right-4">
									<div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
										Popular
									</div>
								</div>

								<div className="text-center mb-6">
									<h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
									<div className="text-2xl font-bold text-gray-900">SEK 39</div>
									<p className="text-sm text-gray-500">per month</p>
								</div>

								<ul className="space-y-3 mb-6">
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Unlimited expense groups</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Advanced splitting options</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Multi-currency support</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Detailed reports & analytics</span>
									</li>
									<li className="flex items-center gap-3">
										<CheckCircle className="w-5 h-5 text-green-600" />
										<span className="text-gray-700">Priority support</span>
									</li>
								</ul>

								<button
									onClick={handleUpgrade}
									className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105"
								>
									Upgrade Now
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600">
				<div className="max-w-4xl mx-auto text-center px-4">
					<h2 className="text-4xl font-bold text-white mb-6">
						Ready to unlock premium features?
					</h2>
					<p className="text-xl text-green-100 mb-10">
						Start your free trial today and experience the difference
					</p>

					<button
						onClick={handleUpgrade}
						className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
					>
						Start Free Trial
						<ArrowRight className="inline ml-2 w-5 h-5" />
					</button>

					<div className="flex items-center justify-center mt-8 text-green-100">
						<CheckCircle className="w-5 h-5 mr-2" />
						<span>14-day free trial • Cancel anytime • No hidden fees</span>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}