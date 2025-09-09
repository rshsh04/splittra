"use client";

import Header from "@/components/header";
import Link from "next/link";
import Image from "next/image";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "College Student",
    content:
      "SplitIt saved our roommate relationships! No more awkward money conversations or forgotten IOUs.",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
  },
  {
    name: "Mike Chen",
    role: "Young Professional",
    content:
      "Perfect for splitting dinner bills with friends. The app is intuitive and the calculations are always accurate.",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
  },
  {
    name: "Emma Davis",
    role: "Family Manager",
    content:
      "Finally, a way to track household expenses that everyone in my family actually uses. Game changer!",
    rating: 5,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300">
      <Header />

      {/* Hero Section */}
      <section className="text-center px-4 py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simplify Sharing Expenses
        </h1>
        <p className="text-lg md:text-xl mb-8 max-w-xl mx-auto">
          Keep track of bills, split costs with friends or family, and
          eliminate awkward money talks.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/login">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg">
              Log In
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg">
              Sign Up
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">
          Why Use SplitIt?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all">
            <Image
              src="/icons/expense.svg"
              alt="Expense Tracking"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h3 className="font-semibold text-lg mb-2">Track Expenses</h3>
            <p className="text-slate-600 text-sm">
              Monitor shared expenses easily for roommates, family, or friends.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all">
            <Image
              src="/icons/calculator.svg"
              alt="Split Costs"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h3 className="font-semibold text-lg mb-2">Split Costs</h3>
            <p className="text-slate-600 text-sm">
              Automatically calculate who owes what, saving time and confusion.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all">
            <Image
              src="/icons/friends.svg"
              alt="Stay Organized"
              width={64}
              height={64}
              className="mx-auto mb-4"
            />
            <h3 className="font-semibold text-lg mb-2">Stay Organized</h3>
            <p className="text-slate-600 text-sm">
              All your household or group expenses in one place with reminders.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50 px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-800">
          What Users Are Saying
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:shadow-xl transition-all"
            >
              <img
                src={t.avatar}
                alt={t.name}
                className="w-16 h-16 rounded-full mb-4 object-cover"
              />
              <p className="text-slate-700 mb-4">"{t.content}"</p>
              <h4 className="font-semibold text-slate-800">{t.name}</h4>
              <span className="text-sm text-slate-500">{t.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">
          Ready to Simplify Your Expenses?
        </h2>
        <p className="text-slate-600 mb-8">
          Join thousands of users who manage shared expenses effortlessly.
        </p>
        <Link href="/signup">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transition-all shadow-lg">
            Get Started
          </button>
        </Link>
      </section>
    </div>
  );
}
