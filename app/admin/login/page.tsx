'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'
import { Shield, Lock, User } from 'lucide-react'
import LoadingScreen from '@/components/LoadingScreen'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [logging, setLogging] = useState(false)
  const router = useRouter()
  // We'll read URL search params inside useEffect via window.location
  const { supabase, user, authUser, loading, error } = useAdmin()

  useEffect(() => {
    console.log('AdminLogin: Auth state', { loading, user: user?.id, authUser: authUser?.id, error })
    
    // If already authenticated as admin, redirect to dashboard
    if (!loading && user && authUser) {
      console.log('AdminLogin: Already authenticated, redirecting to admin')
      router.push('/admin')
      return
    }

    // Show error messages from URL params or context
    const urlError = ((): string | null => {
      if (typeof window === 'undefined') return null
      try {
        const params = new URLSearchParams(window.location.search)
        return params.get('error')
      } catch (e) {
        return null
      }
    })()
    if (urlError === 'unauthorized') {
      toast.error('Access denied. Admin privileges required.')
    } else if (urlError === 'auth_failed') {
      toast.error('Authentication failed. Please try again.')
    } else if (urlError === 'system_error') {
      toast.error('System error occurred. Please try again.')
    } else if (error) {
      toast.error(error)
    }
  }, [user, authUser, loading, error, router])

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />
  }

  // If user is authenticated but not admin, show error
  if (authUser && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-4">Admin privileges required to access this area.</p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  const validateForm = () => {
    if (!email || !password) {
      toast.error('Email and password are required')
      return false
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Invalid email format')
      return false
    }
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || logging) return
    
    setLogging(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Login attempt result:', { data: data?.user?.id, error })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        // Check admin role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('is_admin, name')
          .eq('auth_id', data.user.id)
          .single()

        console.log('Admin check result:', { userProfile, profileError })

        if (profileError || !userProfile) {
          await supabase.auth.signOut()
          toast.error('User profile not found')
          return
        }

        if (!userProfile.is_admin) {
          await supabase.auth.signOut()
          toast.error('Access denied. Admin privileges required.')
          return
        }

        toast.success(`Welcome back, ${userProfile.name || 'Admin'}!`)
        
        // Wait a bit longer for the session to be properly established
        console.log('Login successful, redirecting in 500ms...')
        setTimeout(() => {
          window.location.href = '/admin'
        }, 500)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-slate-600 to-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
          <p className="text-slate-600 mt-2">Sign in to access the admin dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
                placeholder="admin@splittra.se"
                disabled={logging}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
                placeholder="••••••••"
                disabled={logging}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={logging}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            {logging ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Restricted access only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  )
}