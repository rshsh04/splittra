"use client"

import { databases, ID, Query } from "@/lib/appwrite"

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE!
const expensesCollection = process.env.NEXT_PUBLIC_APPWRITE_EXPENSES_COLLECTION!
const usersCollection = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!

// Fetch expenses
export async function fetchExpenses(householdId: string) {
  return await databases.listDocuments(databaseId, expensesCollection, [
    Query.equal("householdId", [householdId]),
  ])
}

// Fetch users
export async function fetchUsers(userIds: string[]) {
  if (!userIds || userIds.length === 0) return { documents: [] }

  return await databases.listDocuments(
    process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
    process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
    [
      Query.equal("$id", userIds)
    ]
  )
}

// Add expense
export async function addExpense(payload: any) {
  return await databases.createDocument(databaseId, expensesCollection, ID.unique(), payload)
}

// Update expense
export async function updateExpense(id: string, payload: any) {
  return await databases.updateDocument(databaseId, expensesCollection, id, payload)
}

// Delete expense
export async function deleteExpense(id: string) {
  return await databases.deleteDocument(databaseId, expensesCollection, id)
}

// Clear all household expenses
export async function clearExpenses(householdId: string) {
  const res = await fetchExpenses(householdId)
  for (const exp of res.documents) {
    await deleteExpense(exp.$id)
  }
}
