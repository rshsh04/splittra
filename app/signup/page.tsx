'use client'
import { Client, Account, ID, OAuthProvider, Query } from 'appwrite'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/navigation'
import useAppwriteUser from '@/hooks/useAppwriteUser'
import LoadingScreen from '@/components/LoadingScreen'
import Footer from '@/components/footer'
import { databases } from '@/lib/appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

const account = new Account(client)

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loadingSignup, setLoadingSignup] = useState(false)
  const router = useRouter()
  const { user, loading } = useAppwriteUser()

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
  const checkEmailExists = async () => {
    const query = [Query.equal('email', email)]
    try {
      const users = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
        query
      )
      if (users.total > 0) {
        toast.error('Email already exists')
        return false
      }
      return true
    } catch (error) {
      console.error(error)
      toast.error('Failed to check if email exists')
      return false
    }
  }

  const handleSignup = async () => {
    try {
      setError('')
      setSuccess(false)
      if (!validateForm()) return
      if (!(await checkEmailExists())) return

  setSuccess(false)
  setLoadingSignup(true)
      const promise = account.create(ID.unique(), email, password, name)

      toast.promise(promise, {
        pending: 'Creating your account...',
        success: 'Account created successfully! 👋',
        error: {
          render({ data }: { data?: Error }) {
            const message = data?.message || 'Signup failed'
            setError(message)
            return message
          }
        }
      })

      await promise
  setLoadingSignup(false)
      router.push('/dashboard')
    } catch (err: any) {
  setLoadingSignup(false)
      setError(err.message || 'Signup failed')
    }
  }

  const handleGoogleSignup = async () => {
    try {
      await account.createOAuth2Session({
        provider: OAuthProvider.Google,
        success: 'http://localhost:3000/dashboard',
        failure: 'http://localhost:3000/signup'
      })
    } catch (err) {
      console.error(err)
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
            <h2 className="text-2xl font-bold mb-6 text-center">Create an Account ✨</h2>

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
