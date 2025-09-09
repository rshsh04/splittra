"use client"

import { useEffect, useState } from "react"
import { client, databases } from "@/lib/appwrite"
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

  // Load expenses
const loadExpenses = async () => {
  if (!user?.householdId) return

  // 1. Load expenses
  const res = await fetchExpenses(user.householdId)
  setExpenses(res.documents)

  // 2. Fetch household document to get all members
  const householdRes = await databases.getDocument(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
    process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
    user.householdId
  )

  const memberIds: string[] = householdRes.members || []

  // 3. Fetch all users in the household
  if (memberIds.length > 0) {
    const usersRes = await fetchUsers(memberIds)
    const map: { [key: string]: string } = {}
    usersRes.documents.forEach((u: any) => (map[u.$id] = u.name || u.email))
    setUsersMap(map)
  }
}


  useEffect(() => {
    if (!user?.householdId) return
    loadExpenses()

    const unsubscribe = client.subscribe(
      [`databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE}.collections.${process.env.NEXT_PUBLIC_APPWRITE_EXPENSES_COLLECTION}.documents`],
      () => loadExpenses()
    )

    return () => unsubscribe()
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
