"use client"

import { createClient } from '@/lib/supabase/client';
import { getUserSubscription } from '@/lib/premiumCheck'

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
  const supabase = createClient();
  const { data: memberRows, error: mErr } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('household_id', household_id);
  if (mErr) throw mErr;
  const ids = (memberRows || []).map((r: any) => r.user_id);
  if (!ids || ids.length === 0) return [];
  return await fetchUsers(ids);
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

// List all households for a user via membership table
export async function fetchHouseholdsForUser(user_id: number | string, current_household_id?: number | string | null) {
  const supabase = createClient();
  const { data: memberRows, error: mErr } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user_id);
  if (mErr) throw mErr;
  const ids = (memberRows || []).map((r: any) => r.household_id);
  if (ids && ids.length > 0) {
    const { data: households, error: hErr } = await supabase
      .from('household')
      .select('*')
      .in('id', ids);
    if (hErr) throw hErr;
    return households || [];
  }

  // Fallbacks for legacy/backfill timing
  const results: any[] = [];
  try {
    const { data: owned } = await supabase
      .from('household')
      .select('*')
      .eq('owner_id', user_id);
    if (owned && owned.length) results.push(...owned);
  } catch {}

  try {
    const { data: memberOf } = await supabase
      .from('household')
      .select('*')
      .contains('members', [user_id as any]);
    if (memberOf && memberOf.length) results.push(...memberOf);
  } catch {}

  if (current_household_id) {
    try {
      const { data: current } = await supabase
        .from('household')
        .select('*')
        .eq('id', current_household_id)
        .maybeSingle();
      if (current) results.push(current);
    } catch {}
  }

  const byId: Record<string, any> = {};
  for (const h of results) { if (h && h.id != null) byId[String(h.id)] = h; }
  return Object.values(byId);
}

// Update the user's current household selection
export async function setCurrentHousehold(user_id: number | string, household_id: number | string | null) {
  const supabase = createClient();

  // If attempting to switch (not clear), enforce non-premium limit
  if (household_id) {
    try {
      const [{ hasPremium }, householdsRes, currentRow] = await Promise.all([
        getUserSubscription(user_id),
        fetchHouseholdsForUser(user_id),
        supabase.from('users').select('current_household_id').eq('id', user_id).maybeSingle(),
      ])

      const currentId = (currentRow && 'data' in currentRow ? (currentRow as any).data?.current_household_id : (currentRow as any)?.current_household_id) || null
  const hadNone = currentId == null
  const isChanging = String(currentId ?? '') !== String(household_id)
      const households = Array.isArray(householdsRes) ? householdsRes : []

      // Allow first-time selection (hadNone). Block only subsequent switches.
      if (!hasPremium && isChanging && !hadNone && households.length > 1) {
        throw new Error('Premium required to switch households')
      }
    } catch (e) {
      // If guard fails, propagate a clear error
      // eslint-disable-next-line no-throw-literal
      throw e
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({ current_household_id: household_id })
    .eq('id', user_id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Fetch current app user row and include list of households via membership table
export async function fetchCurrentUserWithHouseholds(authEmail?: string) {
  const supabase = createClient();
  // Resolve the user row by auth email if provided; otherwise rely on auth.getUser client-side
  let userRow: any = null;
  if (authEmail) {
    const { data: rows, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', authEmail)
      .limit(1);
    if (error) throw error;
    userRow = rows && rows[0] ? rows[0] : null;
  }
  if (!userRow) return { user: null, households: [] };

  const { data: memberRows, error: mErr } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', userRow.id);
  if (mErr) throw mErr;
  const ids = (memberRows || []).map((r: any) => r.household_id);
  if (!ids || ids.length === 0) return { user: userRow, households: [] };
  const { data: households, error: hErr } = await supabase
    .from('household')
    .select('*')
    .in('id', ids);
  if (hErr) throw hErr;
  return { user: userRow, households: households || [] };
}
