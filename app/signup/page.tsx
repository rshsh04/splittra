'use client'
import { Client, Account, ID, OAuthProvider } from 'appwrite'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { useRouter } from 'next/navigation'
import useAppwriteUser from '@/hooks/useAppwriteUser'
import LoadingScreen from '@/components/LoadingScreen'

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
  const handleSignup = async () => {
    try {
      setError('')
      await account.create(ID.unique(), email, password, name)
      router.push('/dashboard')
    } catch (err: any) {
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
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-base-300 px-4">
        <div className="bg-base-200 rounded-2xl shadow-xl flex flex-col py-8 md:flex-row items-center w-full max-w-5xl overflow-hidden">
          
          {/* Image */}
          <div className="hidden md:flex md:w-1/2 justify-center items-center bg-base-100 p-6">
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
            >
              <svg aria-label="Google logo" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <g>
                  <path d="M0 0h512v512H0z" fill="#fff"/>
                  <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"/>
                  <path fill="#4285f4" d="M386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"/>
                  <path fill="#fbbc02" d="M90 341a208 200 0 010-171l63 49q-12 37 0 73"/>
                  <path fill="#ea4335" d="M153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"/>
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
              />
            </label>

            <button
              className="btn btn-primary w-full rounded-lg mb-4"
              onClick={handleSignup}
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
    </>
  )
}
