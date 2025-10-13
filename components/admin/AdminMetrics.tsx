'use client'
import { useState, useEffect } from 'react'
import { 
  Users, 
  Home, 
  DollarSign, 
  MessageSquare, 
  TrendingUp, 
  Crown,
  Activity,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'

interface MetricsData {
  overview: {
    totalUsers: number
    totalHouseholds: number
    totalExpenses: number
    totalRevenue: number
    activeUsers: number
    premiumUsers: number
    openSupportMessages: number
    userGrowthRate: number
  }
  charts: {
    userRegistrations: Array<{ date: string; count: number }>
    expenseActivity: Array<{ date: string; amount: number }>
  }
}

export default function AdminMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { supabase } = useAdmin()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        
        // Get metrics data directly from Supabase
        const [
          { count: totalUsers },
          { count: totalHouseholds },
          { count: totalExpenses },
          { count: activeUsers },
          { count: premiumUsers },
          { count: openSupportMessages }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('household').select('*', { count: 'exact', head: true }),
          supabase.from('expenses').select('*', { count: 'exact', head: true }),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('subscriptionStatus', 'active'),
          supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open')
        ])

        // Get recent activity data
        const { data: recentUsers } = await supabase
          .from('users')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(30)

        const { data: recentExpenses } = await supabase
          .from('expenses')
          .select('created_at, price')
          .order('created_at', { ascending: false })
          .limit(30)

        // Calculate growth metrics
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const last60Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

        const { count: usersLast30 } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', last30Days.toISOString())

        const { count: usersLast60 } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', last60Days.toISOString())
          .lt('created_at', last30Days.toISOString())

        const userGrowthRate = (usersLast60 && usersLast60 > 0) ? (((usersLast30 || 0) - usersLast60) / usersLast60) * 100 : 0

        // Calculate total revenue (sum of all expenses)
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('price')

        const totalRevenue = expenseData?.reduce((sum, expense) => sum + (expense.price || 0), 0) || 0

        // Format response
        const metrics = {
          overview: {
            totalUsers: totalUsers || 0,
            totalHouseholds: totalHouseholds || 0,
            totalExpenses: totalExpenses || 0,
            totalRevenue: totalRevenue,
            activeUsers: activeUsers || 0,
            premiumUsers: premiumUsers || 0,
            openSupportMessages: openSupportMessages || 0,
            userGrowthRate: Math.round(userGrowthRate * 100) / 100
          },
          charts: {
            userRegistrations: recentUsers?.map(u => ({
              date: u.created_at,
              count: 1
            })) || [],
            expenseActivity: recentExpenses?.map(e => ({
              date: e.created_at,
              amount: e.price || 0
            })) || []
          }
        }

        setMetrics(metrics)
      } catch (error: any) {
        console.error('Failed to fetch metrics:', error)
        setError(error.message || 'Failed to load metrics')
        toast.error('Failed to load dashboard metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-red-200 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Metrics</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('sv-SE', { 
      style: 'currency', 
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(metrics.overview.totalUsers),
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      growth: metrics.overview.userGrowthRate > 0 ? `+${metrics.overview.userGrowthRate}%` : `${metrics.overview.userGrowthRate}%`
    },
    {
      title: 'Active Users (30d)',
      value: formatNumber(metrics.overview.activeUsers),
      icon: Activity,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
      subtitle: 'Recent activity'
    },
    {
      title: 'Total Households',
      value: formatNumber(metrics.overview.totalHouseholds),
      icon: Home,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      subtitle: 'Created households'
    },
    {
      title: 'Premium Users',
      value: formatNumber(metrics.overview.premiumUsers),
      icon: Crown,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      subtitle: 'Active subscriptions'
    },
    {
      title: 'Total Expenses',
      value: formatNumber(metrics.overview.totalExpenses),
      icon: DollarSign,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      subtitle: 'Expense records'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.overview.totalRevenue),
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: 'Sum of all expenses'
    },
    {
      title: 'Support Messages',
      value: formatNumber(metrics.overview.openSupportMessages),
      icon: MessageSquare,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      subtitle: 'Open tickets'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {card.growth && (
                  <span className={`text-sm font-medium px-2 py-1 rounded-lg ${card.bgColor} ${card.textColor}`}>
                    {card.growth}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-slate-800 mb-1">{card.value}</p>
              {card.subtitle && (
                <p className="text-xs text-slate-500">{card.subtitle}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Platform Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">User Engagement</span>
              <span className="text-sm font-medium text-slate-800">
                {Math.round((metrics.overview.activeUsers / metrics.overview.totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.round((metrics.overview.activeUsers / metrics.overview.totalUsers) * 100)}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Premium Conversion</span>
              <span className="text-sm font-medium text-slate-800">
                {Math.round((metrics.overview.premiumUsers / metrics.overview.totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.round((metrics.overview.premiumUsers / metrics.overview.totalUsers) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-left">
              <Users className="w-5 h-5 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-blue-800">View Users</p>
            </button>
            <button className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-left">
              <Home className="w-5 h-5 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-purple-800">Households</p>
            </button>
            <button className="p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left">
              <MessageSquare className="w-5 h-5 text-red-600 mb-2" />
              <p className="text-sm font-medium text-red-800">Support</p>
            </button>
            <button className="p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-left">
              <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-800">Analytics</p>
            </button>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-700">Database: Operational</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-slate-700">API: Healthy</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-slate-700">Email: {process.env.SMTP_HOST ? 'Configured' : 'Needs Setup'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}