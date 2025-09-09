"use client"

import { useState, useEffect } from "react"
import { useExpenses } from "@/lib/useExpenses"

export default function Expenses({ user }: { user: any }) {
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
      householdId: user.householdId,
      userId: user.$id,
      isLoan,
    }

    if (isLoan && loanRecipient) payload.loanRecipientId = loanRecipient

    await addExpenseService(payload)
    setName(""); setPrice(""); setInfo(""); setIsLoan(false); setLoanRecipient("")
    loadExpenses()
  }

  // Edit expense
  const handleEditExpense = (exp: any) => {
    if (exp.userId !== user.$id) return
    setEditId(exp.$id)
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
    setEditId(null); setEditName(""); setEditPrice(""); setEditInfo(""); setEditIsLoan(false); setEditLoanRecipient("")
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
    await clearExpensesService(user.householdId)
    loadExpenses()
  }

  // Calculate balances
const calculateBalances = () => {
  const allUserIds = Object.keys(usersMap)
  if (allUserIds.length === 0) return { balances: [], message: "No users found", totalRegular: 0, totalLoans: 0 }

  const totalRegular = expenses
    .filter(e => !e.isLoan)
    .reduce((sum, e) => sum + Number(e.price || 0), 0)

  const perPersonShare = totalRegular / allUserIds.length

  // Track how much each user has paid
  const paidMap: Record<string, number> = {}
  allUserIds.forEach(uid => paidMap[uid] = 0)
  expenses.filter(e => !e.isLoan).forEach(exp => {
    if (paidMap[exp.userId] !== undefined) paidMap[exp.userId] += Number(exp.price || 0)
  })

  // Track loan adjustments
  const loanMap: Record<string, number> = {}
  allUserIds.forEach(uid => loanMap[uid] = 0)
  expenses.filter(e => e.isLoan).forEach(exp => {
    const lender = exp.userId
    const recipient = exp.loanRecipientId
    const amount = Number(exp.price || 0)
    if (recipient && allUserIds.includes(recipient)) {
      loanMap[lender] += amount
      loanMap[recipient] -= amount
    }
  })

  // Compute balances for ALL users, even if they haven't added expenses
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

  // Build message summary
  let message = ""
  if (totalRegular === 0 && totalLoans === 0) message = "No expenses or loans recorded yet 🏠"
  else {
    message = balances.map(b => {
      if (b.finalBalance > 0.01) return `💰${b.name} should receive $${b.finalBalance.toFixed(2)}`
      if (b.finalBalance < -0.01) return `😢${b.name} owes $${Math.abs(b.finalBalance).toFixed(2)}`
      return `${b.name} is settled`
    }).join(" | ")
  }

  return { balances, message, totalRegular, totalLoans }
}







  const { balances, message, totalRegular, totalLoans } = calculateBalances()

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-100 mb-6 text-center">Household Expenses</h1>

        {/* Summary */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="bg-indigo-700 text-white rounded-xl p-4 mb-4 text-center">
            <p className="font-medium">{message}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-green-400">${totalRegular.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total Split Expenses</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">${totalLoans.toFixed(2)}</div>
              <div className="text-sm text-gray-400">Total Loans</div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 mb-4 border border-gray-700">
            <h4 className="font-semibold text-gray-200 mb-3">Individual Balances</h4>
            <div className="space-y-2">
              {balances.map(b => (
                <div key={b.uid} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-100">{b.name}</span>
                    <span className="text-xs text-gray-400">
                      Paid: ${b.paid.toFixed(2)} | Owes: ${b.owes.toFixed(2)}
                      {b.loansNet !== 0 && ` | Loans Net: $${b.loansNet.toFixed(2)}`}
                    </span>
                  </div>
                  <div className={`font-bold text-lg px-3 py-1 rounded-full ${b.finalBalance > 0.01 ? 'bg-green-900 text-green-400' : b.finalBalance < -0.01 ? 'bg-red-900 text-red-400' : 'bg-gray-800 text-gray-300'}`}>
                    {b.finalBalance > 0.01 ? '+' : ''}${b.finalBalance.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleClearExpenses} className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium">Clear Expenses</button>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Add New Expense</h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <input type="text" placeholder="Expense name" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-4 py-3 rounded-xl" required />
            <input type="number" step="0.01" min="0.01" placeholder="Amount ($)" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-4 py-3 rounded-xl" required />
            <textarea placeholder="Additional info" value={info} onChange={e => setInfo(e.target.value)} rows={2} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-4 py-3 rounded-xl" />
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={isLoan} onChange={e => setIsLoan(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-700 rounded" />
              <span className="text-sm text-gray-100">This is a loan</span>
            </label>
            {isLoan && (
              <select value={loanRecipient} onChange={e => setLoanRecipient(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-4 py-3 rounded-xl" required>
                <option value="">Select a user</option>
                {Object.entries(usersMap).filter(([id]) => id !== user.$id).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            )}
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold">Add Expense</button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">All Expenses</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No expenses recorded yet</p>
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => (
                <div key={exp.$id} className="border border-gray-700 rounded-xl p-4 bg-gray-950">
                  {editId === exp.$id ? (
                    <form onSubmit={handleUpdateExpense} className="space-y-3">
                      <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-3 py-2 rounded-lg" required />
                      <input type="number" step="0.01" min="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-3 py-2 rounded-lg" required />
                      <textarea value={editInfo} onChange={e => setEditInfo(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-3 py-2 rounded-lg" rows={2} />
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={editIsLoan} onChange={e => setEditIsLoan(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-700 rounded" />
                        <span className="text-sm text-gray-100">This is a loan</span>
                      </label>
                      {editIsLoan && (
                        <select value={editLoanRecipient} onChange={e => setEditLoanRecipient(e.target.value)} className="w-full border border-gray-700 bg-gray-950 text-gray-100 px-3 py-2 rounded-lg" required>
                          <option value="">Select a user</option>
                          {Object.entries(usersMap).filter(([id]) => id !== user.$id).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                          ))}
                        </select>
                      )}
                      <div className="flex space-x-2">
                        <button type="submit" className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium">Save</button>
                        <button type="button" onClick={() => setEditId(null)} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-100">{exp.name}</h3>
                        <p className="text-xs text-gray-500">Paid by: {usersMap[exp.userId] || "Unknown"}</p>
                        {exp.isLoan && exp.loanRecipientId && <p className="text-xs text-blue-400">Loan to: {usersMap[exp.loanRecipientId]}</p>}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-gray-100">${exp.price}</span>
                        <div className="flex space-x-1">
                          <button onClick={() => handleEditExpense(exp)} className="text-blue-400 hover:text-blue-300">Edit</button>
                          {deleteId === exp.$id ? (
                            <button onClick={() => handleDeleteExpense(exp.$id)} className="text-red-400 bg-red-900 px-2 rounded">Confirm</button>
                          ) : (
                            <button onClick={() => setDeleteId(exp.$id)} className="text-red-400">Delete</button>
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
