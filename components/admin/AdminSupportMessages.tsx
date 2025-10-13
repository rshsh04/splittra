'use client'
import { useState, useEffect, useCallback } from 'react'
import { 
  MessageSquare, 
  Clock, 
  Search,
  Reply,
  Eye,
  Calendar,
  X,
  Send
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAdmin } from '@/lib/admin/AdminContext'
import { createClient } from '@/lib/supabase/client'

interface SupportMessage {
  id: number
  created_at: string
  updated_at: string
  name: string
  email: string
  message: string
  locale: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  admin_notes?: string
  assigned_to?: number
  replied_at?: string
  response_message?: string
  responder_user_id?: number
  assigned_to_user?: {
    id: number
    name: string
    email: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminSupportMessages() {
  const { user } = useAdmin()
  const supabase = createClient()
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  })

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      
      // Build query directly with Supabase
      let query = supabase
        .from('support_messages')
        .select(`
          *,
          assigned_to_user:assigned_to(id, name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,message.ilike.%${filters.search}%`)
      }

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit
      query = query.range(offset, offset + pagination.limit - 1)

      const { data: messages, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      setMessages(messages || [])
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit)
      }))
    } catch (error: unknown) {
      console.error('Failed to fetch support messages:', error)
      toast.error('Failed to load support messages')
    } finally {
      setLoading(false)
    }
  }, [supabase, filters.status, filters.priority, filters.search, pagination.page, pagination.limit])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const updateMessageStatus = async (messageId: number, status: string, priority?: string) => {
    try {
      const { data: updatedMessage, error } = await supabase
        .from('support_messages')
        .update({ 
          status, 
          ...(priority && { priority }),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select(`
          *,
          assigned_to_user:assigned_to(id, name, email)
        `)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
      
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(updatedMessage)
      }

      toast.success('Message updated successfully')
    } catch (error: unknown) {
      console.error('Failed to update message:', error)
      toast.error('Failed to update message')
    }
  }

  const sendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return

    try {
      setReplying(true)
      
      // Update the message status and add reply timestamp
      const { data: updatedMessage, error } = await supabase
        .from('support_messages')
        .update({ 
          status: 'closed',
          replied_at: new Date().toISOString(),
          response_message: replyText.trim(),
          responder_user_id: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id)
        .select(`
          *,
          assigned_to_user:assigned_to(id, name, email)
        `)
        .single()

      if (error) {
        throw new Error(error.message)
      }
      
      // Update the message in the list
      setMessages(prev => prev.map(msg => 
        msg.id === selectedMessage.id ? updatedMessage : msg
      ))
      
      setSelectedMessage(updatedMessage)
      setReplyText('')
      setShowReplyModal(false)
      
      toast.success('Reply sent successfully!')
    } catch (error: unknown) {
      console.error('Failed to send reply:', error)
      toast.error('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'closed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Support Messages</h2>
            <p className="text-sm text-slate-600">Manage and respond to customer inquiries</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Total: {pagination.total}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
          >
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No messages found</h3>
            <p className="text-slate-600">There are no support messages matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {messages.map((message) => (
              <div key={message.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-800 truncate">{message.name}</h3>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(message.status)}`}>
                        {message.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{message.email}</p>
                    <p className="text-sm text-slate-700 line-clamp-2 mb-3">{message.message}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </span>
                      {message.replied_at && (
                        <span className="flex items-center gap-1">
                          <Reply className="w-3 h-3" />
                          Replied {formatDate(message.replied_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMessage(message)}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>
                    {message.status === 'open' && (
                      <button
                        onClick={() => updateMessageStatus(message.id, 'in_progress')}
                        className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors"
                        title="Mark In Progress"
                      >
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </button>
                    )}
                    {message.status !== 'closed' && (
                      <button
                        onClick={() => {
                          setSelectedMessage(message)
                          setShowReplyModal(true)
                        }}
                        className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} messages
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && !showReplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Name</label>
                  <p className="text-slate-800">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <p className="text-slate-800">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="mt-1">
                    <select
                      value={selectedMessage.status}
                      onChange={(e) => updateMessageStatus(selectedMessage.id, e.target.value)}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Priority</label>
                  <div className="mt-1">
                    <select
                      value={selectedMessage.priority}
                      onChange={(e) => updateMessageStatus(selectedMessage.id, selectedMessage.status, e.target.value)}
                      className="px-3 py-1 rounded-lg border border-slate-200 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Message</label>
                <div className="mt-1 p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-800 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              {selectedMessage.response_message && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Response</label>
                  <div className="mt-1 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-slate-800 whitespace-pre-wrap">{selectedMessage.response_message}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(selectedMessage.created_at)}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(selectedMessage.updated_at)}
                </div>
              </div>
              {selectedMessage.replied_at && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Replied:</span> {formatDate(selectedMessage.replied_at)}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {selectedMessage.status !== 'closed' && (
                <button
                  onClick={() => setShowReplyModal(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Reply to {selectedMessage.name}</h3>
              <button
                onClick={() => {
                  setShowReplyModal(false)
                  setReplyText('')
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-600 mb-2">Original message:</p>
                <p className="text-slate-800 text-sm">{selectedMessage.message}</p>
              </div>
              <div>
                <label htmlFor="reply" className="block text-sm font-medium text-slate-600 mb-2">
                  Your Reply
                </label>
                <textarea
                  id="reply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowReplyModal(false)
                  setReplyText('')
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || replying}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {replying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}