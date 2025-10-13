'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'
import { Menu } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminMetrics from '@/components/admin/AdminMetrics'
import AdminSupportMessages from '@/components/admin/AdminSupportMessages'
import AdminUsers from '@/components/admin/AdminUsers'
import AdminHouseholds from '@/components/admin/AdminHouseholds'
import AdminExpenses from '@/components/admin/AdminExpenses'
import AdminAnalytics from '@/components/admin/AdminAnalytics'
import LoadingScreen from '@/components/LoadingScreen'

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'support' | 'users' | 'households' | 'expenses' | 'analytics'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const { user, loading, error, signOut } = useAdmin()

  // Handle auth state changes in useEffect to avoid render-time redirects
  useEffect(() => {
    if (!loading && (!user || error)) {
      router.push('/admin/login')
    }
  }, [user, loading, error, router])

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />
  }

  // If no user or error, show nothing while redirecting
  if (!user || error) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/admin/login')
    } catch (error) {
      console.error('Sign out failed:', error)
      toast.error('Failed to sign out')
    }
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return <AdminMetrics />
      case 'support':
        return <AdminSupportMessages />
      case 'users':
        return <AdminUsers />
      case 'households':
        return <AdminHouseholds />
      case 'expenses':
        return <AdminExpenses />
      case 'analytics':
        return <AdminAnalytics />
      default:
        return <AdminMetrics />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        user={user}
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onSignOut={handleSignOut}
      />

      {/* Main content */}
      <div className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {activeView === 'overview' && 'Dashboard Overview'}
                  {activeView === 'support' && 'Support Messages'}
                  {activeView === 'users' && 'User Management'}
                  {activeView === 'households' && 'Household Management'}
                  {activeView === 'expenses' && 'Expense Management'}
                  {activeView === 'analytics' && 'Advanced Analytics'}
                </h1>
                <p className="text-sm text-slate-600">
                  {activeView === 'overview' && 'Platform analytics and insights'}
                  {activeView === 'support' && 'Manage customer support requests'}
                  {activeView === 'users' && 'View and manage user accounts'}
                  {activeView === 'households' && 'Monitor household activity'}
                  {activeView === 'expenses' && 'Manage expense records and transactions'}
                  {activeView === 'analytics' && 'Detailed insights and performance metrics'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user.name || 'Admin'}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {renderActiveView()}
        </main>
      </div>
    </div>
  )
}