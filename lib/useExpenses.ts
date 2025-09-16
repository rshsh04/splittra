"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  fetchExpenses,
  fetchUsers,
  addExpense,
  updateExpense,
  deleteExpense,
  clearExpenses,
} from "@/lib/expensesService"

export function useExpenses(user: any) {
  const [expenses, setExpenses] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<{ [key: string]: string }>({})
  const supabase = createClient()

  // Load expenses
  const loadExpenses = async () => {
    const household_id = user?.household_id
    if (!household_id) return

    // 1. Load expenses
    const res = await fetchExpenses(household_id)
    setExpenses(res)

    // 2. Fetch household to get members
    const { data: household, error: householdError } = await supabase
      .from('household')
      .select('members')
      .eq('id', household_id)
      .maybeSingle()

    if (householdError || !household) return
    const memberIds: number[] = household.members || []

    // 3. Fetch all users in the household
    if (memberIds.length > 0) {
      const usersRes = await fetchUsers(memberIds)
      const map: { [key: string]: string } = {}
      usersRes.forEach((u: any) => {
        map[u.id] = u.name || u.email
      })
      setUsersMap(map)
    }
  }

  return {
    expenses,
    usersMap,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    clearExpenses,
  }
}
