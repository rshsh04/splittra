"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  fetchExpenses,
  fetchUsers,
  fetchHouseholdById,
  fetchHouseholdMembers,
  addExpense,
  updateExpense,
  deleteExpense,
  clearExpenses,
} from "@/lib/expensesService"

export function useExpenses(user: any) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // keep supabase client locally for other needs, but rely on helpers
  const supabase = createClient()

  // Load expenses
  const loadExpenses = async () => {
    const household_id = user?.current_household_id
    if (!household_id) return

    setLoading(true)
    setError(null)
    try {
      // 1. Load expenses
      const res = await fetchExpenses(household_id)
      setExpenses(res)

      // 2. Fetch household to get members (and meta) via helper
      // 2b. Fetch members using membership table
      const members = await fetchHouseholdMembers(household_id)
      if ((members || []).length > 0) {
        const usersMapObj: { [key: string]: string } = {}
        ;(members || []).forEach((u: any) => {
          usersMapObj[u.id?.toString?.() ?? String(u.id)] = u.name || u.email || ''
        })
        setUsersMap(usersMapObj)
      } else {
        setUsersMap({})
      }
    } catch (err: any) {
      console.error('Error loading expenses or members:', err)
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  // Auto-load when household changes
  useEffect(() => {
    if (user?.current_household_id) {
      loadExpenses()
    } else {
      setExpenses([])
      setUsersMap({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.current_household_id])

  return {
    expenses,
    usersMap,
    loading,
    error,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    clearExpenses,
  }
}
