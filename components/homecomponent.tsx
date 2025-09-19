"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ToastContainer, toast } from 'react-toastify'
import { loadStripe } from '@stripe/stripe-js'
import { getUserSubscription } from "@/lib/premiumCheck"
import { createClient } from "@/lib/supabase/client"
import Expenses from "./expenses"
import HouseholdComponent from "./HouseholdComponent"
import AccountComponent from "./AccountComponent"
import { Menu, Settings, LogOut, Users, ChevronDown, Crown, CreditCard, DollarSign } from "lucide-react"


export default function HomeComponent({ user }: { user: any }) {
  const [activeView, setActiveView] = useState<"expenses" | "household" | "account">("expenses")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasPremium, setHasPremium] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchSubscription = async () => {
      if (!user?.id) return
      try {
        const res = await getUserSubscription(user.id)
        if (!mounted) return
        setHasPremium(Boolean(res?.hasPremium))
      } catch (err) {
        console.error('Failed to fetch subscription status', err)
      }
    }
    fetchSubscription()
    return () => { mounted = false }
  }, [user?.id])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const handleBilling = async () => {
    try {
      setIsProcessing(true)
      const res = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, stripeCustomerId: user?.stripeCustomerId, email: user?.email }),
      })
      if (!res.ok) {
        toast.error('Checkout creation failed.')
        return
      }
      const data = await res.json()
      if (data.url) { window.location.href = data.url; return }
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      await stripe!.redirectToCheckout({ sessionId: data.id })
    } catch (e) {
      console.error('handleBilling error', e)
      toast.error('Billing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const navItems = [
    { id: 'expenses' as const, icon: DollarSign, label: 'Expenses' },
    { id: 'household' as const, icon: Users, label: 'Household' },
    { id: 'account' as const, icon: Settings, label: 'Account Settings' },
  ]

  const renderActiveView = () => {
    if (activeView === 'expenses') return <Expenses user={user} />
    if (activeView === 'household') return <HouseholdComponent user={user} />
    if (activeView === 'account') return <AccountComponent user={user} hasPremium={hasPremium} onBilling={handleBilling} />
    return <Expenses user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            <span className="text-xl font-semibold text-gray-900">Splittra</span>
          </div>

          {/* Desktop Profile Menu */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <button
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowProfileDropdown((v) => !v)}
              >
                <div className="flex items-center gap-2">
                  <img src={user?.profilePicture || '/default-avatar.jpg'} alt="Profile" className="w-8 h-8 rounded-full border object-cover" />
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'User'}</div>
                    {hasPremium && (
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">Premium</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => { setActiveView('account'); setShowProfileDropdown(false) }}
                  >
                    <Settings className="w-4 h-4" /> Account Settings
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button className="p-2 rounded-lg hover:bg-gray-100" onClick={() => setIsSidebarOpen(!isSidebarOpen)} aria-label="Toggle sidebar">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col min-h-[calc(100vh-68px)] max-w-7xl mx-auto w-full">
        {/* Mobile header for navigation */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 p-4">
          <div className="flex items-center">
            <span className="font-medium">{navItems.find(i => i.id === activeView)?.label}</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden h-full">
          {/* Sidebar */}
          <aside
            className={`lg:w-64 w-full bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${isSidebarOpen ? 'block' : 'hidden'} lg:relative fixed inset-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            {/* Mobile drawer header */}
            <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                <span className="text-base font-semibold">Menu</span>
              </div>
              <button className="rounded-md p-2 hover:bg-gray-100" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <nav className="h-[calc(100vh-56px)] lg:h-full overflow-y-auto p-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-2 transition-colors ${activeView === item.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  onClick={() => { setActiveView(item.id); setIsSidebarOpen(false) }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              {/* Mobile profile section */}
              <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <img src={user?.profilePicture || '/default-avatar.jpg'} alt="Profile" className="w-10 h-10 rounded-full border object-cover" />
                  <div>
                    <div className="font-medium text-gray-900">{user?.name || user?.email || 'User'}</div>
                    {hasPremium && (
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">Premium</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 mb-1" onClick={() => { setActiveView('account'); setIsSidebarOpen(false) }}>
                  <Settings className="w-5 h-5" /> Account Settings
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-0 lg:p-4">
            {renderActiveView()}
          </main>
        </div>
      </div>
    </div>
  )
}