'use client'

import { Mail, MessageCircle, Phone, FileText, HelpCircle, Clock } from 'lucide-react'
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'

const faqs = (t: (k:string)=>string) => [
  {
    question: t('faqHowCreateHouseholdQ'),
    answer: t('faqHowCreateHouseholdA')
  },
  {
    question: t('faqHowExpensesSplitQ'),
    answer: t('faqHowExpensesSplitA')
  },
  {
    question: t('faqEditDeleteExpenseQ'),
    answer: t('faqEditDeleteExpenseA')
  },
  {
    question: t('faqSettleBalancesQ'),
    answer: t('faqSettleBalancesA')
  },
  {
    question: t('faqDataSecureQ'),
    answer: t('faqDataSecureA')
  }
]

const supportCategories = (t: (k:string)=>string) => [
  {
    icon: Mail,
    title: t('emailSupport'),
    description: t('emailSupportDesc'),
    available: t('emailSupportSla'),
    action: t('emailSupportCta'),
    href: 'mailto:support@splitit.com'
  },
]

export default function SupportPage() {
  const { t, locale } = useI18n() as any
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error(t('supportFormValidationError'))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t('supportFormEmailInvalid'))
      return false
    }
    if (message.trim().length > 5000) {
      toast.error(t('supportFormMessageTooLong'))
      return false
    }
    return true
  }

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    if (!validate()) return
    setSubmitting(true)
    const controller = new AbortController()
    const promise = fetch('/api/support/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim(), locale }),
      signal: controller.signal
    }).then(async r => {
      if (!r.ok) throw new Error('fail')
      const data = await r.json().catch(() => ({}))
      if (!data.ok) throw new Error('fail')
      return data
    })

    toast.promise(promise, {
      pending: t('supportFormSending'),
      success: t('supportFormSuccess'),
      error: t('supportFormGenericError')
    })
      .then(() => {
        setName('')
        setEmail('')
        setMessage('')
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }, [name, email, message, submitting, locale, t])
  const faqItems = faqs(t)
  const categories = supportCategories(t)
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-gray-50 to-base-100">
      <Header />
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">{t('supportHeroTitle')}</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {t('supportHeroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-12 px-4 ">
        <div className="max-w-6xl mx-auto flex justify-center items-center">
          <div className="w-full  gap-8 ">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{category.title}</h3>
                  <p className="text-slate-600 mb-2">{category.description}</p>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {category.available}
                  </p>
                  <Link href={category.href} className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors">
                    {category.action}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">{t('faqTitle')}</h2>
          <div className="space-y-6">
            {faqItems.map((faq, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-md border border-slate-200">
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

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">{t('sendUsMessage')}</h2>
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="support-name" className="block text-sm font-medium text-gray-700 mb-1">{t('nameLabel')}</label>
                <input
                  id="support-name"
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>
              <div>
                <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
                <input
                  id="support-email"
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="support-message" className="block text-sm font-medium text-gray-700 mb-1">{t('messageLabel')}</label>
                <textarea
                  id="support-message"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                  rows={4}
                  placeholder={t('messagePlaceholder')}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={5000}
                  required
                ></textarea>
                <div className="text-xs text-gray-500 mt-1 flex justify-end">{message.length}/5000</div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
              >
                {submitting ? t('supportFormSending') : t('sendMessageAction')}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

