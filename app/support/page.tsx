'use client'

import { Mail, MessageCircle, Phone, FileText, HelpCircle, Clock } from 'lucide-react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'

const faqs = [
  {
    question: "How do I create a household?",
    answer: "After signing up, click on 'Create Household' from your dashboard. Enter your household name and invite members using their email addresses."
  },
  {
    question: "How are expenses split?",
    answer: "By default, expenses are split equally among all household members. You can also create custom splits or mark certain expenses as personal loans."
  },
  {
    question: "Can I edit or delete an expense?",
    answer: "Yes! The person who added the expense can edit or delete it. Just click the edit or delete icon next to the expense in your dashboard."
  },
  {
    question: "How do I settle up balances?",
    answer: "SplitIt calculates the optimal way to settle debts. You can mark payments as completed once they're settled in real life."
  },
  {
    question: "Is my financial data secure?",
    answer: "Yes, we use bank-level encryption and never store actual banking details. Your data is protected and private."
  }
]

const supportCategories = [

  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    available: "Response within 24h",
    action: "Send Email",
    href: "mailto:support@splitit.com"
  },


]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-gray-50 to-base-100">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">How Can We Help You?</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get the support you need, when you need it. Our team is here to help you make the most of SplitIt.
          </p>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-12 px-4 ">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <div className="w-full  gap-8 ">
            {supportCategories.map((category, index) => {
              const Icon = category.icon
              return (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{category.title}</h3>
                  <p className="text-slate-600 mb-2">{category.description}</p>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {category.available}
                  </p>
                  <Link
                    href={category.href}
                    className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors"
                  >
                    {category.action}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md border border-slate-200"
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-start gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  {faq.question}
                </h3>
                <p className="text-slate-600 pl-9">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Send Us a Message</h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  rows={4}
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
