"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from 'react-toastify'
import { loadStripe } from '@stripe/stripe-js'
import { getUserSubscription } from "@/lib/premiumCheck"
import { createClient } from "@/lib/supabase/client"
import Expenses from "./expenses"
import HouseholdComponent from "./HouseholdComponent"
import { fetchHouseholdsForUser, setCurrentHousehold } from "@/lib/expensesService"
import AccountComponent from "./AccountComponent"
import { Menu, Settings, LogOut, Users, ChevronDown, Crown, CreditCard, DollarSign } from "lucide-react"
import { useI18n } from "@/lib/i18n/LocaleProvider"
import LanguageSwitcher from "./LanguageSwitcher"


export default function HomeComponent({ user }: { user: any }) {
  const { t } = useI18n()
  const [activeView, setActiveView] = useState<"expenses" | "household" | "account">("expenses")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [hasPremium, setHasPremium] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [households, setHouseholds] = useState<any[]>([])
  const [switching, setSwitching] = useState(false)
  const [showHHMenu, setShowHHMenu] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const confirmRef = useRef<HTMLDivElement | null>(null)
  const joinRef = useRef<HTMLDivElement | null>(null)
  const switcherBtnRef = useRef<HTMLButtonElement | null>(null)
  const hhMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user?.id) return
      try {
  const list = await fetchHouseholdsForUser(user.id, user.current_household_id)
        if (!mounted) return
        setHouseholds(list || [])
      } catch (e) {
        console.error('Failed to load households', e)
      }
    }
    load()
    // reload when current household changes to keep names fresh
  }, [user?.id, user?.current_household_id])

  const onSwitchHousehold = async (hid: number | string) => {
    try {
      if (!user?.id || !hid || String(hid) === String(user?.current_household_id)) return
      setSwitching(true)
      await setCurrentHousehold(user.id, hid)
      // naive reload to refresh state everywhere
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e) {
      console.error('Failed to switch household', e)
      toast.error(t('failedToSwitchHousehold') || 'Failed to switch household')
    } finally {
      setSwitching(false)
    }
  }

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

  // Close dropdown and inline UI when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        showHHMenu &&
        hhMenuRef.current &&
        !hhMenuRef.current.contains(target) &&
        (!switcherBtnRef.current || !switcherBtnRef.current.contains(target))
      ) {
        setShowHHMenu(false)
        setShowCreateConfirm(false)
        setShowJoinInput(false)
      }
      if (showCreateConfirm && confirmRef.current && !confirmRef.current.contains(target)) {
        setShowCreateConfirm(false)
      }
      if (showJoinInput && joinRef.current && !joinRef.current.contains(target)) {
        setShowJoinInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showHHMenu, showCreateConfirm, showJoinInput])

  // Close dropdown on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHHMenu(false)
        setShowCreateConfirm(false)
        setShowJoinInput(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // If dropdown closes, hide confirmation and input
  useEffect(() => {
    if (!showHHMenu) {
      setShowCreateConfirm(false)
      setShowJoinInput(false)
    }
  }, [showHHMenu])

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
    { id: 'expenses' as const, icon: DollarSign, label: t('expenses') },
    { id: 'household' as const, icon: Users, label: t('household') },
    { id: 'account' as const, icon: Settings, label: t('accountSettings') },
  ]

  const renderActiveView = () => {
    if (activeView === 'expenses') return <Expenses user={user} />
    if (activeView === 'household') return <HouseholdComponent user={user} />
    if (activeView === 'account') return <AccountComponent user={user} hasPremium={hasPremium} onBilling={handleBilling} />
    return <Expenses user={user} />
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain" />

            </div>
          </Link>

          {/* Desktop Right Controls */}
          <div className="hidden lg:flex items-center">
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
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
                        <span className="text-xs text-yellow-600 font-medium">{t('premium')}</span>
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
                    <Settings className="w-4 h-4" /> {t('accountSettings')}
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" /> {t('signOut')}
                  </button>
                </div>
              )}
              </div>
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
                <Image src="/logo.png" alt="Logo" width={100} height={100} className="object-contain" />

              </div>
              <button className="rounded-md p-2 hover:bg-gray-100" onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar">
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <nav className="h-[calc(100vh-56px)] lg:h-full overflow-y-auto p-4">
              {/* Household Switcher */}
              <div className="mb-4 relative">
                <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t('householdSwitcher')}</div>
                <button
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                  onClick={() => setShowHHMenu((v) => !v)}
                  ref={switcherBtnRef}
                >
                  <span className="truncate text-sm font-medium text-gray-800">
                    {(households.find(h => String(h.id) === String(user?.current_household_id))?.household_name) ||
                      (households.find(h => String(h.id) === String(user?.current_household_id))?.householdName) ||
                      t('defaultHouseholdName')}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showHHMenu ? 'rotate-180' : ''}`} />
                </button>
                {showHHMenu && (
                  <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-2 overflow-hidden" ref={hhMenuRef}>
                    {households.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">{t('noHouseholds') || 'No households'}</div>
                    )}
                    {households.map((h) => {
                      const isCurrent = String(h.id) === String(user?.current_household_id)
                      const isLocked = !hasPremium && !isCurrent && households.length > 1
                      return (
                        <button
                          key={h.id}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors ${isCurrent ? 'bg-gray-100' : isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                          onClick={() => {
                            if (isLocked) { toast.info(t('premiumRequired') || 'Premium-only feature'); return }
                            onSwitchHousehold(h.id)
                            setShowHHMenu(false)
                            setIsSidebarOpen(false)
                          }}
                          aria-disabled={isLocked}
                        >
                          <span className="truncate">{h.household_name || h.householdName || t('defaultHouseholdName')}</span>
                          {String(h.owner_id) === String(user?.id) && <Crown className="w-3 h-3 text-yellow-500 ml-2" />}
                        </button>
                      )
                    })}
                    <div className="my-2 border-t border-gray-100" />
                    <div className="p-2 w-full">
                      <div className="flex items-stretch gap-2 w-full">
                        <div className="relative group flex-1 min-w-0">
                          {!hasPremium && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                                {t('premiumRequired') || 'Premium-only feature'}
                              </div>
                              <div className="mx-auto h-2 w-2 rotate-45 bg-gray-900 -mt-1" />
                            </div>
                          )}
                          <button
                            className="w-full inline-flex items-center justify-center gap-2 px-3 h-10 text-sm rounded-md bg-gray-700 text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                            onClick={() => {
                              if (!hasPremium) return
                              setShowCreateConfirm(true)
                            }}
                            disabled={!hasPremium}
                          >
                            {!hasPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                            {t('createHousehold')}
                          </button>
                        </div>

                        <div className="relative group flex-1 min-w-0">
                          {!hasPremium && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 shadow whitespace-nowrap">
                                {t('premiumRequired') || 'Premium-only feature'}
                              </div>
                              <div className="mx-auto h-2 w-2 rotate-45 bg-gray-900 -mt-1" />
                            </div>
                          )}
                          <button
                            className="w-full inline-flex items-center justify-center gap-2 px-3 h-10 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed mt-1"
                            onClick={() => setShowJoinInput((v) => !v)}
                            disabled={!hasPremium}
                          >
                            {!hasPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                            {t('join')}
                          </button>
                        </div>
                      </div>
                      {showCreateConfirm && (
                        <div
                          className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-2 w-full max-w-full"
                          ref={confirmRef}
                          tabIndex={-1}
                          onBlur={(e: any) => {
                            const rt = e.relatedTarget as Node | null
                            if (!rt || (confirmRef.current && !confirmRef.current.contains(rt))) {
                              setShowCreateConfirm(false)
                            }
                          }}
                        >
                          <div className="flex items-center justify-between flex-col gap-2 w-full h-full">
                            <span className="flex-1 min-w-0  text-sm text-gray-700 truncate">{t('confirmCreateTitle')}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                className="px-3 h-9 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
                                onClick={() => setShowCreateConfirm(false)}
                              >
                                {t('cancel') || 'Cancel'}
                              </button>
                              <button
                                className="px-3 h-9 rounded-md bg-gray-700 hover:bg-gray-800 text-white text-sm"
                                onClick={async () => {
                                  try {
                                    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
                                    const supabase = createClient()
                                    const { data: household, error: createErr } = await supabase
                                      .from('household')
                                      .insert({ code, owner_id: user.id, householdName: `${user.name || user.email}'s Household` })
                                      .select()
                                      .maybeSingle()
                                    if (createErr) throw createErr
                                    const { error: insErr } = await supabase
                                      .from('household_members')
                                      .insert({ household_id: household.id, user_id: user.id, role: 'owner' })
                                    if (insErr) throw insErr
                                    await setCurrentHousehold(user.id, household.id)
                                    window.location.reload()
                                  } catch (e) {
                                    console.error('Create household failed', e)
                                    toast.error(t('failedToUpdateName'))
                                  } finally {
                                    setShowCreateConfirm(false)
                                  }
                                }}
                              >
                                {t('confirm') || 'Confirm'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {showJoinInput && (
                        <div
                          className="mt-2 bg-gray-50 border border-gray-200 rounded-md p-2 w-full max-w-full"
                          ref={joinRef}
                          tabIndex={-1}
                          onBlur={(e: any) => {
                            const rt = e.relatedTarget as Node | null
                            if (!rt || (joinRef.current && !joinRef.current.contains(rt))) {
                              setShowJoinInput(false)
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <input
                              className="flex-1 min-w-[140px] sm:min-w-0 border rounded-md px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500/40"
                              placeholder={t('enterInviteCode')}
                              value={joinCode}
                              onChange={(e) => setJoinCode(e.target.value)}
                            />
                            <button
                              className="px-2 sm:px-3 h-10 bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md shrink-0"
                              onClick={async () => {
                              const code = (joinCode || '').trim().toUpperCase()
                              if (!code) return
                              try {
                                const supabase = createClient()
                                const { data: household, error: hhErr } = await supabase
                                  .from('household')
                                  .select('*')
                                  .eq('code', code)
                                  .maybeSingle()
                                if (hhErr) throw hhErr
                                if (!household) { toast.error(t('invalidInviteLink')); return }
                                const { data: exists, error: exErr } = await supabase
                                  .from('household_members')
                                  .select('user_id')
                                  .eq('household_id', household.id)
                                  .eq('user_id', user.id)
                                  .maybeSingle()
                                if (exErr) throw exErr
                                if (!exists) {
                                  const { error: insErr } = await supabase
                                    .from('household_members')
                                    .insert({ household_id: household.id, user_id: user.id })
                                  if (insErr) throw insErr
                                }
                                await setCurrentHousehold(user.id, household.id)
                                window.location.reload()
                              } catch (e) {
                                console.error('Join failed', e)
                                toast.error(t('invalidInviteLink'))
                              }
                              }}
                            >
                              {t('join')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-md rounded-lg text-left mb-2 transition-colors ${activeView === item.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  onClick={() => { setActiveView(item.id); setIsSidebarOpen(false) }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              {/* Mobile profile section */}
              <div className="lg:hidden mt-6 pt-6 border-t border-gray-200">
                <div className="px-3 py-2 mb-3"><LanguageSwitcher /></div>
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <img src={user?.profilePicture || '/default-avatar.jpg'} alt="Profile" className="w-10 h-10 rounded-full border object-cover" />
                  <div>
                    <div className="font-medium text-gray-900">{user?.name || user?.email || 'User'}</div>
                    {hasPremium && (
                      <div className="flex items-center gap-1">
                        <Crown className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600 font-medium">{t('premium')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-gray-700 hover:bg-gray-50 hover:text-gray-900 mb-1" onClick={() => { setActiveView('account'); setIsSidebarOpen(false) }}>
                  <Settings className="w-5 h-5" /> {t('accountSettings')}
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50" onClick={handleLogout}>
                  <LogOut className="w-5 h-5" /> {t('signOut')}
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