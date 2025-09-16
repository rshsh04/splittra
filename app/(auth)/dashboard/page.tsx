"use client";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import HouseholdSetup from "@/components/householdsetup";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import HomeComponent from "@/components/homecomponent";
import LoadingScreen from "@/components/LoadingScreen";

export default function Home() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.household_id) {
    return <HomeComponent user={user} />;
  }

  return (
    <ProtectedRoute>
      <HouseholdSetup user={user} />
    </ProtectedRoute>
  );
}
