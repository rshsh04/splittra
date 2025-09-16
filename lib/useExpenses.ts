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
    const householdId = user?.household_id ?? user?.householdId
    if (!householdId) return

    // 1. Load expenses
    const res = await fetchExpenses(householdId)
    setExpenses(res)

    // 2. Fetch household to get members
    const { data: household, error: householdError } = await supabase
      .from('household')
      .select('members')
      .eq('id', householdId)
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

  useEffect(() => {
    const householdId = user?.household_id ?? user?.householdId
    if (!householdId) return
    loadExpenses()

    // Realtime subscription for expenses changes
    const channel = supabase
      .channel(`expenses-changes-household-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `householdId=eq.${householdId}`,
        },
        () => {
          loadExpenses()
        }
      )
      .subscribe()

    return () => {
      try { channel.unsubscribe() } catch (e) {}
    }
  }, [user?.householdId])

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
