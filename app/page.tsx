"use client";

import { useState, useEffect } from 'react';
import { ChevronDown, Users, Calculator, Bell, Star, ArrowRight, CheckCircle, DollarSign, Smartphone, Shield} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Image from 'next/image';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/LocaleProvider';
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
    titleKey: 'featSmartCalc',
    descKey: 'featSmartCalcDesc',
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    titleKey: 'featGroupMgmt',
    descKey: 'featGroupMgmtDesc',
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Bell,
    titleKey: 'featReminders',
    descKey: 'featRemindersDesc',
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: Smartphone,
    titleKey: 'featMobile',
    descKey: 'featMobileDesc',
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    titleKey: 'featSecurity',
    descKey: 'featSecurityDesc',
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: DollarSign,
    titleKey: 'featLoans',
    descKey: 'featLoansDesc',
    color: "from-green-500 to-emerald-500"
  }
];

const stats = [
  { number: "50K+", labelKey: 'statsActiveUsers' },
  { number: "$2M+", labelKey: 'statsExpensesTracked' },
  { number: "99.9%", labelKey: 'statsUptime' },
  { number: "4.9★", labelKey: 'statsAppRating' }
];

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { t } = useI18n();

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
      <section className="pt-24 pb-20 px-4 bg-gradient-to-t from-green-50 to-base-300">

        <div className="container mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 lg:pr-8">
              <div className={`text-center lg:text-left transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  <DollarSign className="inline-block w-12 h-12 md:w-16 md:h-16 mb-2 text-green-600" />
                  {t('heroTitle').split(' ').slice(0,2).join(' ')}
                  <br />
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {t('heroTitle').split(' ').slice(2).join(' ') || t('heroTitle')}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto lg:mx-0 leading-relaxed flex flex-col items-center lg:items-start gap-4">
                  <span className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-green-600 flex-shrink-0" />
                    {t('heroLine1')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    {t('heroLine2')}
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-16">
                  <Link href="/signup">
                  <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
                    {t('ctaStartTrial')}
                    <ArrowRight className="inline ml-2 w-5 h-5" />
                  </button>
                  </Link>

                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto mb-8 lg:mb-0">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                      <div className="text-sm text-gray-600">{t(stat.labelKey)}</div>
                    </div>
                  ))}
                </div>
              </div>


            </div>
            <div className="lg:w-1/2 lg:pl-8">
              <div className="relative transform transition-all duration-1000 hover:translate-x-1">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/40 to-emerald-600/10 rounded-2xl transform rotate-3 scale-105"></div>
                <Image
                  src="/payy.jpg"
                  alt="Hero Image"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-xl w-full h-auto object-cover transform transition-all duration-1000 hover:scale-[1.02] relative z-10"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              {t('featuresHeading')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('featuresSubheading')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${activeFeature === index ? 'ring-2 ring-blue-500 shadow-xl' : ''
                    }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(feature.descKey)}</p>
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
              {t('howItWorks')}
            </h2>
            <p className="text-xl text-gray-600">{t('howItWorksSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: t('step1Title'), desc: t('step1Desc') },
              { step: "2", title: t('step2Title'), desc: t('step2Desc') },
              { step: "3", title: t('step3Title'), desc: t('step3Desc') }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-200 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-6">
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
              {t('lovedBy')}
            </h2>
            <p className="text-xl text-gray-600">{t('seeCommunity')}</p>
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
      <section className="py-24 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            {t('ctaReady')}
          </h2>
          <p className="text-xl text-green-100 mb-10">
            {t('ctaJoin')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="bg-white text-green-600 px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg">
                {t('ctaStartTrial')}
              </button>
            </Link>
            <Link href="/support">
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-green-600 transition-all transform hover:scale-105">
                {t('ctaContactSupport')}
              </button>
            </Link>
          </div>

          <div className="flex items-center justify-center mt-8 text-green-100">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{t('trialBadge')}</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}

