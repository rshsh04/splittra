"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import HouseholdSetup from "@/components/householdsetup";
import useAppwriteUser from "@/hooks/useAppwriteUser";
import HomeComponent from "@/components/homecomponent";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "react-toastify";

function DashboardContent() {
  const { user, loading } = useAppwriteUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Payment successful! You are now premium.");
    }
  }, [searchParams]);

  if (loading) {
    return <LoadingScreen />;
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

export default function dashboard() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

