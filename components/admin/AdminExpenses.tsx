'use client'
import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Search, 
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Home
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
      select: (query: string, options?: any) => Promise.resolve({ data: [], error: null, count: 0 }),
      delete: () => ({
        in: (field: string, values: any[]) => Promise.resolve({ error: null })
      })
    })
  }
})

interface User {
  id: number
  name: string | null
  email: string | null
}

interface Household {
  id: number
  householdName: string | null
  code: string | null
}

interface Expense {
  id: number
  created_at: string
  name: string | null
  price: number | null
  info: string | null
  household_id: number | null
  isLoan: boolean | null
  loanRecipientId: string | null
  category: string[] | null
  userId: number
  users: User
  household: Household | null
}

export default function AdminExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loanFilter, setLoanFilter] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedExpenses, setSelectedExpenses] = useState<number[]>([])
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const { supabase } = useAdmin()

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)
      const limit = 20
      
      let query = supabase
        .from('expenses')
        .select(`
          *,
          users!expenses_userId_fkey (
            id,
            name,
            email
          ),
          household!expenses_household_id_fkey (
            id,
            householdName,
            code
          )
        `, { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,info.ilike.%${searchTerm}%`)
      }
      if (categoryFilter) {
        query = query.contains('category', [categoryFilter])
      }
      if (loanFilter !== '') {
        query = query.eq('isLoan', loanFilter === 'true')
      }
      if (minPrice) {
        query = query.gte('price', parseFloat(minPrice))
      }
      if (maxPrice) {
        query = query.lte('price', parseFloat(maxPrice))
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range((currentPage - 1) * limit, (currentPage * limit) - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching expenses:', error)
        throw error
      }

      setExpenses(data || [])
      setTotalPages(Math.ceil((count || 0) / limit))
    } catch (error: any) {
      console.error('Failed to fetch expenses:', error)
      setError(error.message || 'Failed to load expenses')
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [currentPage, sortBy, sortOrder, searchTerm, categoryFilter, loanFilter, minPrice, maxPrice])

  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .in('id', selectedExpenses)

      if (error) {
        throw new Error(error.message)
      }

      toast.success(`Deleted ${selectedExpenses.length} expenses`)
      setSelectedExpenses([])
      fetchExpenses()
    } catch (error: any) {
      console.error('Failed to delete expenses:', error)
      toast.error('Failed to delete expenses')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { 
      style: 'currency', 
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'food': 'bg-green-100 text-green-700',
      'transport': 'bg-blue-100 text-blue-700',
      'entertainment': 'bg-purple-100 text-purple-700',
      'utilities': 'bg-yellow-100 text-yellow-700',
      'shopping': 'bg-pink-100 text-pink-700',
      'health': 'bg-red-100 text-red-700',
      'other': 'bg-gray-100 text-gray-700'
    }
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700'
  }

  if (loading && expenses.length === 0) {
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
              <DollarSign className="w-7 h-7 text-green-600" />
              Expense Management
            </h2>
            <p className="text-slate-600 mt-1">Monitor and manage expense records</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-600">Total Expenses</p>
              <p className="text-2xl font-bold text-slate-800">{expenses.length}</p>
            </div>
            {selectedExpenses.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedExpenses.length})
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="utilities">Utilities</option>
            <option value="shopping">Shopping</option>
            <option value="health">Health</option>
            <option value="other">Other</option>
          </select>

          <select
            value={loanFilter}
            onChange={(e) => setLoanFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="true">Loans Only</option>
            <option value="false">Regular Expenses</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />

          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="price-desc">Highest Price</option>
              <option value="price-asc">Lowest Price</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExpenses(expenses.map(e => e.id))
                      } else {
                        setSelectedExpenses([])
                      }
                    }}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Expense
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Household
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExpenses([...selectedExpenses, expense.id])
                        } else {
                          setSelectedExpenses(selectedExpenses.filter(id => id !== expense.id))
                        }
                      }}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        expense.isLoan ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {expense.isLoan ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{expense.name || 'Unnamed'}</div>
                        {expense.info && (
                          <div className="text-sm text-slate-500 truncate max-w-xs">{expense.info}</div>
                        )}
                        {expense.isLoan && expense.loanRecipientId && (
                          <div className="text-xs text-orange-600">
                            Loan to ID: {expense.loanRecipientId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(expense.price || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {expense.category && expense.category.length > 0 ? (
                        expense.category.map((cat, index) => (
                          <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(cat)}`}>
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          No category
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{expense.users?.name || 'Unknown'}</div>
                    <div className="text-sm text-slate-500">{expense.users?.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">
                      {expense.household?.householdName || 'No Household'}
                    </div>
                    {expense.household?.code && (
                      <div className="text-xs text-slate-500">Code: {expense.household.code}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {formatDate(expense.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense)
                          setShowExpenseModal(true)
                        }}
                        className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Expense Detail Modal */}
      {showExpenseModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Expense Details</h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  selectedExpense.isLoan ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                }`}>
                  {selectedExpense.isLoan ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownLeft className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-800">{selectedExpense.name || 'Unnamed'}</h4>
                  <p className="text-2xl font-bold text-slate-800">{formatCurrency(selectedExpense.price || 0)}</p>
                  {selectedExpense.isLoan && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 mt-1">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Loan
                    </span>
                  )}
                </div>
              </div>

              {selectedExpense.info && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  <p className="text-slate-800 mt-1">{selectedExpense.info}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Created</label>
                  <p className="text-slate-800">{formatDate(selectedExpense.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Categories</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedExpense.category && selectedExpense.category.length > 0 ? (
                      selectedExpense.category.map((cat, index) => (
                        <span key={index} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(cat)}`}>
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500">No categories</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">User</label>
                <div className="bg-slate-50 rounded-lg p-4 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {selectedExpense.users?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{selectedExpense.users?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-600">{selectedExpense.users?.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedExpense.household && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Household</label>
                  <div className="bg-slate-50 rounded-lg p-4 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <Home className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{selectedExpense.household.householdName}</p>
                        <p className="text-sm text-slate-600">Code: {selectedExpense.household.code}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedExpense.isLoan && selectedExpense.loanRecipientId && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Loan Recipient</label>
                  <div className="bg-orange-50 rounded-lg p-4 mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold">
                        ID
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">Loan Recipient ID</p>
                        <p className="text-sm text-slate-600">{selectedExpense.loanRecipientId}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowExpenseModal(false)}
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