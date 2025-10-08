'use client'
import { Suspense, useState, useEffect } from 'react'
import Image from 'next/image'
import { TbPassword } from 'react-icons/tb'
import { toast } from 'react-toastify'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/header'
import LoadingScreen from '@/components/LoadingScreen'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import { useI18n } from '@/lib/i18n/LocaleProvider'

function LoginPageInner() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { user, loading } = useSupabaseUser()
  const search = useSearchParams()
  const nextPath = search?.get('next') || '/dashboard'
  const supabase = createClient()
  const { t } = useI18n()

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(nextPath)
    }
  }, [user, loading, router, nextPath])
  if (loading) {
    return <LoadingScreen />
  }

  const validateForm = () => {
    if (!email || !password) {
      toast.error(t('emailPasswordRequired'))
      return false
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error(t('invalidEmail'))
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateForm()) return
    const promise = supabase.auth.signInWithPassword({ email, password })

    toast.promise(promise, {
      pending: t('loggingIn'),
      success: t('loginSuccess'),
      error: {
        render({ data }: { data?: any }) {
          const message = data?.error?.message || data?.message || t('loginFailedGeneric')
          return message
        }
      }
    })

    const { data, error } = await promise
    if (error) {
      toast.error(error.message)
      return
    }
    router.push(nextPath)
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + (nextPath || '/dashboard') : '' } })
      if (error) toast.error(error.message)
    } catch (err: any) {
      toast.error(err?.message || t('googleLoginFailed'))
    }
  }


  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
        <div className="bg-base-200 rounded-2xl shadow-xl py-8 flex flex-col md:flex-row items-center w-full max-w-5xl overflow-hidden">
          {/* Image */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center p-6">
            <Image src="/login.png" alt="login illustration" width={400} height={300} />
          </div>

          {/* Form */}
          <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">{t('welcomeBack')}</h2>

            <button
              className="btn bg-base-100 rounded-lg border border-neutral w-full flex items-center gap-2 mb-4 hover:bg-base-200"
              onClick={handleGoogleLogin}
            >
              {/* Google SVG */}
              <svg aria-label="Google logo" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <g>
                  <path d="M0 0h512v512H0z" fill="#fff" />
                  <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341" />
                  <path fill="#4285f4" d="M386 400a140 175 0 0053-179H260v74h102q-7 37-38 57" />
                  <path fill="#fbbc02" d="M90 341a208 200 0 010-171l63 49q-12 37 0 73" />
                  <path fill="#ea4335" d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55" />
                </g>
              </svg>
              {t('loginWithGoogle')}
            </button>

            <p className="text-sm text-gray-500 my-3">{t('orUseEmail')}</p>

            <label className="input input-bordered w-full mb-4 flex items-center gap-2">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="grow"
              />
            </label>
            <div className="w-full mb-4 flex flex-col">
            <label className="input input-bordered w-full mb-1 flex items-center gap-2">
              <TbPassword className="h-[1.2em] opacity-50" />
              <input
                type="password"
                placeholder={t('passwordPlaceholder').toLowerCase()}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="grow"
              />
              
            </label>
            <p className="text-sm text-gray-600 flex justify-end w-full mb-1">
              {t('forgotPasswordQuestion')} {' '}
              <Link href="/reset-password" className="link link-primary">
                {t('resetIt')}
              </Link>
            </p>
            </div>

            <button
              className="btn btn-primary w-full rounded-lg mb-4"
              onClick={handleLogin}
            >
              {t('loginAction')}
            </button>

            <p className="text-sm text-gray-600">
              {t('dontHaveAccount')} {' '}
              <Link href="/signup" className="link link-primary">
                {t('signUpLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function LoginFallback() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
      <div className="bg-base-200 rounded-2xl shadow-xl py-8 w-full max-w-md text-center">
        <h2 className="text-xl font-semibold">{t('loadingEllipsis')}</h2>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={<LoginFallback />}>
        <LoginPageInner />
      </Suspense>
    </>
  )
}
