"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { createClient } from "@/lib/supabase/client" 
import { useExpenses } from "@/lib/useExpenses"
import { PlusCircle, Trash2, Edit3, Save, X } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import jsPDF from "jspdf"
import { getUserSubscription } from "@/lib/premiumCheck"

export default function Expenses({ user }: { user: any }) {
  const [hasPremium, setHasPremium] = useState<boolean>(false)
  // Pie chart for analytics
  const AnalyticsDashboard = ({ expenses, usersMap }: any) => {
    const userTotals: Record<string, number> = {}
    expenses.forEach((e: any) => {
      const userName = usersMap[e.userId] || "Unknown"
      userTotals[userName] = (userTotals[userName] || 0) + e.price
    })
    const data = Object.entries(userTotals).map(([name, value]) => ({ name, value }))
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EFF"]

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Expense Categories</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={80} fill="#8884d8" label>
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }


  useEffect(() => {
    let mounted = true
    const fetchSubscription = async () => {
      if (!user?.id) return
      try {
        const res = await getUserSubscription(user.id)
        if (!mounted) return
        setHasPremium(Boolean(res?.hasPremium))
      } catch (err) {
        console.error('Failed to fetch subscription status', err)
      }
    }
    fetchSubscription()
    return () => {
      mounted = false
    }
  }, [user?.id])



  const handleExport = () => {
    const csv = expenses.map(exp => `${exp.name},${exp.price},${exp.info || ''},${exp.date || ''}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'expenses.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Expenses exported as expenses.csv")
  }

  const {
    expenses,
    usersMap,
    loadExpenses,
    addExpense: addExpenseService,
    updateExpense: updateExpenseService,
    deleteExpense: deleteExpenseService,
    clearExpenses: clearExpensesService,
  } = useExpenses(user)

  // Form states
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [info, setInfo] = useState("")
  const [isLoan, setIsLoan] = useState(false)
  const [loanRecipient, setLoanRecipient] = useState("")
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editInfo, setEditInfo] = useState("")
  const [editIsLoan, setEditIsLoan] = useState(false)
  const [editLoanRecipient, setEditLoanRecipient] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Add expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!price || parseFloat(price) <= 0) return

    const payload: any = {
      name,
      price: parseFloat(price),
      info,
      household_id: user.household_id,
      userId: user.id,
      isLoan,
    }

    // Prevent creating a loan to self and ensure recipient is selected
    if (isLoan) {
      if (!loanRecipient) {
        toast.error('Please select a loan recipient')
        return
      }
      if (loanRecipient === user.id) {
        toast.error('You cannot loan to yourself')
        return
      }
      payload.loanRecipientId = loanRecipient
    }

    await addExpenseService(payload)
    setName("")
    setPrice("")
    setInfo("")
    setIsLoan(false)
    setLoanRecipient("")
    loadExpenses()
  }

  const handleExportPDF = () => {
    if (!expenses.length) return
    const doc = new jsPDF()
    doc.text("Household Expenses", 14, 20)
    let y = 30
    expenses.forEach(exp => {
      doc.text(`${exp.name} - $${exp.price} - ${exp.info || ''}`, 14, y)
      y += 10
    })
    doc.save("expenses.pdf")
    toast.success("Expenses exported as expenses.pdf")
  }

  // Edit expense
  const handleEditExpense = (exp: any) => {
    if (exp.userId !== user.id) return
    setEditId(exp.id)
    setEditName(exp.name)
    setEditPrice(exp.price.toString())
    setEditInfo(exp.info || "")
    setEditIsLoan(!!exp.isLoan)
    setEditLoanRecipient(exp.loanRecipientId || "")
  }

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editId || !editPrice || parseFloat(editPrice) <= 0) return

    const payload: any = {
      name: editName,
      price: parseFloat(editPrice),
      info: editInfo,
      isLoan: editIsLoan,
    }

    // Prevent turning into a self-loan and ensure recipient is selected
    if (editIsLoan) {
      if (!editLoanRecipient) {
        toast.error('Please select a loan recipient')
        return
      }
      if (editLoanRecipient === user.id) {
        toast.error('You cannot loan to yourself')
        return
      }
      payload.loanRecipientId = editLoanRecipient
    } else {
      payload.loanRecipientId = null
    }

    await updateExpenseService(editId, payload)
    setEditId(null)
    setEditName("")
    setEditPrice("")
    setEditInfo("")
    setEditIsLoan(false)
    setEditLoanRecipient("")
    loadExpenses()
  }

  // Delete
  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseService(id)
    setDeleteId(null)
    loadExpenses()
  }

  // Clear all expenses
  const handleClearExpenses = async () => {
    await clearExpensesService(user.household_id)
    loadExpenses()
  }

  // Balance calculation (same as before) …
  const calculateBalances = () => {
    const allUserIds = Object.keys(usersMap)
    if (allUserIds.length === 0)
      return { balances: [], message: "No users found", totalRegular: 0, totalLoans: 0 }

    const totalRegular = expenses.filter(e => !e.isLoan).reduce((sum, e) => sum + Number(e.price || 0), 0)
    const perPersonShare = totalRegular / allUserIds.length

    const paidMap: Record<string, number> = {}
    allUserIds.forEach(uid => (paidMap[uid] = 0))
    expenses.filter(e => !e.isLoan).forEach(exp => {
      if (paidMap[exp.userId] !== undefined) paidMap[exp.userId] += Number(exp.price || 0)
    })

    const loanMap: Record<string, number> = {}
    allUserIds.forEach(uid => (loanMap[uid] = 0))
    expenses.filter(e => e.isLoan).forEach(exp => {
      const lender = exp.userId
      const recipient = exp.loanRecipientId
      const amount = Number(exp.price || 0)
      // Ignore any malformed or self-loan records
      if (recipient && recipient !== lender && allUserIds.includes(recipient)) {
        loanMap[lender] += amount
        loanMap[recipient] -= amount
      }
    })

    const balances = allUserIds.map(uid => {
      const paid = paidMap[uid] || 0
      const loansNet = loanMap[uid] || 0
      const finalBalance = paid + loansNet - perPersonShare
      return {
        uid,
        name: usersMap[uid],
        paid,
        owes: perPersonShare,
        loansNet,
        finalBalance,
      }
    })

    const totalLoans = expenses.filter(e => e.isLoan).reduce((sum, e) => sum + Number(e.price || 0), 0)

    let message = ""
    if (totalRegular === 0 && totalLoans === 0) message = "No expenses or loans recorded yet 🏠"
    else {
      message = balances
        .map(b => {
          if (b.finalBalance > 0.01) return `💰${b.name} should receive $${b.finalBalance.toFixed(2)}`
          if (b.finalBalance < -0.01) return `😢${b.name} owes $${Math.abs(b.finalBalance).toFixed(2)}`
          return `${b.name} is settled`
        })
        .join(" | ")
    }

    return { balances, message, totalRegular, totalLoans }
  }
const supabase= createClient();

  useEffect(() => {
    const household_id =  user?.household_id
    console.log("Setting up subscription for household_id:", household_id)
    if (!household_id) return
    loadExpenses()

    // Realtime subscription for expenses changes
    const channel = supabase
      .channel(`expenses-changes-household-${household_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          filter: `household_id=eq.${household_id}`,
        },
        (payload) => {
          console.log("Received payload:", payload)
          loadExpenses()
        },

      )
      .subscribe()

    // Realtime subscription for users (household members) changes
    const usersChannel = supabase
      .channel(`users-changes-household-${household_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `household_id=eq.${household_id}`,
        },
        (payload) => {
          console.log('Users payload:', payload)
          // Refresh expenses and user map when member data changes
          loadExpenses()
        }
      )
      .subscribe()

    return () => {
      try { channel.unsubscribe() } catch (e) {}
      try { usersChannel.unsubscribe() } catch (e) {}
    }
  }, [user?.household_id])


  const { balances, message, totalRegular, totalLoans } = calculateBalances()

  return (
    <section className="flex-1 p-4 lg:p-8">
      <ToastContainer position="top-center" autoClose={5000} />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-lg lg:text-2xl font-medium mb-6">Household Expenses</h1>

        {/* Exports / Premium notice */}
        <div className="rounded-lg border bg-white mb-8">
          <div className="p-6">
            {hasPremium ? (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExport}
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium bg-yellow-400 hover:bg-yellow-500 text-white"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium bg-red-500 hover:bg-purple-600 text-white"
                >
                  Export PDF
                </button>
              </div>
            ) : (
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 font-medium">
                Upgrade to Premium to unlock export feature! 🚀
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border bg-white mb-8">
          <div className="border-b p-6">
            <p className="text-sm text-muted-foreground">Summary</p>
          </div>
          <div className="p-6">
            <div className="rounded-md bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 mb-6 text-center">
              <p className="font-medium">{message}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-md p-4 text-center border bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">${totalRegular.toFixed(2)}</div>
                <div className="text-sm font-medium text-green-600">Total Split Expenses</div>
              </div>
              <div className="rounded-md p-4 text-center border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">${totalLoans.toFixed(2)}</div>
                <div className="text-sm font-medium text-blue-600">Total Loans</div>
              </div>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="rounded-lg border bg-white mb-8">
          <div className="border-b p-6">
            <h2 className="text-base font-medium">Individual Balances</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {balances.map((b) => (
                <div
                  key={b.uid}
                  className="flex justify-between items-center p-4 bg-white rounded-md border"
                >
                  <div>
                    <span className="font-semibold text-slate-800">{b.name}</span>
                    <p className="text-sm text-slate-500 mt-1">
                      Paid: ${b.paid.toFixed(2)} • Owes: ${b.owes.toFixed(2)}
                      {b.loansNet !== 0 && ` • Loans Net: $${b.loansNet.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`font-semibold text-sm px-3 py-1 rounded-full ${
                        b.finalBalance > 0.01
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : b.finalBalance < -0.01
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {b.finalBalance > 0.01 ? '+' : ''}${b.finalBalance.toFixed(2)}
                    </div>
                    <button
                      onClick={async () => {
                        const amt = Math.abs(Number(b.finalBalance || 0))
                        if (amt < 0.01) return
                        const confirmMsg =
                          b.finalBalance > 0
                            ? `Record a settlement where you pay ${b.name} $${amt.toFixed(2)}?`
                            : `Record a settlement where ${b.name} pays you $${amt.toFixed(2)}?`
                        if (!confirm(confirmMsg)) return

                        try {
                          let payload: any
                          if (b.uid === user.id) {
                            toast.error('You cannot settle with yourself')
                            return
                          }
                          if (b.finalBalance > 0) {
                            payload = {
                              name: `Settlement to ${b.name}`,
                              price: amt,
                              household_id: user.household_id,
                              userId: user.id,
                              isLoan: true,
                              loanRecipientId: b.uid,
                            }
                          } else {
                            payload = {
                              name: `Settlement from ${b.name}`,
                              price: amt,
                              household_id: user.household_id,
                              userId: b.uid,
                              isLoan: true,
                              loanRecipientId: user.id,
                            }
                          }

                          await addExpenseService(payload)
                          toast.success('Settlement recorded')
                          loadExpenses()
                        } catch (err: any) {
                          console.error('Failed to record settlement', err)
                          toast.error(err?.message || 'Failed to record settlement')
                        }
                      }}
                      className="text-xs px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border"
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              {showClearConfirm ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 text-sm font-medium">Are you sure? This cannot be undone.</span>
                  <button
                    onClick={handleClearExpenses}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="inline-flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Analytics */}
        {hasPremium ? (
          <div className="rounded-lg border bg-white mb-8">
            <div className="border-b p-6">
              <h2 className="text-base font-medium">Analytics</h2>
            </div>
            <div className="p-6">
              <AnalyticsDashboard expenses={expenses} usersMap={usersMap} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white mb-8">
            <div className="p-6">
              <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 font-medium">
                Upgrade to Premium to unlock analytics feature! 🚀
              </div>
            </div>
          </div>
        )}

        {/* Add Expense */}
        <div className="rounded-lg border bg-white mb-8">
          <div className="border-b p-6">
            <h2 className="text-base font-medium">Add New Expense</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input
                type="text"
                placeholder="Expense name (e.g., Groceries, Utilities)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount ($)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <textarea
                placeholder="Additional notes (optional)"
                value={info}
                onChange={(e) => setInfo(e.target.value)}
                rows={2}
                className="w-full border bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLoan}
                  onChange={(e) => setIsLoan(e.target.checked)}
                  className="h-5 w-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-slate-800 text-sm">This is a loan</span>
              </label>
              {isLoan && (
                <select
                  value={loanRecipient}
                  onChange={(e) => setLoanRecipient(e.target.value)}
                  className="w-full border bg-white text-slate-800 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a household member</option>
                  {Object.entries(usersMap)
                    .filter(([id]) => id !== user.id)
                    .map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                </select>
              )}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-medium"
              >
                <PlusCircle className="w-5 h-5" /> Add Expense
              </button>
            </form>
          </div>
        </div>

        {/* Expenses List */}
        <div className="rounded-lg border bg-white mb-8">
          <div className="border-b p-6">
            <h2 className="text-base font-medium">All Expenses</h2>
          </div>
          <div className="p-6">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 text-5xl mb-4">📊</div>
                <p className="text-slate-500">No expenses recorded yet</p>
                <p className="text-slate-400 text-sm">Add your first expense above to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.map((exp) => (
                  <div key={exp.id} className="border rounded-md p-4 bg-white">
                    {editId === exp.id ? (
                      <form onSubmit={handleUpdateExpense} className="space-y-4">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border bg-white text-slate-800 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full border bg-white text-slate-800 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <textarea
                          value={editInfo}
                          onChange={(e) => setEditInfo(e.target.value)}
                          className="w-full border bg-white text-slate-800 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsLoan}
                            onChange={(e) => setEditIsLoan(e.target.checked)}
                            className="h-5 w-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-slate-800 text-sm">This is a loan</span>
                        </label>
                        {editIsLoan && (
                          <select
                            value={editLoanRecipient}
                            onChange={(e) => setEditLoanRecipient(e.target.value)}
                            className="w-full border bg-white text-slate-800 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select a household member</option>
                            {Object.entries(usersMap)
                              .filter(([id]) => id !== user.id)
                              .map(([id, name]) => (
                                <option key={id} value={id}>
                                  {name}
                                </option>
                              ))}
                          </select>
                        )}
                        <div className="flex gap-3">
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="inline-flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded-md text-sm"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">{exp.name}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600">
                              <span className="font-medium">Paid by:</span> {usersMap[exp.userId] || 'Unknown'}
                            </p>
                            {exp.isLoan && exp.loanRecipientId && (
                              <p className="text-sm text-blue-600 font-medium">🔗 Loan to: {usersMap[exp.loanRecipientId]}</p>
                            )}
                            {exp.info && <p className="text-sm text-slate-500 italic">{exp.info}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-xl font-semibold text-slate-800">${exp.price}</span>
                          <div className="flex gap-2">
                            {exp.userId === user.id && (
                              <button
                                onClick={() => handleEditExpense(exp)}
                                className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 px-3 py-1 rounded-md hover:bg-blue-50 text-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                                Edit
                              </button>
                            )}
                            {deleteId === exp.id ? (
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
                              >
                                Confirm Delete
                              </button>
                            ) : (
                              <button
                                onClick={() => setDeleteId(exp.id)}
                                className="text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-3 py-1 rounded-md hover:bg-red-50 text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
