'use client'
import Header from '@/components/header'
import Footer from '@/components/footer'

export default function VerifyPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center  px-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl py-12 px-8 flex flex-col items-center w-full max-w-md border border-base-300 animate-fade-in">
          <svg width="64" height="64" fill="none" viewBox="0 0 24 24" className="mb-4 text-success">
            <circle cx="12" cy="12" r="12" fill="#22c55e" />
            <path d="M7 13l3 3 7-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 className="text-3xl font-bold mb-2 text-primary text-center">Verify Your Email</h2>
          <p className="text-lg text-gray-700 mb-6 text-center">A verification link has been sent to your email address. Please check your inbox and follow the link to verify your account.</p>
          <a href="/login" className="btn btn-primary w-full rounded-lg">Go to Login</a>
        </div>
      </div>
      <Footer />
    </>
  )
}
