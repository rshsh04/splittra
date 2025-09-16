"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { createClient } from "@/lib/supabase/client" 
import { useExpenses } from "@/lib/useExpenses"
import { PlusCircle, Trash2, Edit3, Save, X } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import jsPDF from "jspdf"

export default function Expenses({ user }: { user: any }) {
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

  const hasPremium = user?.premiumUntil && new Date(user.premiumUntil) > new Date()

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

    if (isLoan && loanRecipient) payload.loanRecipientId = loanRecipient

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

    if (editIsLoan && editLoanRecipient) payload.loanRecipientId = editLoanRecipient
    else payload.loanRecipientId = null

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
      if (recipient && allUserIds.includes(recipient)) {
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

    return () => {
      try { channel.unsubscribe() } catch (e) {}
    }
  }, [user?.household_id])


  const { balances, message, totalRegular, totalLoans } = calculateBalances()

return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 ">
      {/* Premium badge */}
      <ToastContainer
        position="top-center"
        autoClose={5000}
      />
      {/* Premium-only export button */}
      <div style={{ marginBottom: 16 }}>

  {hasPremium ? (
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Export PDF
            </button>
          </div>
        ) : (
          <div className="text-center p-4 mb-12 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-medium">
            Upgrade to Premium to unlock export feature! 🚀
          </div>
        ) }


      </div>
      <div className="max-w-4xl mx-auto space-y-8">
  {/* Analytics Pie Chart */}
 
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Household Expenses</h1>
          <p className="text-slate-600">Track and split expenses with your household</p>
        </div>



        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-6 text-center">
            <p className="font-medium text-lg">{message}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 text-center border border-green-200">
              <div className="text-3xl font-bold text-green-700 mb-1">${totalRegular.toFixed(2)}</div>
              <div className="text-sm font-medium text-green-600">Total Split Expenses</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-700 mb-1">${totalLoans.toFixed(2)}</div>
              <div className="text-sm font-medium text-blue-600">Total Loans</div>
            </div>
          </div>

          {/* Balances */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-4 text-lg">Individual Balances</h4>
            <div className="space-y-3">
              {balances.map(b => (
                <div
                  key={b.uid}
                  className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-slate-200"
                >
                  <div>
                    <span className="font-semibold text-slate-800 text-lg">{b.name}</span>
                    <p className="text-sm text-slate-500 mt-1">
                      Paid: ${b.paid.toFixed(2)} • Owes: ${b.owes.toFixed(2)}
                      {b.loansNet !== 0 && ` • Loans Net: $${b.loansNet.toFixed(2)}`}
                    </p>
                  </div>
                  <div
                    className={`font-bold text-lg px-4 py-2 rounded-full ${b.finalBalance > 0.01
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : b.finalBalance < -0.01
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                  >
                    {b.finalBalance > 0.01 ? "+" : ""}${b.finalBalance.toFixed(2)}
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
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
              {hasPremium?(
        <AnalyticsDashboard expenses={expenses} usersMap={usersMap} />
              ) : <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-medium">
                Upgrade to Premium to unlock analytics feature! 🚀
              </div>}
        {/* Add Expense */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <input
              type="text"
              placeholder="Expense name (e.g., Groceries, Utilities)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount ($)"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <textarea
              placeholder="Additional notes (optional)"
              value={info}
              onChange={e => setInfo(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isLoan}
                onChange={e => setIsLoan(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-slate-800 font-medium">This is a loan</span>
            </label>
            {isLoan && (
              <select
                value={loanRecipient}
                onChange={e => setLoanRecipient(e.target.value)}
                className="w-full border border-slate-300 bg-white text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="w-5 h-5" /> Add Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">All Expenses</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 text-6xl mb-4">📊</div>
              <p className="text-slate-500 text-lg">No expenses recorded yet</p>
              <p className="text-slate-400 text-sm">Add your first expense above to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map(exp => (
                <div
                  key={exp.id}
                  className="border border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  {editId === exp.id ? (
                    <form onSubmit={handleUpdateExpense} className="space-y-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full border border-slate-300 bg-white text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-full border border-slate-300 bg-white text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <textarea
                        value={editInfo}
                        onChange={e => setEditInfo(e.target.value)}
                        className="w-full border border-slate-300 bg-white text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsLoan}
                          onChange={e => setEditIsLoan(e.target.checked)}
                          className="h-5 w-5 text-blue-600 border-2 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-slate-800 font-medium">This is a loan</span>
                      </label>
                      {editIsLoan && (
                        <select
                          value={editLoanRecipient}
                          onChange={e => setEditLoanRecipient(e.target.value)}
                          className="w-full border border-slate-300 bg-white text-slate-800 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="flex items-center gap-2 bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-xl mb-1">{exp.name}</h3>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Paid by:</span> {usersMap[exp.userId] || "Unknown"}
                          </p>
                          {exp.isLoan && exp.loanRecipientId && (
                            <p className="text-sm text-blue-600 font-medium">
                              🔗 Loan to: {usersMap[exp.loanRecipientId]}
                            </p>
                          )}
                          {exp.info && (
                            <p className="text-sm text-slate-500 italic">{exp.info}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 ml-4">
                        <span className="text-2xl font-bold text-slate-800">${exp.price}</span>
                        <div className="flex space-x-2">
                          {exp.userId === user.id && (
                            <button
                              onClick={() => handleEditExpense(exp)}
                              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span className="text-sm font-medium">Edit</span>
                            </button>
                          )}
                          {deleteId === exp.id ? (
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteId(exp.id)}
                              className="text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Delete</span>
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
  )
}
