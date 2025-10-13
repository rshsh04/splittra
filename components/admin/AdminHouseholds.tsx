'use client'
import { useState, useEffect } from 'react'
import { 
  Home, 
  Search, 
  Users, 
  Calendar, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Key,
  Crown
} from 'lucide-react'

// Mock toast for demo
const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg)
}

// Mock admin context - remove this in production and use real context
const useAdmin = () => ({
  supabase: {
    from: (table: string) => ({
      select: (query: string, options?: any) => {
        const queryBuilder = {
          or: function(condition: string) { return queryBuilder },
          order: function(field: string, options: any) { return queryBuilder },
          range: function(start: number, end: number) { return queryBuilder }
        }
        return Promise.resolve({ data: [], error: null, count: 0 })
      }
    })
  }
})

interface User {
  id: number
  name: string | null
  email: string | null
}

interface HouseholdMember {
  user: User
}

interface Household {
  id: number
  created_at: string
  code: string | null
  householdName: string | null
  owner_id: number
  owner: User
  members: HouseholdMember[]
}

export default function AdminHouseholds() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)

  const { supabase } = useAdmin()

  const fetchHouseholds = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query directly with Supabase using proper foreign key references
      let query = supabase
        .from('household')
        .select(`
          *,
          owner:users!household_owner_id_fkey (
            id, 
            name, 
            email
          ),
          members:household_members (
            user:users!household_members_user_id_fkey (
              id, 
              name, 
              email
            )
          )
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.filter('householdName', 'ilike', `%${searchTerm}%`).or(`code.ilike.%${searchTerm}%`)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const limit = 20
      const offset = (currentPage - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      setHouseholds(data || [])
      setTotalPages(Math.ceil((count || 0) / limit))
    } catch (error: any) {
      console.error('Failed to fetch households:', error)
      setError(error.message || 'Failed to load households')
      toast.error('Failed to load households')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHouseholds()
  }, [currentPage, sortBy, sortOrder, searchTerm])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && households.length === 0) {
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Home className="w-7 h-7 text-purple-600" />
              Household Management
            </h2>
            <p className="text-slate-600 mt-1">Monitor and manage household structures</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600">Total Households</p>
              <p className="text-2xl font-bold text-slate-800">{households.length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search households..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="householdName-asc">Name A-Z</option>
              <option value="householdName-desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Households Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {households.map((household) => (
          <div key={household.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{household.householdName || 'Unnamed Household'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Key className="w-3 h-3 text-slate-400" />
                    <span className="text-sm text-slate-500 font-mono">{household.code || 'No code'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedHousehold(household)
                  setShowHouseholdModal(true)
                }}
                className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Owner</span>
                <span className="text-sm font-medium text-slate-800">{household.owner?.name || 'Unknown'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Members</span>
                <span className="text-sm font-medium text-slate-800">{(household.members?.length || 0) + 1}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Created</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(household.created_at)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-600">Owner: {household.owner?.email || 'N/A'}</span>
              </div>
              {household.members && household.members.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">Members:</p>
                  <div className="flex flex-wrap gap-1">
                    {household.members.slice(0, 3).map((member, idx) => (
                      <span key={member.user?.id || idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {member.user?.name || 'Unknown'}
                      </span>
                    ))}
                    {household.members.length > 3 && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        +{household.members.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between">
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
        </div>
      )}

      {/* Household Detail Modal */}
      {showHouseholdModal && selectedHousehold && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Household Details</h3>
                <button
                  onClick={() => setShowHouseholdModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <Home className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{selectedHousehold.householdName || 'Unnamed Household'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Key className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 font-mono">{selectedHousehold.code || 'No code'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Created</label>
                  <p className="text-slate-800">{formatDate(selectedHousehold.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Total Members</label>
                  <p className="text-slate-800">{(selectedHousehold.members?.length || 0) + 1}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-3 block">Owner</label>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                      {selectedHousehold.owner?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{selectedHousehold.owner?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-600">{selectedHousehold.owner?.email || 'N/A'}</p>
                    </div>
                    <Crown className="w-5 h-5 text-amber-500 ml-auto" />
                  </div>
                </div>
              </div>

              {selectedHousehold.members && selectedHousehold.members.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-3 block">Members ({selectedHousehold.members.length})</label>
                  <div className="space-y-3">
                    {selectedHousehold.members.map((member, idx) => (
                      <div key={member.user?.id || idx} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{member.user?.name || 'Unknown'}</p>
                            <p className="text-sm text-slate-600">{member.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowHouseholdModal(false)}
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