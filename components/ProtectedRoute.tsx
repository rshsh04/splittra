import { useRouter } from 'next/navigation'
import { useEffect, ReactElement, cloneElement } from 'react'
import useSupabaseUser from '@/hooks/useSupabaseUser'

interface ProtectedRouteProps {
  children: ReactElement<{ user?: any }>
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useSupabaseUser()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) return <div>Checking auth...</div>

  // Pass the user down as a prop
  return user ? cloneElement(children, { user }) : null
}
