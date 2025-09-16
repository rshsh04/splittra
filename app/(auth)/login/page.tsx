
'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TbPassword } from 'react-icons/tb'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/header'
import LoadingScreen from '@/components/LoadingScreen'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'
import useSupabaseUser from '@/hooks/useSupabaseUser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { user, loading } = useSupabaseUser()
  const supabase = createClient()

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])
  if (loading) {
    return <LoadingScreen />
  }

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Email and password are required')
      return false
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateForm()) return
    const promise = supabase.auth.signInWithPassword({ email, password })

    toast.promise(promise, {
      pending: 'Logging in...',
      success: 'Login successful! 👋',
      error: {
        render({ data }: { data?: any }) {
          const message = data?.error?.message || data?.message || 'Login failed'
          return message
        }
      }
    })

    const { data, error } = await promise
    if (error) {
      toast.error(error.message)
      return
    }
    router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + '/dashboard' : '' } })
      if (error) toast.error(error.message)
    } catch (err: any) {
      toast.error(err?.message || 'Google login failed')
    }
  }


  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
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
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
        <div className="bg-base-200 rounded-2xl shadow-xl py-8 flex flex-col md:flex-row items-center w-full max-w-5xl overflow-hidden">
          {/* Image */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center p-6">
            <Image src="/login.png" alt="login illustration" width={400} height={300} />
          </div>

          {/* Form */}
          <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back 👋</h2>

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
              Login with Google
            </button>

            <p className="text-sm text-gray-500 my-3">— or use your email —</p>

            <label className="input input-bordered w-full mb-4 flex items-center gap-2">
              <input
                type="email"
                placeholder="mail@site.com"
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
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="grow"
              />
              
            </label>
            <p className="text-sm text-gray-600 flex justify-end w-full mb-1">
              Forgot your password?{' '}
              <Link href="/reset-password" className="link link-primary">
                Reset it
              </Link>
            </p>
            </div>

            <button
              className="btn btn-primary w-full rounded-lg mb-4"
              onClick={handleLogin}
            >
              Login
            </button>

            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="link link-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
