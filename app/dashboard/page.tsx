"use client";
import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import HouseholdSetup from "@/components/householdsetup";
import useAppwriteUser from "@/hooks/useAppwriteUser";
import HomeComponent from "@/components/homecomponent";

export default function Home() {
  const { user, loading } = useAppwriteUser();

  if (loading) {
    return <div className="p-4 text-gray-500">Loading user...</div>;
  }

  if (user?.householdId) {
    return <HomeComponent user={user} />;
  }

  return (
    <ProtectedRoute>
      <HouseholdSetup user={user} />
    </ProtectedRoute>
  );
}
