
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import useSupabaseUser from '@/hooks/useSupabaseUser'
import LoadingScreen from '@/components/LoadingScreen'
import Footer from '@/components/footer'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loadingSignup, setLoadingSignup] = useState(false)
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
    if (!email || !password || !name) {
      toast.error('All fields are required')
      return false
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleSignup = async () => {
    try {
      setError('')
      setSuccess(false)
      if (!validateForm()) return

      setSuccess(false)
      setLoadingSignup(true)

      const promise = supabase.auth.signUp({ email, password, options: { data: { name } } })

      toast.promise(promise, {
        pending: 'Creating your account...',
        success: 'Account created successfully! 👋',
        error: {
          render({ data }: { data?: any }) {
            const message = data?.error?.message || data?.message || 'Signup failed'
            setError(message)
            return message
          }
        }
      })

      const { data, error } = await promise
      if (error) {
        setLoadingSignup(false)
        return
      }

      // Create users table row if desired (assumes table 'users' exists)
      try {
        await supabase.from('users').insert({ id: data.user?.id, email, name, premiumUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })
      } catch (e) {
        console.error('Failed to create users row:', e)
      }

      setLoadingSignup(false)
      router.push('/dashboard')
    } catch (err: any) {
      setLoadingSignup(false)
      setError(err.message || 'Signup failed')
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + '/dashboard' : '' } })
      if (error) toast.error(error.message)
      // The user row creation should be handled in a server webhook or on first login
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'Google signup failed')
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
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4 relative">
        {/* Loading Overlay */}
        {loadingSignup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <span className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></span>
              <span className="text-xl text-primary font-bold animate-pulse">Creating your account...</span>
            </div>
          </div>
        )}
        <div className={`bg-base-200 rounded-2xl shadow-xl flex flex-col py-8 md:flex-row items-center w-full max-w-5xl overflow-hidden ${loadingSignup ? 'blur-sm pointer-events-none select-none' : ''}`}>

          {/* Image */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center p-6">
            <Image src="/login.png" alt="signup illustration" width={400} height={300} />
          </div>

          {/* Signup Form */}
          <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">Create an Account ✨</h2>
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-yellow-300 rounded-2xl px-4 py-4 mb-6 flex flex-col items-center shadow-lg">
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent animate-pulse rounded-2xl"></div>

              {/* Decorative sparkles */}
              <div className="absolute top-3 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"></div>
              <div className="absolute bottom-4 left-8 w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>

              {/* Content with enhanced styling */}
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 font-bold text-lg drop-shadow-sm">
                  Get 14 days Premium FREE!
                </span>
                <span className="text-yellow-700 text-sm font-medium">
                  No credit card required.
                </span>
                <span className="text-yellow-700 text-sm font-medium">
                  Enjoy all premium features during your trial.
                </span>
              </div>

              {/* Subtle border glow effect */}
              <div className="absolute inset-0 rounded-2xl border border-yellow-300/30 shadow-inner"></div>
            </div>

            {error && <p className="text-red-500 mb-3">{error}</p>}
            {success && (
              <p className="text-green-600 mb-3">
                Account created! You can now{' '}
                <Link href="/login" className="link link-primary">
                  login
                </Link>.
              </p>
            )}

            {/* Google Signup Button */}
            <button
              className="btn bg-base-100 rounded-lg border border-neutral w-full flex items-center gap-2 mb-4 hover:bg-base-200"
              onClick={handleGoogleSignup}
              disabled={loading}
            >
              <svg aria-label="Google logo" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <g>
                  <path d="M0 0h512v512H0z" fill="#fff" />
                  <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341" />
                  <path fill="#4285f4" d="M386 400a140 175 0 0053-179H260v74h102q-7 37-38 57" />
                  <path fill="#fbbc02" d="M90 341a208 200 0 010-171l63 49q-12 37 0 73" />
                  <path fill="#ea4335" d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55" />
                </g>
              </svg>
              Sign up with Google
            </button>

            <p className="text-sm text-gray-500 my-3">— or use your email —</p>

            <label className="input input-bordered w-full mb-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="grow"
                disabled={loadingSignup}
              />
            </label>

            <label className="input input-bordered w-full mb-4 flex items-center gap-2">
              <input
                type="email"
                placeholder="mail@site.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="grow"
                disabled={loadingSignup}
              />
            </label>

            <label className="input input-bordered w-full mb-6 flex items-center gap-2">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="grow"
                disabled={loadingSignup}
              />
            </label>

            <button
              className="btn btn-primary w-full rounded-lg mb-4"
              onClick={handleSignup}
              disabled={loadingSignup}
            >
              Sign up
            </button>

            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="link link-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
