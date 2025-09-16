"use client"

import { createClient } from '@/lib/supabase/client';

// Fetch expenses by household_id
export async function fetchExpenses(household_id: number | string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('household_id', household_id)
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

// Fetch household by id (returns maybe single)
export async function fetchHouseholdById(household_id: number | string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .eq('id', household_id)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// Fetch household by invite code
export async function fetchHouseholdByCode(code: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .eq('code', code)
    .limit(1);
  if (error) throw error;
  return (data && data.length > 0) ? data[0] : null;
}

// Fetch household by owner id
export async function fetchHouseholdByOwner(owner_id: number | string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household')
    .select('*')
    .eq('owner_id', owner_id)
    .limit(1);
  if (error) throw error;
  return (data && data.length > 0) ? data[0] : null;
}

// Fetch household members as user records
export async function fetchHouseholdMembers(household_id: number | string) {
  const household = await fetchHouseholdById(household_id);
  if (!household) return [];
  const memberIds: any[] = household.members || [];
  if (memberIds.length === 0) return [];
  return await fetchUsers(memberIds);
}

// Update household members array
export async function updateHouseholdMembers(household_id: number | string, members: Array<number | string>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('household')
    .update({ members })
    .eq('id', household_id)
    .select();
  if (error) throw error;
  return data;
}

// Update user's household_id
export async function updateUserHousehold(user_id: number | string, household_id: number | string | null) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .update({ household_id })
    .eq('id', user_id)
    .select();
  if (error) throw error;
  return data;
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
