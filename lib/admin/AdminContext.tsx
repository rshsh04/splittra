'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient, User } from '@supabase/supabase-js'

interface AdminUser {
  id: number
  name: string
  email: string
  is_admin: boolean
  created_at: string
}

interface AdminContextType {
  supabase: SupabaseClient
  user: AdminUser | null
  authUser: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

interface AdminProviderProps {
  children: ReactNode
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        supabase.auth.setSession(session)
      }
    }
    setupAuth()
    
    let mounted = true

    const checkAuth = async () => {
      try {
        setError(null)
        // Get the current session and user
        const { data: { session } } = await supabase.auth.getSession()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (session?.access_token) {
          await supabase.auth.setSession(session)
        }
        
        console.log('AdminContext: Auth check', { 
          authUser: authUser?.id, 
          session: session?.access_token ? 'present' : 'missing',
          authError 
        })
        
        if (!mounted) return
        
        if (authError || !authUser) {
          console.log('AdminContext: No auth user, clearing state')
          setUser(null)
          setAuthUser(null)
          setLoading(false)
          return
        }

        setAuthUser(authUser)

        // Get user profile with admin check
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, name, email, is_admin, created_at')
          .eq('auth_id', authUser.id)
          .single()

        console.log('AdminContext: Profile check', { userProfile, profileError })

        if (!mounted) return

        if (profileError || !userProfile) {
          console.log('AdminContext: Profile error or not found')
          setError('Failed to load user profile')
          setUser(null)
          setLoading(false)
          return
        }

        if (!userProfile.is_admin) {
          console.log('AdminContext: User is not admin')
          setError('Access denied. Admin privileges required.')
          setUser(null)
          setLoading(false)
          return
        }

        console.log('AdminContext: Setting admin user', userProfile)
        setUser(userProfile)
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Authentication failed')
          setUser(null)
          setAuthUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setAuthUser(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' && session.user) {
        // Re-check auth when signed in
        checkAuth()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setAuthUser(null)
    } catch (error) {
      console.error('Sign out failed:', error)
      throw error
    }
  }

  return (
    <AdminContext.Provider value={{
      supabase,
      user,
      authUser,
      loading,
      error,
      signOut
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}