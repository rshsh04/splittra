'use client'
import { useState, Suspense } from 'react'
import { Account, Client } from 'appwrite'
import { Bounce, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { useRouter, useSearchParams } from 'next/navigation'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')

const account = new Account(client)

function RecoveryPageInner() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') || ''
  const secret = searchParams.get('secret') || ''

  // Password validation states
  const passwordValidations = [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(password) },
  ];
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const canSubmit = passwordValidations.every(v => v.valid) && passwordsMatch && userId && secret;

  const handleRecover = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await account.updateRecovery({ userId, secret, password });
      toast.success('Password updated! You can now log in.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error('Failed to update password');
      console.error(err);
    } finally {
      setLoading(false);
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
