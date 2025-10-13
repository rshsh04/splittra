'use client'
import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Home,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'

interface AnalyticsData {
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
  detailed: {
    userGrowth: Array<{ period: string; count: number; growth: number }>
    revenueByMonth: Array<{ month: string; revenue: number; expenses: number }>
    categoryBreakdown: Array<{ category: string; count: number; total: number }>
    householdStats: Array<{ size: number; count: number; avgExpenses: number }>
  }
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  const { supabase } = useAdmin()

  const fetchAnalytics = async () => {
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
      const analytics = {
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
        },
        detailed: {
          userGrowth: [],
          revenueByMonth: [],
          categoryBreakdown: [],
          householdStats: []
        }
      }

      setAnalytics(analytics)
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error)
      setError(error.message || 'Failed to load analytics')
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAnalytics()
    setRefreshing(false)
    toast.success('Analytics refreshed')
  }

  useEffect(() => {
    fetchAnalytics()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

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

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`
  }

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-red-200 text-center">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Analytics</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-blue-600" />
              Advanced Analytics
            </h2>
            <p className="text-slate-600 mt-1">Detailed insights and performance metrics</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
                analytics.overview.userGrowthRate >= 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {analytics.overview.userGrowthRate >= 0 ? (
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 inline mr-1" />
                )}
                {formatPercentage(analytics.overview.userGrowthRate)}
              </span>
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Users</h3>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(analytics.overview.totalUsers)}</p>
          <p className="text-xs text-slate-500 mt-1">Active: {formatNumber(analytics.overview.activeUsers)}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Households</h3>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(analytics.overview.totalHouseholds)}</p>
          <p className="text-xs text-slate-500 mt-1">Avg: {Math.round(analytics.overview.totalUsers / analytics.overview.totalHouseholds)} users/household</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Revenue</h3>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(analytics.overview.totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-1">From {formatNumber(analytics.overview.totalExpenses)} expenses</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Premium Users</h3>
          <p className="text-2xl font-bold text-slate-800">{formatNumber(analytics.overview.premiumUsers)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {Math.round((analytics.overview.premiumUsers / analytics.overview.totalUsers) * 100)}% conversion rate
          </p>
        </div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">User Growth Trend</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Chart visualization coming soon</p>
              <p className="text-sm text-slate-400">Data points: {analytics.charts.userRegistrations.length}</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">Chart visualization coming soon</p>
              <p className="text-sm text-slate-400">Total: {formatCurrency(analytics.overview.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health Metrics */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">User Engagement</span>
              <span className="text-sm font-medium text-slate-800">
                {Math.round((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.round((analytics.overview.activeUsers / analytics.overview.totalUsers) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Premium Conversion</span>
              <span className="text-sm font-medium text-slate-800">
                {Math.round((analytics.overview.premiumUsers / analytics.overview.totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.round((analytics.overview.premiumUsers / analytics.overview.totalUsers) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Support Load</span>
              <span className="text-sm font-medium text-slate-800">
                {analytics.overview.openSupportMessages} open
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  analytics.overview.openSupportMessages > 10 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : analytics.overview.openSupportMessages > 5
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-r from-green-500 to-green-600'
                }`}
                style={{ width: `${Math.min((analytics.overview.openSupportMessages / 20) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Users (CSV)
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Expenses (CSV)
          </button>
          <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Analytics (PDF)
          </button>
        </div>
      </div>
    </div>
  )
}
