"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import HouseholdSetup from "@/components/householdsetup";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import HomeComponent from "@/components/homecomponent";
import LoadingScreen from "@/components/LoadingScreen";
import { fetchHouseholdsForUser, setCurrentHousehold } from "@/lib/expensesService";
import { toast } from "react-toastify";

export default function Home() {
  const { user, loading } = useSupabaseUser();

  // Auto-select a household if user is in one or more but none is active
  useEffect(() => {
    const run = async () => {
      if (loading) return
      if (!user?.id) return
      if (user.current_household_id) return
      try {
        const list = await fetchHouseholdsForUser(user.id)
        if (!list || list.length === 0) return
        // Prefer owned household, otherwise first in list
        const owned = list.find((h: any) => String(h.owner_id) === String(user.id))
        const chosen = owned || list[0]
        await setCurrentHousehold(user.id, chosen.id)
        // Refresh UI state
        if (typeof window !== 'undefined') window.location.reload()
      } catch (e: any) {
        // If blocked by premium rule or other error, just continue to setup screen
        console.error('Auto-select household failed', e)
        toast?.info?.('Could not auto-select a household')
      }
    }
    run()
  }, [user?.id, user?.current_household_id, loading])

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.current_household_id) {
    return <HomeComponent user={user} />;
  }

  return (
    <ProtectedRoute>
      <HouseholdSetup user={user} />
    </ProtectedRoute>
  );
}
