"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Users, Calculator, Bell, Star, ArrowRight, CheckCircle, DollarSign, Smartphone, Shield } from 'lucide-react';
import Header from '@/components/header';

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "College Student",
    content: "SplitIt saved our roommate relationships! No more awkward money conversations.",
    rating: 5,
    avatar: "/default-avatar.jpg",
  },
  {
    name: "Mike Chen",
    role: "Young Professional", 
    content: "Perfect for splitting dinner bills. The calculations are always spot-on.",
    rating: 5,
    avatar: "/boy.png",
  },
  {
    name: "Emma Davis",
    role: "Family Manager",
    content: "Finally, expense tracking that everyone in my family actually uses!",
    rating: 5,
    avatar: "/boy (1).png",
  },
];

const features = [
  {
    icon: Calculator,
    title: "Smart Calculations",
    description: "Automatically split expenses with custom ratios, percentages, or equal shares",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Group Management",
    description: "Create groups for roommates, friends, family, or travel companions",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Gentle notifications for pending payments and upcoming bills",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Optimized for mobile with offline sync and real-time updates",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption with no data sharing to third parties",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: DollarSign,
    title: "Multi-Currency",
    description: "Support for 150+ currencies with real-time exchange rates",
    color: "from-green-500 to-emerald-500"
  }
];

const stats = [
  { number: "50K+", label: "Active Users" },
  { number: "$2M+", label: "Expenses Tracked" },
  { number: "99.9%", label: "Uptime" },
  { number: "4.9★", label: "App Rating" }
];

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 bg-gradient-to-t from-white to-base-300">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              <DollarSign className="inline-block w-12 h-12 md:w-16 md:h-16 mb-2 text-blue-600" />
              Split Expenses
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Effortlessly
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed flex flex-col items-center gap-4">
              <span className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-blue-600" />
                The most intuitive way to track, split, and settle shared expenses.
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Perfect for roommates, couples, friends, and families.
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
                Start Free Trial
                <ArrowRight className="inline ml-2 w-5 h-5" />
              </button>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything you need to manage shared expenses
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make splitting bills simple and stress-free
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
                    activeFeature === index ? 'ring-2 ring-blue-500 shadow-xl' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">Simple steps to split any expense</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Add Expense", desc: "Enter the bill amount and select who was involved" },
              { step: "2", title: "Choose Split", desc: "Decide how to split: equally, by amount, or percentage" },
              { step: "3", title: "Track & Settle", desc: "See who owes what and mark payments as complete" }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                {index < 2 && (
                  <ArrowRight className="w-6 h-6 text-gray-300 absolute top-8 -right-3 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by thousands of users
            </h2>
            <p className="text-xl text-gray-600">See what our community has to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-6">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to simplify your shared expenses?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of users who've made splitting bills effortless
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all transform hover:scale-105">
              Contact Sales
            </button>
          </div>

          <div className="flex items-center justify-center mt-8 text-blue-100">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Free 14-day trial • No credit card required</span>
          </div>
        </div>
      </section>

 
    </div>
  );
}