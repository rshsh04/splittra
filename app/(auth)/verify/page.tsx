'use client'
import { Suspense, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function VerifyInner() {
  const supabase = createClient()
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
    const run = async () => {
      try {
        if (tokens.access_token && tokens.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })
          if (error) throw error
          toast.success('Email verified! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 1200)
        }
      } catch (err) {
        toast.error('Verification failed')
        console.error(err)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens.access_token, tokens.refresh_token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl py-12 px-8 flex flex-col items-center w-full max-w-md border border-base-300 animate-fade-in">
        <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mb-4 text-success">
          <circle cx="12" cy="12" r="12" fill="#22c55e" />
          <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="text-3xl font-bold mb-2 text-primary text-center">Finalizing Verification</h2>
        <p className="text-lg text-gray-700 mb-2 text-center">Please wait while we verify your email and sign you in.</p>
        <p className="text-sm text-gray-500 text-center">If nothing happens, try the link again or log in.</p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        limit={3}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
      <Header />
      <Suspense>
        <VerifyInner />
      </Suspense>
      <Footer />
    </>
  )
}
