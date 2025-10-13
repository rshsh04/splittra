'use client'
import { useState, useEffect, useCallback } from 'react'
import { 
  Users, 
  Search, 
  Crown,
  Shield,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'

interface User {
  id: number
  name: string
  email: string
  created_at: string
  subscriptionStatus: string | null
  is_admin: boolean
  current_household: { id: number; householdName: string; code: string } | null
  households: {
    household: { id: number; householdName: string; code: string }
  }[]
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { supabase } = useAdmin()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query directly with Supabase
      let query = supabase
        .from('users')
        .select(`
          *,
          current_household:current_household_id(id, householdName, code),
          households:household_members(
            household:household_id(id, householdName, code)
          )
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }
      if (subscriptionFilter) {
        query = query.eq('subscriptionStatus', subscriptionFilter)
      }
      if (adminFilter !== '') {
        query = query.eq('is_admin', adminFilter === 'true')
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const limit = 20
      const offset = (currentPage - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: users, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      setUsers(users || [])
      setTotalPages(Math.ceil((count || 0) / limit))
    } catch (err: unknown) {
      const error = err as Error
      console.error('Failed to fetch users:', error)
      setError(error.message || 'Failed to load users')
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [currentPage, sortBy, sortOrder, searchTerm, subscriptionFilter, adminFilter, supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleUserAction = async (userId: number, action: string, data?: Record<string, unknown>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }

      toast.success(`User ${action} successfully`)
      fetchUsers()
    } catch (err: unknown) {
      const error = err as Error
      console.error(`Failed to ${action} user:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSubscriptionBadge = (status: string | null) => {
    if (!status) return { text: 'Free', color: 'bg-gray-100 text-gray-700' }
    
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'active': { text: 'Active', color: 'bg-green-100 text-green-700' },
      'trialing': { text: 'Trial', color: 'bg-blue-100 text-blue-700' },
      'past_due': { text: 'Past Due', color: 'bg-yellow-100 text-yellow-700' },
      'canceled': { text: 'Canceled', color: 'bg-red-100 text-red-700' },
      'incomplete': { text: 'Incomplete', color: 'bg-orange-100 text-orange-700' }
    }
    
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' }
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
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
              <Users className="w-7 h-7 text-blue-600" />
              User Management
            </h2>
            <p className="text-slate-600 mt-1">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="trialing">Trial</option>
            <option value="canceled">Canceled</option>
            <option value="past_due">Past Due</option>
          </select>

          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            <option value="true">Admins Only</option>
            <option value="false">Regular Users</option>
          </select>

          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
            </select>
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Household
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => {
                const subscriptionBadge = getSubscriptionBadge(user.subscriptionStatus)
                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{user.name || 'No Name'}</div>
                          <div className="text-sm text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${subscriptionBadge.color}`}>
                        {subscriptionBadge.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        {user.current_household?.householdName || (user.households?.[0]?.household?.householdName) || 'No Household'}
                      </div>
                      {user.current_household?.code && (
                        <div className="text-xs text-slate-500">Code: {user.current_household.code}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          <Users className="w-3 h-3 mr-1" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserModal(true)
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user.id, 'toggle admin', { is_admin: !user.is_admin })}
                          className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                          title={user.is_admin ? "Remove Admin" : "Make Admin"}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-2 text-sm font-medium text-slate-700">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                  {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{selectedUser.name || 'No Name'}</h4>
                  <p className="text-slate-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedUser.is_admin && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </span>
                    )}
                    {getSubscriptionBadge(selectedUser.subscriptionStatus).text !== 'Free' && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Joined</label>
                  <p className="text-slate-800">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Subscription</label>
                  <p className="text-slate-800">{getSubscriptionBadge(selectedUser.subscriptionStatus).text}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Current Household</label>
                  <p className="text-slate-800">
                    {selectedUser.current_household?.householdName || (selectedUser.households?.[0]?.household?.householdName) || 'None'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Household Code</label>
                  <p className="text-slate-800">
                    {selectedUser.current_household?.code || (selectedUser.households?.[0]?.household?.code) || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleUserAction(selectedUser.id, 'toggle admin', { is_admin: !selectedUser.is_admin })}
                  className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  {selectedUser.is_admin ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
