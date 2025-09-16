"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  fetchExpenses,
  fetchUsers,
  fetchHouseholdById,
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
    const household_id = user?.household_id
    if (!household_id) return

    setLoading(true)
    setError(null)
    try {
      // 1. Load expenses
      const res = await fetchExpenses(household_id)
      setExpenses(res)

      // 2. Fetch household to get members (and meta) via helper
      const household = await fetchHouseholdById(household_id)
      if (!household) {
        setUsersMap({})
        setLoading(false)
        return
      }

      const memberIds: any[] = household.members || []

      // 3. Fetch all users in the household via helper
      if (memberIds.length > 0) {
        const usersRes = await fetchUsers(memberIds)
        const usersMapObj: { [key: string]: string } = {}
        ;(usersRes || []).forEach((u: any) => {
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
    if (user?.household_id) {
      loadExpenses()
    } else {
      setExpenses([])
      setUsersMap({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.household_id])

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
