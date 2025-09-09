// app/login/page.tsx
'use client'
import { Client, Account, OAuthProvider } from 'appwrite'
import { env } from 'process'
import { useState } from 'react'

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
      await account.createOAuth2Session(OAuthProvider.Google, '', '')
    } catch (err) {
      console.error(err)
    }
  }
  

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Login</h1>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={handleLogin}>Login</button>
        <button onClick={handleGoogleLogin}>Login with Google</button>
    </div>
  )
}
