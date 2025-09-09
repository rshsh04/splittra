// app/login/page.tsx
'use client'
import { Client, Account, OAuthProvider } from 'appwrite'
import { env } from 'process'
import { useState } from 'react'
import Image from 'next/image'
import { FcGoogle } from "react-icons/fc";
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast';


const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '').setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')
const account = new Account(client)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      await account.createEmailPasswordSession(email, password)
    } catch (err) {
      console.error(err)
    }
  }
  const handleGoogleLogin = async () => {
    try {
      await account.createOAuth2Session({ provider: OAuthProvider.Google, success: 'http://localhost:3000/dashboard', failure: 'http://localhost:3000/login' })
    } catch (err) {
      console.error(err)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <Toaster />
      <label className="input validator">
        <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2.5"
            fill="none"
            stroke="currentColor"
          >
            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </g>
        </svg>
        <input type="email" placeholder="mail@site.com" required />
      </label>
      <div className="validator-hint hidden">Enter valid email address</div>

    </div>
  )
}
