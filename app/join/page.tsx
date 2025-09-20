"use client"
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { useI18n } from '@/lib/i18n/LocaleProvider'

export default function JoinPage() {
  const router = useRouter()
  const search = useSearchParams()
  const code = useMemo(() => (search?.get('code') || '').trim(), [search])
  const { user, loading } = useSupabaseUser()
  const supabase = createClient()
  const { t } = useI18n()
  const [message, setMessage] = useState<string>('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const run = async () => {
      if (!code) {
        setMessage(t('noCodeProvided') || 'No invite code provided.')
        return
      }
      if (loading) return
      if (!user) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const nextUrl = `/join?code=${encodeURIComponent(code)}`
        router.replace(`/login?next=${encodeURIComponent(nextUrl)}`)
        return
      }

      try {
        setBusy(true)
        setMessage(t('joining') || 'Joining...')
        const { data: household, error: hhErr } = await supabase
          .from('household')
          .select('*')
          .eq('code', code)
          .maybeSingle()
        if (hhErr) throw hhErr
        if (!household) {
          setMessage(t('invalidInviteLink') || 'Invalid or expired invite link.')
          setBusy(false)
          return
        }

        const userId = user.id
        if (String(user.household_id || '') === String(household.id)) {
          router.replace('/dashboard')
          return
        }

        const members: any[] = Array.isArray(household.members) ? household.members : []
        if (members.map(String).includes(String(userId))) {
          // Already in members; make sure user.household_id set
          await supabase.from('users').update({ household_id: household.id }).eq('id', userId)
          router.replace('/dashboard')
          return
        }

        const newMembers = [...members, userId]
        const { error: updateErr } = await supabase
          .from('household')
          .update({ members: newMembers })
          .eq('id', household.id)
        if (updateErr) throw updateErr

        const { error: userErr } = await supabase
          .from('users')
          .update({ household_id: household.id })
          .eq('id', userId)
        if (userErr) throw userErr

        setMessage(t('joinSuccess') || 'Joined household successfully. Redirecting...')
        router.replace('/dashboard')
      } catch (e: any) {
        setMessage(e?.message || 'Failed to join household')
      } finally {
        setBusy(false)
      }
    }
    run()
  }, [code, user, loading, router, supabase, t])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-base-300 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold mb-3">{t('joinHousehold') || 'Join Household'}</h1>
          <p className="text-gray-600 mb-6">{message || (t('joining') || 'Joining...')}</p>
          {!code && (
            <a href="/" className="btn btn-ghost">{t('goHome') || 'Go Home'}</a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
