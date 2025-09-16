"use client"

import { createClient } from '@/lib/supabase/client';

// Fetch expenses by householdId
export async function fetchExpenses(householdId: number | string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('householdId', householdId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Fetch users by array of user ids
export async function fetchUsers(userIds: Array<number | string>) {
  if (!userIds || userIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);
  if (error) throw error;
  return data || [];
}

// Add expense
export async function addExpense(payload: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .insert(payload);
  if (error) throw error;
  return data;
}

// Update expense
export async function updateExpense(id: number | string, payload: any) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id);
  if (error) throw error;
  return data;
}

// Delete expense
export async function deleteExpense(id: number | string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return data;
}

// Clear all household expenses
export async function clearExpenses(household_id: number | string) {
  const expenses = await fetchExpenses(household_id);
  for (const exp of expenses) {
    await deleteExpense(exp.id);
  }
}
