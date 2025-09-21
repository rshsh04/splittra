'use client'
import { useEffect, useMemo, useState, Suspense } from 'react'

import { toast } from 'react-toastify'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function RecoveryPageInner() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const tokens = useMemo(() => {
    const qAccess = searchParams?.get('access_token') || null
    const qRefresh = searchParams?.get('refresh_token') || null
    let hAccess: string | null = null
    let hRefresh: string | null = null
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      hAccess = hash.get('access_token')
      hRefresh = hash.get('refresh_token')
    }
    return { access_token: qAccess || hAccess, refresh_token: qRefresh || hRefresh }
  }, [searchParams])

  useEffect(() => {
    if (tokens.access_token && tokens.refresh_token) {
      supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }).catch((err) => console.warn('Failed to set session from recovery link', err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.access_token, tokens.refresh_token])

  // Password validation states
  const passwordValidations = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
  ];
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const canSubmit = passwordValidations.every(v => v.valid) && passwordsMatch;

  const handleRecover = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated! You are now signed in.');
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      toast.error('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>

      <Header />
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
        <div className="bg-base-200 rounded-2xl shadow-2xl py-10 px-8 flex flex-col items-center w-full max-w-md overflow-hidden border border-base-300">
          <h2 className="text-3xl font-bold mb-4 text-center text-primary">Set New Password</h2>
          <p className="text-base text-gray-500 mb-6 text-center">Enter your new password below to complete your recovery.</p>
          <label className="input input-bordered w-full mb-4 flex items-center gap-2">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="grow"
            />
          </label>
          <label className="input input-bordered w-full mb-4 flex items-center gap-2">
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="grow"
            />
          </label>
          <ul className="text-sm w-full mb-2">
            {passwordValidations.map((v, i) => (
              <li key={i} className={v.valid ? 'text-success' : 'text-error'}>
                {v.valid ? '✓' : '✗'} {v.label}
              </li>
            ))}
            <li className={passwordsMatch ? 'text-success' : 'text-error'}>
              {passwordsMatch ? '✓' : '✗'} Passwords match
            </li>
          </ul>
          <button
            className="btn btn-primary w-full rounded-lg mb-4"
            onClick={handleRecover}
            disabled={loading || !canSubmit}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <p className="text-sm text-gray-600 text-center">
            <a href="/login" className="link link-secondary">Back to Login</a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function RecoveryPage() {
  return (
    <Suspense>
      <RecoveryPageInner />
    </Suspense>
  )
}
