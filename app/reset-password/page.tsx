'use client'
import { useState } from 'react'
import { Account, Client } from 'appwrite'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from '@/components/header'
import Footer from '@/components/footer'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

const account = new Account(client)

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async () => {
    if (!email) {
      toast.error('Please enter your email to reset password')
      return
    }
    setLoading(true)
    try {
      await account.createRecovery({
        email,
        url: typeof window !== 'undefined' ? window.location.origin + '/recovery' : 'http://localhost:3000/recovery'
        
      })
      toast.success('Password reset link sent to your email')
    } catch (err) {
      toast.error('Failed to send reset link')
      console.error(err)
    } finally {
      setLoading(false)
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
        <div className="bg-base-200 rounded-2xl shadow-2xl py-10 px-8 flex flex-col items-center w-full max-w-md overflow-hidden border border-base-300">
          <h2 className="text-3xl font-bold mb-4 text-center text-primary">Reset Your Password</h2>
          <p className="text-base text-gray-500 mb-6 text-center">Enter your email address below and we'll send you a link to reset your password.</p>
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
          <button
            className="btn btn-primary w-full rounded-lg mb-4"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Password Reset Link'}
          </button>
          <p className="text-sm text-gray-600 text-center mb-2">
            Need help? <a href="/support" className="link link-primary">Contact Support</a>
          </p>
          <p className="text-sm text-gray-600 text-center">
            <a href="/login" className="link link-secondary">Back to Login</a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  )
}
