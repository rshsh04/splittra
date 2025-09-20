"use client"
import Header from '@/components/header'
import Footer from '@/components/footer'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { Home, LifeBuoy, Search } from 'lucide-react'

export default function NotFound() {
    const { t } = useI18n()
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />

            <main className="flex-1 bg-gradient-to-t from-green-50 to-base-300">
                <section className="max-w-5xl mx-auto px-4 py-20 lg:py-28">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg mb-6">
                            <Search className="w-10 h-10" />
                        </div>
                        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">404</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                            {t('notFoundMessage') || 'We couldn\'t find the page you\'re looking for.'}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/">
                                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105 shadow">
                                    <Home className="inline mr-2 w-5 h-5" />
                                    {t('goHome') || 'Go Home'}
                                </button>
                            </Link>
                            <Link href="/support">
                                <button className="border-2 border-green-600 text-green-700 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all">
                                    <LifeBuoy className="inline mr-2 w-5 h-5" />
                                    {t('contactSupport') || 'Contact Support'}
                                </button>
                            </Link>
                        </div>

                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}